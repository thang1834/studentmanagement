/**
 * Script tạo cấu trúc Google Sheets cho hệ thống quản lý học viên lái xe
 *
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Tạo Google Sheets mới
 * 2. Vào Extensions > Apps Script
 * 3. Copy toàn bộ code này vào
 * 4. Chạy function: setupAllSheets()
 * 5. Authorize khi được hỏi
 * 6. Chờ script chạy xong (1-2 phút)
 */

// Định nghĩa tên các sheets
const SHEET_NAMES = {
  STUDENTS: 'THÔNG TIN HỌC VIÊN',
  SCHEDULES: 'LỊCH HỌC',
  PROGRESS: 'TIẾN ĐỘ HỌC TẬP',
  PAYMENTS: 'THANH TOÁN',
  VEHICLES: 'QUẢN LÝ XE',
  EXAMS: 'LỊCH THI',
  REMINDERS: 'NHẮC NHỞ',
  REPORTS: 'BÁO CÁO THỐNG KÊ'
};

// Định nghĩa headers cho từng sheet
const HEADERS = {
  STUDENTS: [
    'ID', 'Họ tên', 'Ngày sinh', 'Giới tính', 'Số điện thoại', 'CMND/CCCD',
    'Địa chỉ nhà', 'Địa chỉ làm việc', 'Ghi chú địa chỉ', 'Ngày nộp hồ sơ',
    'Ngày đăng ký học', 'Loại bằng', 'Giáo viên phụ trách', 'Trạng thái',
    'Học phí (VNĐ)', 'Đã đóng (VNĐ)', 'Còn nợ (VNĐ)', 'Ghi chú',
    'Ngày tạo', 'Ngày cập nhật'
  ],
  SCHEDULES: [
    'ID buổi học', 'Ngày', 'Giờ bắt đầu', 'Giờ kết thúc', 'ID học viên',
    'Họ tên', 'Loại bằng', 'Loại buổi học', 'Nội dung', 'Địa chỉ đón',
    'Địa chỉ trả', 'Biển số xe', 'Loại xe', 'Trạng thái', 'Giáo viên',
    'Đánh giá', 'Ghi chú', 'Ngày tạo', 'Ngày cập nhật'
  ],
  PROGRESS: [
    'ID học viên', 'Họ tên', 'Giờ lý thuyết (đã học)', 'Giờ lý thuyết (tổng)',
    'Giờ thực hành (đã học)', 'Giờ thực hành (tổng)', '% hoàn thành',
    'Khởi động - dừng xe', 'Đổi số - ga - phanh', 'Vào cua phải/trái',
    'Đỗ xe dọc', 'Đỗ xe ngang', 'Lùi xe', 'Đường dốc', 'Vượt chướng ngại vật',
    'Điểm lý thuyết', 'Kết quả thực hành', 'Ngày thi dự kiến', 'Số lần thi',
    'Trạng thái cuối', 'Ngày cập nhật'
  ],
  PAYMENTS: [
    'ID giao dịch', 'Ngày giờ', 'Loại', 'Khoản mục', 'ID học viên',
    'Họ tên', 'Số tiền (VNĐ)', 'Hình thức', 'Người thu/chi',
    'Biên lai/Hóa đơn', 'Ghi chú', 'Ngày tạo'
  ],
  VEHICLES: [
    'Biển số', 'Phù hợp bằng', 'Loại xe', 'Hãng', 'Dòng xe', 'Năm sản xuất',
    'Km hiện tại', 'Trạng thái', 'Ngày đăng kiểm cuối', 'Ngày đăng kiểm tiếp theo',
    'Ngày bảo dưỡng cuối', 'Km bảo dưỡng tiếp theo', 'Chi phí bảo trì (tháng)',
    'Ghi chú', 'Ngày tạo', 'Ngày cập nhật'
  ],
  EXAMS: [
    'ID kỳ thi', 'ID học viên', 'Họ tên', 'Loại thi', 'Ngày thi', 'Giờ thi',
    'Địa điểm', 'Kết quả', 'Ghi chú', 'Ngày tạo', 'Ngày cập nhật'
  ],
  REMINDERS: [
    'ID', 'Loại', 'Tiêu đề', 'Nội dung', 'Ngày nhắc', 'Giờ nhắc',
    'ID đối tượng', 'Trạng thái', 'Gửi qua', 'Ngày tạo'
  ],
  REPORTS: [
    'Tháng/Năm', 'Số học viên mới', 'Số học viên tốt nghiệp',
    'Số học viên đang học', 'Số học viên bỏ học', 'Doanh thu (VNĐ)',
    'Chi phí (VNĐ)', 'Lợi nhuận (VNĐ)', 'Tổng giờ dạy',
    'Tỷ lệ đậu lý thuyết (%)', 'Tỷ lệ đậu thực hành (%)', 'Ngày tạo'
  ]
};

