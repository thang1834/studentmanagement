/**
 * TEACHERS - Nhiều giáo viên dùng chung bot, mỗi người một Google Sheet riêng
 *
 * - Admin: user ID Telegram trong Script Properties ADMIN_IDS (cách nhau bằng dấu phẩy);
 *   chưa đặt ADMIN_IDS thì dùng TEST_CHAT_ID. Admin dùng file gốc (file chứa script) làm dữ liệu
 *   của mình, quản lý sổ giáo viên (sheet GIÁO VIÊN trong file gốc), xem tổng hợp mọi thầy
 *   (/thong_ke, /xem_no) và vào dữ liệu của một thầy bằng /chon_gv.
 * - Giáo viên: mỗi dòng trong sheet GIÁO VIÊN gồm user ID Telegram + ID Google Sheet riêng.
 *   Mọi lệnh của thầy đọc/ghi vào Sheet của thầy đó (xem getDb).
 *
 * Ngữ cảnh (TENANT.current) được đặt ở doPost sau khi kiểm tra quyền, hoặc bằng withTeacher()
 * khi trigger/thống kê chạy lần lượt cho từng thầy. Chạy tay trong trình soạn thì không có
 * ngữ cảnh → getDb() trả về file gốc như trước.
 */

const TEACHER_SHEET = 'GIÁO VIÊN';
const TEACHER_HEADERS = ['User ID', 'Tên', 'Spreadsheet ID', 'URL', 'Trạng thái', 'Ngày tạo'];
const TEACHER_STATUS_ACTIVE = 'Hoạt động';
const TEACHER_STATUS_LOCKED = 'Khóa';

// Ngữ cảnh của lượt xử lý hiện tại: { userId, name, isAdmin, teacher, spreadsheet }
const TENANT = { current: null };

// ============================================================
// ADMIN & QUYỀN
// ============================================================

function getAdminIds() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('ADMIN_IDS') || props.getProperty('TEST_CHAT_ID') || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function isAdmin(userId) {
  return getAdminIds().includes(String(userId));
}

function getAdminName() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_NAME') || 'Admin';
}

/**
 * Người gửi được dùng bot nếu là admin hoặc giáo viên đang hoạt động.
 */
function isAuthorized(userId) {
  if (isAdmin(userId)) return true;

  const teacher = getTeacherByUserId(userId);
  return !!teacher && teacher.trangThai === TEACHER_STATUS_ACTIVE;
}

// ============================================================
// SỔ GIÁO VIÊN (sheet GIÁO VIÊN trong file gốc)
// ============================================================

/**
 * Sheet GIÁO VIÊN trong file gốc; tạo kèm header nếu chưa có.
 */
function getTeacherSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TEACHER_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(TEACHER_SHEET);
    sheet.getRange(1, 1, 1, TEACHER_HEADERS.length).setValues([TEACHER_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('E2:E1000').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList([TEACHER_STATUS_ACTIVE, TEACHER_STATUS_LOCKED]).build()
    );
  }

  return sheet;
}

function getAllTeachers() {
  const sheet = getTeacherSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, TEACHER_HEADERS.length).getValues()
    .map((row, i) => ({
      userId: String(row[0]).trim(),
      name: String(row[1]).trim(),
      spreadsheetId: String(row[2]).trim(),
      url: row[3],
      trangThai: row[4],
      ngayTao: row[5],
      _row: i + 2
    }))
    .filter(t => t.userId);
}

function getActiveTeachers() {
  return getAllTeachers().filter(t => t.trangThai === TEACHER_STATUS_ACTIVE);
}

function getTeacherByUserId(userId) {
  return getAllTeachers().find(t => t.userId === String(userId)) || null;
}

// ============================================================
// NGỮ CẢNH DỮ LIỆU
// ============================================================

/**
 * Spreadsheet dữ liệu của lượt xử lý hiện tại. Ngoài webhook (chạy tay trong trình soạn) là file gốc.
 */
function getDb() {
  return TENANT.current ? TENANT.current.spreadsheet : SpreadsheetApp.getActiveSpreadsheet();
}

function getCurrentContext() {
  return TENANT.current;
}

/**
 * Admin đang ở file gốc (chưa /chon_gv) → /thong_ke, /xem_no tổng hợp toàn trường.
 */
function isAdminAtRoot() {
  const ctx = TENANT.current;
  return !!(ctx && ctx.isAdmin && !ctx.teacher);
}

/**
 * Đặt ngữ cảnh cho người gửi (gọi ở doPost sau khi isAuthorized).
 * Admin: file gốc, hoặc Sheet của thầy đang chọn bằng /chon_gv. Giáo viên: Sheet riêng.
 */
