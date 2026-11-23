/**
 * STUDENT MANAGEMENT
 * CRUD operations cho học viên
 */

const STUDENT_SHEET = 'THÔNG TIN HỌC VIÊN';

/**
 * Get student sheet
 */
function getStudentSheet() {
  return getDb().getSheetByName(STUDENT_SHEET);
}

/**
 * Generate next student ID - OPTIMIZED
 */
function getNextStudentId() {
  const sheet = getStudentSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return 'HV001';
  }

  // Đọc tất cả IDs một lần (nhanh hơn nhiều so với scan từng cell)
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  let maxNum = 0;

  // Tìm số lớn nhất
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];

    if (!id || id === '') continue;

    const idStr = id.toString();

    if (idStr.startsWith('HV')) {
      const num = parseInt(idStr.replace('HV', ''));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  // Nếu không tìm thấy ID hợp lệ, bắt đầu từ 1
  const nextNum = maxNum + 1;
  return 'HV' + nextNum.toString().padStart(3, '0');
}

/**
 * Create new student
 */
function createStudent(data) {
  const sheet = getStudentSheet();
  const studentId = getNextStudentId();
  const now = getCurrentTimestamp();

  // DEBUG
  const ss = getDb();
  Logger.log('DEBUG createStudent:');
  Logger.log('  Spreadsheet ID: ' + ss.getId());
  Logger.log('  Spreadsheet URL: ' + ss.getUrl());
  Logger.log('  Sheet name: ' + sheet.getName());
  Logger.log('  LastRow before append: ' + sheet.getLastRow());

  // Columns theo đúng thứ tự headers trong sheet:
  // ID, Họ tên, Ngày sinh, Giới tính, Số điện thoại, CMND/CCCD,
  // Địa chỉ nhà, Địa chỉ làm việc, Ghi chú địa chỉ, Ngày nộp hồ sơ,
  // Ngày đăng ký học, Loại bằng, Giáo viên phụ trách, Trạng thái,
  // Học phí (VNĐ), Đã đóng (VNĐ), Còn nợ (VNĐ), Ghi chú,
  // Ngày tạo, Ngày cập nhật

  const row = [
    studentId,                    // A: ID
    data.hoTen,                   // B: Họ tên
    data.ngaySinh,                // C: Ngày sinh
    data.gioiTinh,                // D: Giới tính
    data.sdt,                     // E: Số điện thoại
    data.cmnd,                    // F: CMND/CCCD
    data.diaChiNha,               // G: Địa chỉ nhà
    data.diaChiLamViec || '',     // H: Địa chỉ làm việc
    data.ghiChuDiaChi || '',      // I: Ghi chú địa chỉ
    data.ngayNopHoSo,             // J: Ngày nộp hồ sơ
    now,                          // K: Ngày đăng ký học
    data.loaiBang,                // L: Loại bằng
    data.giaoVien,                // M: Giáo viên phụ trách
    'Đang học',                   // N: Trạng thái
    data.hocPhi,                  // O: Học phí
    data.daDong,                  // P: Đã đóng
    `=O${sheet.getLastRow() + 1}-P${sheet.getLastRow() + 1}`, // Q: Còn nợ (formula)
    '',                           // R: Ghi chú
    now,                          // S: Ngày tạo
    now                           // T: Ngày cập nhật
  ];

  Logger.log('  Row data length: ' + row.length);
  Logger.log('  Student ID: ' + studentId);

  sheet.appendRow(row);

  Logger.log('  LastRow after append: ' + sheet.getLastRow());

  return studentId;
}

/**
 * Get all students
 */
function getAllStudents() {
  const sheet = getStudentSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 20).getValues();

  // _row: số dòng thật trong sheet (dùng cho update/delete).
  // Bỏ dòng không có ID: công thức điền sẵn ở cột Q làm getLastRow() tính cả dòng trống.
  return data.map((row, i) => ({
    _row: i + 2,
    id: row[0],              // A: ID
    hoTen: row[1],           // B: Họ tên
    ngaySinh: row[2],        // C: Ngày sinh
    gioiTinh: row[3],        // D: Giới tính
    sdt: row[4],             // E: Số điện thoại
    cmnd: row[5],            // F: CMND/CCCD
    diaChiNha: row[6],       // G: Địa chỉ nhà
    diaChiLamViec: row[7],   // H: Địa chỉ làm việc
    ghiChuDiaChi: row[8],    // I: Ghi chú địa chỉ
    ngayNopHoSo: row[9],     // J: Ngày nộp hồ sơ
    ngayDangKy: row[10],     // K: Ngày đăng ký học
    loaiBang: row[11],       // L: Loại bằng
    giaoVien: row[12],       // M: Giáo viên phụ trách
    trangThai: row[13],      // N: Trạng thái
    hocPhi: row[14],         // O: Học phí
    daDong: row[15],         // P: Đã đóng
    conNo: row[16],          // Q: Còn nợ
    ghiChu: row[17],         // R: Ghi chú
    ngayTao: row[18],        // S: Ngày tạo
    capNhatCuoi: row[19]     // T: Ngày cập nhật
  })).filter(s => s.id);
}

/**
 * Get student by ID
 */
function getStudentById(studentId) {
  const students = getAllStudents();
  return students.find(s => s.id === studentId);
}

/**
 * Update student
 */