// Định nghĩa dropdown values
const DROPDOWNS = {
  GENDER: ['Nam', 'Nữ', 'Khác'],
  LICENSE_TYPE: ['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E'],
  STUDENT_STATUS: ['Chờ xử lý hồ sơ', 'Đang học', 'Chờ thi', 'Đã tốt nghiệp', 'Bỏ học'],
  SESSION_TYPE: ['Lý thuyết', 'Thực hành', 'Sa hình'],
  SCHEDULE_STATUS: ['Đã học', 'Chưa học', 'Hủy', 'Nghỉ có phép'],
  TRANSMISSION: ['Xe số', 'Xe ga', 'Xe côn', 'Xe số sàn', 'Xe tự động', 'Xe tải', 'Xe khách'],
  VEHICLE_STATUS: ['Đang dùng', 'Bảo trì', 'Ngừng hoạt động'],
  PAYMENT_TYPE: ['Thu', 'Chi'],
  PAYMENT_CATEGORY: ['Học phí', 'Lệ phí thi', 'Xăng xe', 'Bảo dưỡng', 'Sửa chữa', 'Đăng kiểm', 'Bảo hiểm', 'Khác'],
  PAYMENT_METHOD: ['Tiền mặt', 'Chuyển khoản'],
  EXAM_TYPE: ['Lý thuyết', 'Thực hành', 'Sát hạch'],
  EXAM_RESULT: ['Chưa thi', 'Đạt', 'Không đạt', 'Vắng mặt'],
  SKILL_STATUS: ['✓', '✗'],
  RESULT: ['Đạt', 'Chưa đạt'],
  REMINDER_TYPE: ['Sinh nhật', 'Đóng tiền', 'Lịch học', 'Lịch thi', 'Bảo dưỡng xe', 'Đăng kiểm', 'Khác'],
  REMINDER_STATUS: ['Chờ gửi', 'Đã gửi', 'Hủy'],
  REMINDER_CHANNEL: ['Telegram']
};

/**
 * MAIN FUNCTION - Chạy function này để setup tất cả
 */
function setupAllSheets(ss) {
  // Không truyền ss (chạy tay trong trình soạn) → file gốc; teachers.gs truyền Sheet mới tạo cho giáo viên
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('🚀 Bắt đầu setup sheets...');

  // Tạo các sheets TRƯỚC (để tránh xóa hết sheets)
  createAllSheets(ss);
  Logger.log('✅ Đã tạo các sheets mới');

  // Xóa sheet mặc định sau khi đã tạo sheets mới
  deleteDefaultSheets(ss);
  Logger.log('✅ Đã xóa sheets mặc định');

  // Setup headers
  setupHeaders(ss);
  Logger.log('✅ Đã setup headers');

  // Setup data validation
  setupValidation(ss);
  Logger.log('✅ Đã setup validation');

  // Setup formulas
  setupFormulas(ss);
  Logger.log('✅ Đã setup formulas');

  // Format sheets
  formatSheets(ss);
  Logger.log('✅ Đã format sheets');

  Logger.log('🎉 Hoàn tất! Spreadsheet đã sẵn sàng sử dụng!');
  showAlert('✅ Hoàn tất!\n\nĐã tạo 8 sheets thành công:\n\n' +
    '1. THÔNG TIN HỌC VIÊN\n' +
    '2. LỊCH HỌC\n' +
    '3. TIẾN ĐỘ HỌC TẬP\n' +
    '4. THANH TOÁN\n' +
    '5. QUẢN LÝ XE\n' +
    '6. LỊCH THI\n' +
    '7. NHẮC NHỞ\n' +
    '8. BÁO CÁO THỐNG KÊ\n\n' +
    'Spreadsheet ID: ' + ss.getId());
}