function setCurrentUser(userId) {
  const id = String(userId);

  if (isAdmin(id)) {
    let viewing = getViewingTeacher(id);
    let spreadsheet = null;

    if (viewing) {
      try {
        spreadsheet = SpreadsheetApp.openById(viewing.spreadsheetId);
      } catch (e) {
        Logger.log(`⚠️ Không mở được Sheet của ${viewing.name}, quay về file gốc: ${e}`);
        setViewingTeacher(id, null);
        viewing = null;
      }
    }

    TENANT.current = {
      userId: id,
      isAdmin: true,
      teacher: viewing,
      name: viewing ? viewing.name : getAdminName(),
      spreadsheet: spreadsheet || SpreadsheetApp.getActiveSpreadsheet()
    };
    return TENANT.current;
  }

  const teacher = getTeacherByUserId(id);
  TENANT.current = {
    userId: id,
    isAdmin: false,
    teacher: teacher,
    name: teacher.name,
    spreadsheet: SpreadsheetApp.openById(teacher.spreadsheetId)
  };
  return TENANT.current;
}

/**
 * Chạy fn trong ngữ cảnh của một thầy rồi khôi phục ngữ cảnh cũ (dùng cho nhắc nhở, thống kê tổng hợp).
 */
function withTeacher(teacher, fn) {
  const previous = TENANT.current;

  TENANT.current = {
    userId: teacher.userId,
    isAdmin: false,
    teacher: teacher,
    name: teacher.name,
    spreadsheet: SpreadsheetApp.openById(teacher.spreadsheetId)
  };

  try {
    return fn(teacher);
  } finally {
    TENANT.current = previous;
  }
}

/**
 * Chạy fn cho từng thầy đang hoạt động, cộng dồn kết quả số. Lỗi của một thầy không chặn thầy khác.
 */
function forEachActiveTeacher(fn) {
  let total = 0;

  getActiveTeachers().forEach(teacher => {
    try {
      total += Number(withTeacher(teacher, fn)) || 0;
    } catch (e) {
      Logger.log(`❌ Lỗi với giáo viên ${teacher.name} (${teacher.userId}): ${e}`);
    }
  });

  return total;
}

/**
 * Thầy mà admin đang xem (/chon_gv), lưu trong Script Properties VIEW_AS_<admin id>.
 */
function getViewingTeacher(adminId) {
  const teacherId = PropertiesService.getScriptProperties().getProperty('VIEW_AS_' + adminId);
  return teacherId ? getTeacherByUserId(teacherId) : null;
}

function setViewingTeacher(adminId, teacherUserId) {
  const props = PropertiesService.getScriptProperties();

  if (teacherUserId) {
    props.setProperty('VIEW_AS_' + adminId, String(teacherUserId));
  } else {
    props.deleteProperty('VIEW_AS_' + adminId);
  }
}

/**
 * Dòng mô tả ngữ cảnh hiện tại cho /start.
 */
function getContextLine() {
  const ctx = TENANT.current;
  if (!ctx) return '';
  if (!ctx.isAdmin) return `👨‍🏫 Giáo viên: *${ctx.name}*`;
  if (ctx.teacher) return `📂 Đang xem dữ liệu của thầy *${ctx.teacher.name}* (gõ /chon\\_gv để quay về)`;
  return `📂 Dữ liệu: *file gốc* (admin). Gõ /chon\\_gv <ID> để vào dữ liệu của một thầy.`;
}

// ============================================================
// LỆNH ADMIN
// ============================================================

/**
 * /them_gv <user ID> <Tên thầy> [email]: tạo Google Sheet riêng theo mẫu create-sheets.gs,
 * ghi vào sổ GIÁO VIÊN, chia sẻ cho email (nếu có) và báo cho thầy qua Telegram.
 */
