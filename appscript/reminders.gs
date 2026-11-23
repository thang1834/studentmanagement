/**
 * REMINDERS - Nhắc nhở tự động
 *
 * 4 loại nhắc, mỗi loại một hàm có thể chạy tay trong trình soạn Apps Script
 * hoặc được gọi bởi trigger theo giờ (cài bằng installReminderTriggers()):
 *   - remindUpcomingLessons    : buổi học bắt đầu trong 30 phút tới (mỗi 15 phút)
 *   - remindDebtSummary        : tổng kết công nợ (thứ Hai 9:00)
 *   - remindVehicleMaintenance : xe còn dưới 500 km đến hạn bảo dưỡng (mỗi ngày 8:00)
 *   - remindVehicleInspection  : xe quá hạn hoặc còn dưới 30 ngày đăng kiểm (ngày 1 hằng tháng 8:00)
 *
 * Mỗi hàm chạy lần lượt cho từng giáo viên đang hoạt động (teachers.gs): đọc Sheet riêng của thầy,
 * gửi tin cho thầy đó và ghi vào sheet NHẮC NHỞ của thầy với Trạng thái 'Đã gửi'.
 * Thứ Hai admin nhận thêm tổng hợp công nợ toàn trường.
 */

const REMINDER_SHEET = 'NHẮC NHỞ';
const REMINDER_LESSON_MINUTES = 30;   // Nhắc buổi học bắt đầu trong vòng 30 phút tới
const REMINDER_MAINTENANCE_KM = 500;  // Nhắc bảo dưỡng khi còn dưới 500 km
const REMINDER_INSPECTION_DAYS = 30;  // Nhắc đăng kiểm khi còn dưới 30 ngày

// Các hàm được gắn trigger (dùng để cài / gỡ trigger)
const REMINDER_TRIGGER_FUNCTIONS = [
  'remindUpcomingLessons',
  'remindDebtSummary',
  'remindVehicleMaintenance',
  'remindVehicleInspection'
];

// ============================================================
// 4 HÀM NHẮC NHỞ
// ============================================================

/**
 * Nhắc buổi học sắp tới: buổi hôm nay có trạng thái 'Chưa học', bắt đầu trong
 * 30 phút tới và chưa được nhắc (tra sheet NHẮC NHỞ để không gửi trùng).
 * Trigger: mỗi 15 phút. Trả về số buổi đã nhắc.
 */
function remindUpcomingLessons() {
  return forEachActiveTeacher(remindUpcomingLessonsFor);
}

function remindUpcomingLessonsFor(teacher) {
  const now = new Date();
  const lessons = getTodaySchedules().filter(s => s.trangThai === 'Chưa học');
  let sent = 0;

  lessons.forEach(lesson => {
    const minutesLeft = minutesUntilTime(lesson.gioBatDau, now);
    if (minutesLeft === null || minutesLeft < 0 || minutesLeft > REMINDER_LESSON_MINUTES) return;
    if (isReminderSentToday('Lịch học', lesson.id)) return;

    const gio = lesson.gioKetThuc ? `${lesson.gioBatDau} - ${lesson.gioKetThuc}` : lesson.gioBatDau;

    let text = `⏰ *NHẮC LỊCH HỌC* (còn ${minutesLeft} phút)\n\n`;
    text += `👤 Học viên: ${lesson.hoTen} (${lesson.maHocVien})\n`;
    text += `🕐 Giờ: ${gio}\n`;
    text += `📚 Loại buổi: ${lesson.loaiBuoiHoc}\n`;
    if (lesson.giaoVien) text += `👨‍🏫 Giáo viên: ${lesson.giaoVien}\n`;
    if (lesson.ghiChu) text += `📝 Ghi chú: ${lesson.ghiChu}\n`;

    if (sendReminderTo(teacher.userId, text)) {
      logReminder(
        'Lịch học',
        `Buổi học ${lesson.gioBatDau} - ${lesson.hoTen}`,
        `${lesson.hoTen} (${lesson.maHocVien}), ${lesson.loaiBuoiHoc}, GV: ${lesson.giaoVien || '-'}`,
        lesson.id
      );
      sent++;
    }
  });

  Logger.log(`⏰ remindUpcomingLessons: ${lessons.length} buổi chưa học hôm nay, đã nhắc ${sent} buổi`);
  return sent;
}