function updateStudent(studentId, updates) {
  const sheet = getStudentSheet();
  const student = getStudentById(studentId);

  if (!student) {
    return false;
  }

  const row = student._row;
  const now = getCurrentTimestamp();

  // Update các cột tương ứng với structure mới:
  // B:Họ tên, C:Ngày sinh, D:Giới tính, E:SĐT, F:CMND,
  // G:Địa chỉ nhà, H:Địa chỉ làm việc, I:Ghi chú địa chỉ, J:Ngày nộp HS,
  // L:Loại bằng, M:Giáo viên, N:Trạng thái, O:Học phí, P:Đã đóng, R:Ghi chú
  const columnMap = {
    hoTen: 2, ngaySinh: 3, gioiTinh: 4, sdt: 5, cmnd: 6,
    diaChiNha: 7, diaChiLamViec: 8, ghiChuDiaChi: 9, ngayNopHoSo: 10,
    loaiBang: 12, giaoVien: 13, trangThai: 14,
    hocPhi: 15, daDong: 16, ghiChu: 18
  };

  Object.keys(updates).forEach(key => {
    if (columnMap[key]) {
      sheet.getRange(row, columnMap[key]).setValue(updates[key]);
    }
  });

  // Update timestamp (column T = 20)
  sheet.getRange(row, 20).setValue(now);

  return true;
}

/**
 * Delete student
 */
function deleteStudent(studentId) {
  const sheet = getStudentSheet();
  const student = getStudentById(studentId);

  if (!student) {
    return false;
  }

  sheet.deleteRow(student._row);
  return true;
}

/**
 * Format student info for display
 */
function formatStudentInfo(student) {
  return `
👤 *THÔNG TIN HỌC VIÊN*

🆔 Mã: \`${student.id}\`
👤 Họ tên: *${student.hoTen}*
📱 SĐT: \`${student.sdt}\`
🆔 CMND: \`${student.cmnd}\`
🎂 Ngày sinh: ${formatDate(student.ngaySinh)}
👥 Giới tính: ${student.gioiTinh}
🏠 Địa chỉ: ${student.diaChiNha}
${student.diaChiLamViec ? `💼 Nơi làm: ${student.diaChiLamViec}` : ''}
${student.ghiChuDiaChi ? `📝 Ghi chú: ${student.ghiChuDiaChi}` : ''}

🎓 *THÔNG TIN HỌC TẬP*
📋 Loại bằng: *${student.loaiBang}*
👨‍🏫 Giáo viên: ${student.giaoVien}
📅 Ngày nộp HS: ${formatDate(student.ngayNopHoSo)}
📊 Trạng thái: ${getStatusEmoji(student.trangThai)} ${student.trangThai}

💰 *TÀI CHÍNH*
💵 Học phí: ${formatMoney(student.hocPhi)}
✅ Đã đóng: ${formatMoney(student.daDong)}
${student.conNo > 0 ? `⚠️ Còn nợ: *${formatMoney(student.conNo)}*` : '✅ Đã thanh toán đủ'}

⏰ Tạo: ${formatDate(student.ngayTao)}
🔄 Cập nhật: ${formatDate(student.capNhatCuoi)}
  `.trim();
}

/**
 * Format student list
 */
function formatStudentList(students, page = 1, pageSize = 5) {
  if (students.length === 0) {
    return '❌ Không tìm thấy học viên nào.';
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageStudents = students.slice(start, end);
  const totalPages = Math.ceil(students.length / pageSize);

  let message = `📋 *DANH SÁCH HỌC VIÊN* (${students.length})\n\n`;

  pageStudents.forEach((student, index) => {
    const num = start + index + 1;
    const debtWarning = student.conNo > 0 ? ' ⚠️' : '';
    message += `${num}. *${student.hoTen}*${debtWarning}\n`;
    message += `   🆔 ${student.id} | 📱 ${student.sdt}\n`;
    message += `   🎓 ${student.loaiBang} | ${getStatusEmoji(student.trangThai)} ${student.trangThai}\n`;
    if (student.conNo > 0) {
      message += `   💰 Nợ: ${formatMoney(student.conNo)}\n`;
    }
    message += '\n';
  });

  message += `\n📄 Trang ${page}/${totalPages}`;

  return message;
}

/**
 * Send student list with pagination
 */
function sendStudentList(chatId, page = 1) {
  const students = getAllStudents();
  const pageSize = 5;
  const totalPages = Math.ceil(students.length / pageSize);

  const message = formatStudentList(students, page, pageSize);

  // Pagination buttons
  const buttons = [];
  const navButtons = [];

  if (page > 1) {
    navButtons.push(createInlineButton('⬅️ Trước', `page:student:${page - 1}`));
  }

  navButtons.push(createInlineButton(`${page}/${totalPages}`, 'noop'));

  if (page < totalPages) {
    navButtons.push(createInlineButton('Sau ➡️', `page:student:${page + 1}`));
  }

  if (navButtons.length > 0) {
    buttons.push(navButtons);
  }

  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * View student detail
 */
function viewStudentDetail(chatId, studentId) {
  const student = getStudentById(studentId);

  if (!student) {
    sendMessage(chatId, `❌ Không tìm thấy học viên với mã: ${studentId}`);
    return;
  }

  const message = formatStudentInfo(student);

  // Action buttons
  const buttons = [
    [
      createInlineButton('📅 Lịch học', `student_schedule:${studentId}`),
      createInlineButton('💰 Thanh toán', `student_payment:${studentId}`)
    ],
    [
      createInlineButton('📊 Tiến độ', `student_progress:${studentId}`),
      createInlineButton('✏️ Sửa', `edit_student:${studentId}`)
    ],
    [
      createInlineButton('🗑️ Xóa', `delete_student:${studentId}`)
    ]
  ];

  sendMessageWithKeyboard(chatId, message, buttons);
}