function handleAddTeacher(chatId, args) {
  const userId = String(args[0] || '').trim();
  const emailIdx = args.findIndex((a, i) => i > 0 && /^\S+@\S+\.\S+$/.test(a));
  const email = emailIdx > 0 ? args[emailIdx] : '';
  const name = args.slice(1).filter((a, i) => i + 1 !== emailIdx).join(' ').trim();

  if (!/^\d+$/.test(userId) || name.length < 2) {
    sendMessage(chatId,
      '❌ Cú pháp: /them\\_gv <user ID> <Tên thầy> [email]\nVí dụ: /them\\_gv 123456789 Nguyễn Văn A\n\nThầy lấy user ID bằng cách nhắn bất kỳ gì cho bot, bot sẽ trả lại ID.',
      { parse_mode: 'Markdown' });
    return;
  }

  if (isAdmin(userId)) {
    sendMessage(chatId, '❌ ID này là admin, không cần thêm làm giáo viên.');
    return;
  }

  const existing = getTeacherByUserId(userId);
  if (existing) {
    sendMessage(chatId, `❌ ID ${userId} đã có trong sổ: ${existing.name} (${existing.trangThai}).`);
    return;
  }

  sendMessage(chatId, `⏳ Đang tạo Google Sheet cho ${name}...`);

  let ss;
  try {
    ss = SpreadsheetApp.create(`Quản Lý Học Viên - ${name}`);
    setupAllSheets(ss);
  } catch (e) {
    Logger.log('❌ Không tạo được Sheet cho giáo viên: ' + e);
    sendMessage(chatId, '❌ Không tạo được Google Sheet: ' + e.message);
    return;
  }

  getTeacherSheet().appendRow([userId, name, ss.getId(), ss.getUrl(), TEACHER_STATUS_ACTIVE, getCurrentTimestamp()]);

  let note = '';
  if (email) {
    try {
      ss.addEditor(email);
      note += `\n📧 Đã chia sẻ Sheet cho ${mdEscape(email)}`;
    } catch (e) {
      note += `\n⚠️ Không chia sẻ được cho ${mdEscape(email)} (${mdEscape(e.message)}). Bạn chia sẻ thủ công qua link trên.`;
    }
  }

  const notify = sendMessage(userId,
    `🎓 Bạn đã được cấp quyền dùng bot quản lý học viên với tên *${mdEscape(name)}*.\nGõ /start để bắt đầu.`,
    { parse_mode: 'Markdown' });
  note += notify && notify.ok
    ? '\n✅ Đã báo cho thầy qua Telegram'
    : '\nℹ️ Chưa báo được cho thầy (thầy cần nhắn cho bot trước). Bạn nhắn thầy gõ /start.';

  sendMessage(chatId,
    `✅ Đã thêm giáo viên *${mdEscape(name)}* (ID ${userId})\n📄 Sheet riêng: ${mdEscape(ss.getUrl())}${note}`,
    { parse_mode: 'Markdown' });
}

/**
 * /ds_gv: danh sách giáo viên trong sổ.
 */