/**
 * Tổng kết công nợ: danh sách học viên còn nợ (nợ giảm dần) và tổng nợ.
 * Trigger: thứ Hai 9:00. Trả về số chat đã gửi.
 */
function remindDebtSummary() {
  const sent = forEachActiveTeacher(remindDebtSummaryFor);

  if (getActiveTeachers().length > 0) {
    getAdminIds().forEach(adminId => handleAdminDebt(adminId));
  }

  return sent;
}

function remindDebtSummaryFor(teacher) {
  const students = getStudentsWithDebt();
  const totalDebt = students.reduce((total, s) => total + Number(s.conNo || 0), 0);

  let text = `💰 *TỔNG KẾT CÔNG NỢ TUẦN*\n${getToday()}\n\n`;

  if (students.length === 0) {
    text += `✅ Tất cả học viên đã đóng đủ học phí!`;
  } else {
    text += `${students.length} học viên còn nợ:\n\n`;

    students.forEach((student, idx) => {
      text += `${idx + 1}. *${student.id}* - ${student.hoTen}\n`;
      text += `   📱 ${student.sdt}\n`;
      text += `   💰 Còn nợ: *${formatMoney(student.conNo)}*\n\n`;
    });

    text += `━━━━━━━━━━━━━━━\n`;
    text += `📊 *Tổng công nợ: ${formatMoney(totalDebt)}*\n\n`;
    text += `👉 /xem\\_no để xem chi tiết, /thu\\_tien để thu tiền`;
  }

  const sent = sendReminderTo(teacher.userId, text);
  if (sent > 0) {
    logReminder(
      'Đóng tiền',
      'Tổng kết công nợ tuần',
      `${students.length} học viên còn nợ, tổng ${formatMoney(totalDebt)}`,
      ''
    );
  }

  Logger.log(`💰 remindDebtSummary: ${students.length} học viên còn nợ, gửi tới ${sent} chat`);
  return sent;
}

/**
 * Nhắc bảo dưỡng xe: xe có Km bảo dưỡng tiếp theo cách Km hiện tại dưới 500 km
 * (kể cả đã quá hạn). Trigger: mỗi ngày 8:00. Trả về số chat đã gửi.
 */
function remindVehicleMaintenance() {
  return forEachActiveTeacher(remindVehicleMaintenanceFor);
}

function remindVehicleMaintenanceFor(teacher) {
  const dueVehicles = getAllVehicles()
    .map(vehicle => ({
      vehicle: vehicle,
      kmNow: toKm(vehicle.kmHienTai),
      kmNext: toKm(vehicle.kmBaoDuongTiepTheo)
    }))
    .filter(item => item.kmNow !== null && item.kmNext !== null
      && item.kmNext - item.kmNow < REMINDER_MAINTENANCE_KM)
    .sort((a, b) => (a.kmNext - a.kmNow) - (b.kmNext - b.kmNow));

  if (dueVehicles.length === 0) {
    Logger.log('🔧 remindVehicleMaintenance: không có xe nào sắp đến hạn bảo dưỡng');
    return 0;
  }

  let text = `🔧 *NHẮC BẢO DƯỠNG XE*\n\n`;
  text += `${dueVehicles.length} xe sắp đến hạn bảo dưỡng:\n\n`;

  dueVehicles.forEach((item, idx) => {
    const remaining = item.kmNext - item.kmNow;

    text += `${idx + 1}. *${item.vehicle.bienSo}* - ${item.vehicle.loaiXe}\n`;
    text += `   📏 Km hiện tại: ${formatKm(item.kmNow)}\n`;
    text += `   🔧 Bảo dưỡng tại: ${formatKm(item.kmNext)}\n`;
    text += remaining >= 0
      ? `   ⚠️ Còn ${formatKm(remaining)}\n\n`
      : `   🚨 Đã quá ${formatKm(-remaining)}\n\n`;
  });

  const sent = sendReminderTo(teacher.userId, text);
  if (sent > 0) {
    logReminder(
      'Bảo dưỡng xe',
      'Nhắc bảo dưỡng xe',
      dueVehicles.map(item => `${item.vehicle.bienSo} (còn ${formatKm(item.kmNext - item.kmNow)})`).join(', '),
      dueVehicles.map(item => item.vehicle.bienSo).join(', ')
    );
  }

  Logger.log(`🔧 remindVehicleMaintenance: ${dueVehicles.length} xe sắp đến hạn, gửi tới ${sent} chat`);
  return sent;
}