/**
 * Xóa sheets mặc định (giữ lại nếu cần để tránh lỗi)
 */
function deleteDefaultSheets(ss) {
  try {
    const sheets = ss.getSheets();
    const sheetNames = Object.values(SHEET_NAMES);

    // Lọc ra các sheet cần xóa (không thuộc danh sách sheets chính)
    const sheetsToDelete = [];

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      const name = sheet.getName();
      if (!sheetNames.includes(name)) {
        sheetsToDelete.push(sheet);
      }
    }

    // Chỉ xóa nếu còn đủ sheets
    if (sheets.length > sheetsToDelete.length) {
      for (let i = 0; i < sheetsToDelete.length; i++) {
        try {
          const sheetName = sheetsToDelete[i].getName();
          ss.deleteSheet(sheetsToDelete[i]);
          Logger.log('Đã xóa sheet: ' + sheetName);
        } catch (e) {
          Logger.log('Lỗi xóa sheet: ' + e.toString());
        }
      }
    } else {
      Logger.log('Không xóa sheet mặc định (cần giữ ít nhất 1 sheet)');
    }
  } catch (error) {
    Logger.log('Lỗi trong deleteDefaultSheets: ' + error.toString());
    // Không throw error để script tiếp tục
  }
}

/**
 * Tạo tất cả sheets
 */
function createAllSheets(ss) {
  Object.values(SHEET_NAMES).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('Đã tạo sheet: ' + sheetName);
    }
  });
}

/**
 * Setup headers cho tất cả sheets
 */
function setupHeaders(ss) {
  // Nếu không có ss parameter, lấy active spreadsheet
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  Object.entries(SHEET_NAMES).forEach(([key, sheetName]) => {
    const sheet = ss.getSheetByName(sheetName);
    const headers = HEADERS[key];

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#3498db');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');

    // Freeze header row
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(1);

    Logger.log('Đã setup headers cho: ' + sheetName);
  });
}

/**
 * Setup data validation (dropdowns)
 */
function setupValidation(ss) {
  // Nếu không có ss parameter, lấy active spreadsheet
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  // STUDENTS sheet
  const studentsSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);

  // Gender (column D)
  studentsSheet.getRange('D2:D1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.GENDER, true)
      .build()
  );

  // License type (column L)
  studentsSheet.getRange('L2:L1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.LICENSE_TYPE, true)
      .build()
  );

  // Status (column N)
  studentsSheet.getRange('N2:N1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.STUDENT_STATUS, true)
      .build()
  );

  Logger.log('✓ Validation: STUDENTS');

  // SCHEDULES sheet
  const schedulesSheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);

  // Session type (column H)
  schedulesSheet.getRange('H2:H1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.SESSION_TYPE, true)
      .build()
  );

  // Status (column N)
  schedulesSheet.getRange('N2:N1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.SCHEDULE_STATUS, true)
      .build()
  );

  Logger.log('✓ Validation: SCHEDULES');

  // PROGRESS sheet
  const progressSheet = ss.getSheetByName(SHEET_NAMES.PROGRESS);

  // Skills (columns H-O)
  for (let col = 8; col <= 15; col++) {
    const colLetter = String.fromCharCode(64 + col);
    progressSheet.getRange(colLetter + '2:' + colLetter + '1000').setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(DROPDOWNS.SKILL_STATUS, true)
        .build()
    );
  }

  // Results (columns Q, T)
  ['Q', 'T'].forEach(col => {
    progressSheet.getRange(col + '2:' + col + '1000').setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(DROPDOWNS.RESULT, true)
        .build()
    );
  });

  Logger.log('✓ Validation: PROGRESS');

  // PAYMENTS sheet
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);

  // Type (column C)
  paymentsSheet.getRange('C2:C1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.PAYMENT_TYPE, true)
      .build()
  );

  // Category (column D)
  paymentsSheet.getRange('D2:D1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.PAYMENT_CATEGORY, true)
      .build()
  );

  // Method (column H)
  paymentsSheet.getRange('H2:H1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.PAYMENT_METHOD, true)
      .build()
  );

  Logger.log('✓ Validation: PAYMENTS');

  // VEHICLES sheet
  const vehiclesSheet = ss.getSheetByName(SHEET_NAMES.VEHICLES);

  // License type (column B)
  vehiclesSheet.getRange('B2:B1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.LICENSE_TYPE, true)
      .build()
  );

  // Transmission (column C)
  vehiclesSheet.getRange('C2:C1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.TRANSMISSION, true)
      .build()
  );

  // Status (column H)
  vehiclesSheet.getRange('H2:H1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.VEHICLE_STATUS, true)
      .build()
  );

  Logger.log('✓ Validation: VEHICLES');

  // EXAMS sheet
  const examsSheet = ss.getSheetByName(SHEET_NAMES.EXAMS);

  // Exam type (column D)
  examsSheet.getRange('D2:D1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.EXAM_TYPE, true)
      .build()
  );

  // Result (column H)
  examsSheet.getRange('H2:H1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.EXAM_RESULT, true)
      .build()
  );

  Logger.log('✓ Validation: EXAMS');

  // REMINDERS sheet
  const remindersSheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);

  // Type (column B)
  remindersSheet.getRange('B2:B1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.REMINDER_TYPE, true)
      .build()
  );

  // Status (column H)
  remindersSheet.getRange('H2:H1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.REMINDER_STATUS, true)
      .build()
  );

  // Channel (column I)
  remindersSheet.getRange('I2:I1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DROPDOWNS.REMINDER_CHANNEL, true)
      .build()
  );

  Logger.log('✓ Validation: REMINDERS');
}