function handleListTeachers(chatId) {
  const teachers = getAllTeachers();

  if (teachers.length === 0) {
    sendMessage(chatId, 'ℹ️ Chưa có giáo viên nào. Dùng /them\\_gv <user ID> <Tên> để thêm.', { parse_mode: 'Markdown' });
    return;
  }

  let text = `👨‍🏫 *DANH SÁCH GIÁO VIÊN* (${teachers.length})\n\n`;

  teachers.forEach((t, idx) => {
    const icon = t.trangThai === TEACHER_STATUS_ACTIVE ? '✅' : '🔒';
    text += `${idx + 1}. ${icon} *${mdEscape(t.name)}* - ID ${t.userId}\n`;
    text += `   📄 ${mdEscape(t.url)}\n\n`;
  });

  text += `👉 /chon\\_gv <ID> để vào dữ liệu của một thầy, /xoa\\_gv <ID> để khóa.`;
  sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

/**
 * /xoa_gv <user ID>: khóa giáo viên (không dùng được bot, không nhận nhắc nhở). Sheet riêng giữ nguyên.
 * Mở lại bằng cách sửa cột Trạng thái trong sheet GIÁO VIÊN thành "Hoạt động".
 */
function handleRemoveTeacher(chatId, args) {
  const userId = String(args[0] || '').trim();
  const teacher = userId ? getTeacherByUserId(userId) : null;

  if (!teacher) {
    sendMessage(chatId, '❌ Cú pháp: /xoa\\_gv <user ID>. Xem ID trong /ds\\_gv.', { parse_mode: 'Markdown' });
    return;
  }

  if (teacher.trangThai === TEACHER_STATUS_LOCKED) {
    sendMessage(chatId, `ℹ️ ${teacher.name} đã bị khóa từ trước.`);
    return;
  }

  getTeacherSheet().getRange(teacher._row, 5).setValue(TEACHER_STATUS_LOCKED);
  sendMessage(chatId,
    `🔒 Đã khóa giáo viên *${mdEscape(teacher.name)}* (ID ${userId}). Sheet riêng vẫn giữ nguyên.\nMở lại: sửa cột Trạng thái trong sheet GIÁO VIÊN thành "${TEACHER_STATUS_ACTIVE}".`,
    { parse_mode: 'Markdown' });
}

/**
 * /chon_gv <user ID>: admin vào dữ liệu của một thầy (mọi lệnh sau đó thao tác trên Sheet của thầy).
 * /chon_gv không tham số: quay về file gốc.
 */
function handleSelectTeacher(chatId, adminId, args) {
  const userId = String(args[0] || '').trim();

  if (!userId) {
    setViewingTeacher(adminId, null);
    sendMessage(chatId, '📂 Đã quay về dữ liệu file gốc (admin).');
    return;
  }

  const teacher = getTeacherByUserId(userId);
  if (!teacher) {
    sendMessage(chatId, `❌ Không có giáo viên ID ${userId}. Xem /ds\\_gv.`, { parse_mode: 'Markdown' });
    return;
  }

  setViewingTeacher(adminId, userId);
  sendMessage(chatId,
    `📂 Đang xem dữ liệu của thầy *${mdEscape(teacher.name)}*. Mọi lệnh từ giờ đọc/ghi trên Sheet của thầy này.\nGõ /chon\\_gv (không tham số) để quay về file gốc.`,
    { parse_mode: 'Markdown' });
}

// ============================================================
// TỔNG HỢP TOÀN TRƯỜNG (admin)
// ============================================================

/**
 * /thong_ke cho admin: thống kê từng thầy và tổng cộng (không tính dữ liệu file gốc).
 */
function handleAdminStatistics(chatId) {
  const teachers = getActiveTeachers();

  if (teachers.length === 0) {
    sendMessage(chatId, 'ℹ️ Chưa có giáo viên nào để tổng hợp. Dùng /them\\_gv để thêm, hoặc /chon\\_gv để xem thống kê của file gốc.', { parse_mode: 'Markdown' });
    return;
  }

  const total = { students: 0, active: 0, today: 0, totalFees: 0, collected: 0, debt: 0, vehicles: 0 };
  let text = `📊 *THỐNG KÊ TOÀN TRƯỜNG* (${teachers.length} giáo viên)\n\n`;

  teachers.forEach(t => {
    let s;
    try {
      s = withTeacher(t, () => calculateStatistics());
    } catch (e) {
      text += `👨‍🏫 *${mdEscape(t.name)}*\n   ⚠️ Không đọc được dữ liệu: ${mdEscape(e.message)}\n\n`;
      return;
    }

    text += `👨‍🏫 *${mdEscape(t.name)}*\n`;
    text += `   👥 HV: ${s.students.total} (đang học ${s.students.active}) | 📅 Hôm nay: ${s.schedules.today}\n`;
    text += `   💰 Còn nợ: ${formatMoney(s.finance.debt)} | 🚗 Xe: ${s.vehicles.total}\n\n`;

    total.students += s.students.total;
    total.active += s.students.active;
    total.today += s.schedules.today;
    total.totalFees += s.finance.totalFees;
    total.collected += s.finance.collected;
    total.debt += s.finance.debt;
    total.vehicles += s.vehicles.total;
  });

  const rate = total.totalFees > 0 ? Math.round((total.collected / total.totalFees) * 100) : 0;

  text += `━━━━━━━━━━━━━━━\n📊 *TỔNG CỘNG*\n`;
  text += `👥 Học viên: ${total.students} (đang học ${total.active})\n`;
  text += `📅 Lịch hôm nay: ${total.today}\n`;
  text += `💵 Tổng học phí: ${formatMoney(total.totalFees)}\n`;
  text += `✅ Đã thu: ${formatMoney(total.collected)} (${rate}%)\n`;
  text += `💰 Còn nợ: ${formatMoney(total.debt)}\n`;
  text += `🚗 Xe tập: ${total.vehicles}`;

  sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

/**
 * /xem_no cho admin: công nợ của mọi thầy, gom theo thầy.
 */
function handleAdminDebt(chatId) {
  const teachers = getActiveTeachers();

  if (teachers.length === 0) {
    sendMessage(chatId, 'ℹ️ Chưa có giáo viên nào để tổng hợp công nợ.');
    return;
  }

  let text = `💰 *CÔNG NỢ TOÀN TRƯỜNG*\n\n`;
  let grandTotal = 0;
  let count = 0;

  teachers.forEach(t => {
    let students;
    try {
      students = withTeacher(t, () => getStudentsWithDebt());
    } catch (e) {
      text += `👨‍🏫 *${mdEscape(t.name)}*: ⚠️ không đọc được dữ liệu\n\n`;
      return;
    }

    if (students.length === 0) return;

    text += `👨‍🏫 *${mdEscape(t.name)}* - ${students.length} học viên nợ\n`;
    students.forEach(s => {
      text += `   • ${s.id} ${mdEscape(s.hoTen)}: *${formatMoney(s.conNo)}*\n`;
      grandTotal += Number(s.conNo) || 0;
      count++;
    });
    text += '\n';
  });

  if (count === 0) {
    text += '✅ Không có học viên nào còn nợ.';
  } else {
    text += `━━━━━━━━━━━━━━━\n📊 *Tổng công nợ: ${formatMoney(grandTotal)}* (${count} học viên)`;
  }

  sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

// ============================================================
// HELPER
// ============================================================

/**
 * Escape ký tự Markdown (legacy) trong text tự do: tên, email, URL.
 */
function mdEscape(text) {
  return String(text === undefined || text === null ? '' : text).replace(/([_*`\[])/g, '\\$1');
}