/**
 * Nhắc đăng kiểm xe: xe có Ngày đăng kiểm tiếp theo đã qua hoặc còn dưới 30 ngày.
 * Ô ngày có thể là Date hoặc chuỗi dd/MM/yyyy nên quy về chuỗi bằng formatDateOnly rồi tự parse.
 * Trigger: ngày 1 hằng tháng 8:00. Trả về số chat đã gửi.
 */
function remindVehicleInspection() {
  return forEachActiveTeacher(remindVehicleInspectionFor);
}

function remindVehicleInspectionFor(teacher) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueVehicles = [];

  getAllVehicles().forEach(vehicle => {
    const dateStr = formatDateOnly(vehicle.ngayDangKiemTiepTheo);
    if (!dateStr) return;

    const dueDate = parseDateDDMMYYYY(dateStr);
    if (!dueDate) {
      Logger.log(`⚠️ Xe ${vehicle.bienSo}: không đọc được ngày đăng kiểm "${dateStr}"`);
      return;
    }

    const daysLeft = Math.round((dueDate - today) / (24 * 60 * 60 * 1000));
    if (daysLeft < REMINDER_INSPECTION_DAYS) {
      dueVehicles.push({ vehicle: vehicle, dateStr: dateStr, daysLeft: daysLeft });
    }
  });

  dueVehicles.sort((a, b) => a.daysLeft - b.daysLeft);

  if (dueVehicles.length === 0) {
    Logger.log('📋 remindVehicleInspection: không có xe nào sắp hết hạn đăng kiểm');
    return 0;
  }

  let text = `📋 *NHẮC ĐĂNG KIỂM XE*\n\n`;
  text += `${dueVehicles.length} xe cần đăng kiểm:\n\n`;

  dueVehicles.forEach((item, idx) => {
    text += `${idx + 1}. *${item.vehicle.bienSo}* - ${item.vehicle.loaiXe}\n`;
    text += `   📅 Hạn đăng kiểm: ${item.dateStr}\n`;
    if (item.daysLeft < 0) {
      text += `   🚨 Đã quá hạn ${-item.daysLeft} ngày\n\n`;
    } else if (item.daysLeft === 0) {
      text += `   🚨 Hết hạn hôm nay\n\n`;
    } else {
      text += `   ⚠️ Còn ${item.daysLeft} ngày\n\n`;
    }
  });

  const sent = sendReminderTo(teacher.userId, text);
  if (sent > 0) {
    logReminder(
      'Đăng kiểm',
      'Nhắc đăng kiểm xe',
      dueVehicles.map(item => `${item.vehicle.bienSo} (hạn ${item.dateStr})`).join(', '),
      dueVehicles.map(item => item.vehicle.bienSo).join(', ')
    );
  }

  Logger.log(`📋 remindVehicleInspection: ${dueVehicles.length} xe cần đăng kiểm, gửi tới ${sent} chat`);
  return sent;
}

// ============================================================
// TRIGGER
// ============================================================

/**
 * Cài 4 trigger nhắc nhở. Chạy một lần sau khi deploy; chạy lại không bị nhân đôi
 * vì trigger cũ của các hàm này được xóa trước.
 * Lưu ý: trigger theo giờ của Google chạy trong khoảng giờ đã chọn (ví dụ 8:00-9:00), không đúng từng phút.
 */