/**
 * Setup formulas
 */
function setupFormulas(ss) {
  // Nếu không có ss parameter, lấy active spreadsheet
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  const studentsSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const schedulesSheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);
  const progressSheet = ss.getSheetByName(SHEET_NAMES.PROGRESS);
  const paymentsSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  const reportsSheet = ss.getSheetByName(SHEET_NAMES.REPORTS);

  // STUDENTS - Debt formula (column Q) - chỉ tính khi có học phí
  studentsSheet.getRange('Q2').setFormula('=IF(OR(O2="";P2="");"";O2-P2)');
  studentsSheet.getRange('Q2').copyTo(studentsSheet.getRange('Q3:Q1000'));
  Logger.log('✓ Formulas: STUDENTS');

  // SCHEDULES - Student name (column F) - hiển thị rỗng thay vì lỗi
  schedulesSheet.getRange('F2').setFormula('=IF(E2="";""' + ';IFERROR(VLOOKUP(E2;\'' + SHEET_NAMES.STUDENTS + '\'!A:B;2;0);""))');
  schedulesSheet.getRange('F2').copyTo(schedulesSheet.getRange('F3:F1000'));

  // SCHEDULES - License type (column G)
  schedulesSheet.getRange('G2').setFormula('=IF(E2="";""' + ';IFERROR(VLOOKUP(E2;\'' + SHEET_NAMES.STUDENTS + '\'!A:L;12;0);""))');
  schedulesSheet.getRange('G2').copyTo(schedulesSheet.getRange('G3:G1000'));

  // SCHEDULES - Vehicle type (column M)
  schedulesSheet.getRange('M2').setFormula('=IF(L2="";""' + ';IFERROR(VLOOKUP(L2;\'' + SHEET_NAMES.VEHICLES + '\'!A:C;3;0);""))');
  schedulesSheet.getRange('M2').copyTo(schedulesSheet.getRange('M3:M1000'));
  Logger.log('✓ Formulas: SCHEDULES');

  // PROGRESS - Student name (column B)
  progressSheet.getRange('B2').setFormula('=IF(A2="";""' + ';IFERROR(VLOOKUP(A2;\'' + SHEET_NAMES.STUDENTS + '\'!A:B;2;0);""))');
  progressSheet.getRange('B2').copyTo(progressSheet.getRange('B3:B1000'));

  // PROGRESS - Completion percentage (column G) - chỉ tính khi có tổng giờ
  progressSheet.getRange('G2').setFormula('=IF(OR(D2="";F2="";D2=0;F2=0);""' + ';ROUND(((C2/D2)+(E2/F2))/2*100;2))');
  progressSheet.getRange('G2').copyTo(progressSheet.getRange('G3:G1000'));
  Logger.log('✓ Formulas: PROGRESS');

  // PAYMENTS - Student name (column F)
  paymentsSheet.getRange('F2').setFormula('=IF(E2="";""' + ';IFERROR(VLOOKUP(E2;\'' + SHEET_NAMES.STUDENTS + '\'!A:B;2;0);""))');
  paymentsSheet.getRange('F2').copyTo(paymentsSheet.getRange('F3:F1000'));
  Logger.log('✓ Formulas: PAYMENTS');

  // EXAMS - không dùng công thức (createExam ghi trực tiếp Họ tên)

  // REPORTS - Profit (column H) - chỉ tính khi có doanh thu và chi phí
  reportsSheet.getRange('H2').setFormula('=IF(OR(F2="";G2="");"";F2-G2)');
  reportsSheet.getRange('H2').copyTo(reportsSheet.getRange('H3:H1000'));
  Logger.log('✓ Formulas: REPORTS');
}