function installReminderTriggers() {
  removeReminderTriggers();

  ScriptApp.newTrigger('remindUpcomingLessons')
    .timeBased()
    .everyMinutes(15)
    .create();

  ScriptApp.newTrigger('remindDebtSummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .inTimezone('Asia/Ho_Chi_Minh')
    .create();

  ScriptApp.newTrigger('remindVehicleMaintenance')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone('Asia/Ho_Chi_Minh')
    .create();

  ScriptApp.newTrigger('remindVehicleInspection')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .inTimezone('Asia/Ho_Chi_Minh')
    .create();

  Logger.log('✅ Đã cài 4 trigger nhắc nhở: ' + REMINDER_TRIGGER_FUNCTIONS.join(', '));
}

/**
 * Gỡ toàn bộ trigger của các hàm nhắc nhở. Trả về số trigger đã xóa.
 */
function removeReminderTriggers() {
  let removed = 0;

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (REMINDER_TRIGGER_FUNCTIONS.includes(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  Logger.log(`🗑️ Đã gỡ ${removed} trigger nhắc nhở`);
  return removed;
}

// ============================================================
// GỬI & GHI SHEET NHẮC NHỞ
// ============================================================

/**
 * Gửi một tin nhắc (Markdown) tới một chat. Trả về 1 nếu gửi được, 0 nếu không.
 */
function sendReminderTo(chatId, text) {
  const result = sendMessage(chatId, text, { parse_mode: 'Markdown' });

  if (result && result.ok) {
    return 1;
  }

  Logger.log(`❌ Không gửi được nhắc nhở tới ${chatId}: ${JSON.stringify(result)}`);
  return 0;
}

/**
 * Lấy sheet NHẮC NHỞ (tạo bởi create-sheets.gs). Báo lỗi rõ nếu chưa có sheet.
 */
function getReminderSheet() {
  const sheet = getDb().getSheetByName(REMINDER_SHEET);

  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "${REMINDER_SHEET}". Chạy setupAllSheets() trong create-sheets.gs trước.`);
  }

  return sheet;
}

/**
 * Sinh ID nhắc nhở tiếp theo: NH001, NH002, ...
 */
function getNextReminderId() {
  const sheet = getReminderSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return 'NH001';
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 0;

  ids.forEach(row => {
    const idStr = String(row[0] || '');
    if (!idStr.startsWith('NH')) return;

    const num = parseInt(idStr.substring(2), 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  return 'NH' + String(maxNum + 1).padStart(3, '0');
}

/**
 * Ghi một dòng vào sheet NHẮC NHỞ với Trạng thái 'Đã gửi', Gửi qua 'Telegram'.
 * Cột: ID, Loại, Tiêu đề, Nội dung, Ngày nhắc, Giờ nhắc, ID đối tượng, Trạng thái, Gửi qua, Ngày tạo.
 * Ngày nhắc ghi dạng Date để đọc lại không lệ thuộc locale của sheet.
 */
function logReminder(loai, tieuDe, noiDung, idDoiTuong) {
  const sheet = getReminderSheet();
  const id = getNextReminderId();
  const now = new Date();
  const ngayNhac = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  sheet.appendRow([
    id,                                                      // A: ID
    loai,                                                    // B: Loại
    tieuDe,                                                  // C: Tiêu đề
    noiDung,                                                 // D: Nội dung
    ngayNhac,                                                // E: Ngày nhắc
    Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm'),  // F: Giờ nhắc
    idDoiTuong,                                              // G: ID đối tượng
    'Đã gửi',                                                // H: Trạng thái
    'Telegram',                                              // I: Gửi qua
    getCurrentTimestamp()                                    // J: Ngày tạo
  ]);

  return id;
}

/**
 * Hôm nay đã gửi nhắc nhở cùng Loại + ID đối tượng chưa (chống gửi trùng).
 * Ô Ngày nhắc có thể là Date hoặc chuỗi nên so sánh qua formatDateOnly.
 */
function isReminderSentToday(loai, idDoiTuong) {
  const sheet = getReminderSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return false;
  }

  const today = getToday();
  const rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

  return rows.some(row =>
    row[1] === loai &&
    String(row[6]) === String(idDoiTuong) &&
    row[7] === 'Đã gửi' &&
    formatDateOnly(row[4]) === today
  );
}

// ============================================================
// HELPER
// ============================================================

/**
 * Số phút từ lúc `now` tới giờ 'HH:mm' trong ngày (âm nếu đã qua).
 * Trả về null nếu không đọc được giờ.
 */
function minutesUntilTime(timeStr, now) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(timeStr || '').trim());
  if (!match) return null;

  const nowParts = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm').split(':');
  const target = Number(match[1]) * 60 + Number(match[2]);
  const current = Number(nowParts[0]) * 60 + Number(nowParts[1]);

  return target - current;
}

/**
 * Parse chuỗi dd/MM/yyyy thành Date lúc 00:00. Trả về null nếu sai định dạng.
 */
function parseDateDDMMYYYY(str) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(str || '').trim());
  if (!match) return null;

  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Đọc số km từ ô sheet (số, hoặc chuỗi như "15.000"). Trả về null nếu ô trống / không phải số.
 */
function toKm(value) {
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (value === '' || value === null || value === undefined) return null;

  const digits = String(value).replace(/[^\d-]/g, '');
  if (!/\d/.test(digits)) return null;

  const num = Number(digits);
  return isNaN(num) ? null : num;
}

/**
 * Format km: 15000 → "15.000 km"
 */
function formatKm(km) {
  return Math.round(km).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' km';
}