/**
 * Format sheets (auto-resize columns)
 */
function formatSheets(ss) {
  // Nếu không có ss parameter, lấy active spreadsheet
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  Object.values(SHEET_NAMES).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);

    // Auto-resize all columns
    const lastCol = sheet.getLastColumn();
    for (let i = 1; i <= lastCol; i++) {
      sheet.autoResizeColumn(i);
    }

    // Set minimum width
    for (let i = 1; i <= lastCol; i++) {
      const width = sheet.getColumnWidth(i);
      if (width < 100) {
        sheet.setColumnWidth(i, 100);
      }
    }

    Logger.log('Đã format sheet: ' + sheetName);
  });
}

/**
 * Hiện hộp thoại khi chạy từ Google Sheets; chạy từ trình soạn Apps Script không có UI nên chỉ ghi log.
 */
function showAlert(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(message);
  }
}

/**
 * MIGRATION - Chuyển sheet LỊCH THI tạo bằng phiên bản cũ (13 cột, 1 kỳ thi nhiều học viên)
 * sang cấu trúc 11 cột mà code bot đang dùng (1 dòng = 1 học viên/kỳ thi).
 * Chạy 1 lần trên spreadsheet đã setup trước đó.
 * Giữ nguyên dữ liệu bot đã ghi, chỉ xóa header / validation / công thức cũ.
 */
function migrateExamSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.EXAMS);

  if (!sheet) {
    throw new Error('Không tìm thấy sheet ' + SHEET_NAMES.EXAMS);
  }

  const oldColCount = 13;

  // 1. Thay công thức cũ (Số lượng, Kết quả chung) bằng ô rỗng, giữ nguyên giá trị thật
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const range = sheet.getRange(2, 1, lastRow - 1, oldColCount);
    const formulas = range.getFormulas();
    const values = range.getValues();
    range.setValues(values.map((row, i) => row.map((v, j) => formulas[i][j] ? '' : v)));
  }

  // 2. Xóa header và validation cũ
  sheet.getRange(1, 1, 1, oldColCount).clearContent();
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, oldColCount).clearDataValidations();

  // 3. Ghi header + validation mới (2 hàm này chạy lại trên mọi sheet nhưng idempotent)
  setupHeaders(ss);
  setupValidation(ss);

  Logger.log('✅ Đã chuyển sheet ' + SHEET_NAMES.EXAMS + ' sang cấu trúc 11 cột');
  showAlert('✅ Đã cập nhật sheet LỊCH THI sang cấu trúc mới.');
}

/**
 * Function để test - chỉ tạo 1 sheet mẫu
 */
function testCreateOneSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS) || ss.insertSheet(SHEET_NAMES.STUDENTS);

  // Set headers
  const headers = HEADERS.STUDENTS;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#3498db');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');

  showAlert('Test thành công!');
}
