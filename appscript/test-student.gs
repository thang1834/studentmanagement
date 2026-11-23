/**
 * TEST - Tạo học viên test trực tiếp
 */
function testCreateStudent() {
  const testData = {
    hoTen: 'Test Nguyễn',
    sdt: '0123456789',
    cmnd: '123456789',
    ngaySinh: '01/01/2000',
    gioiTinh: 'Nam',
    diaChiNha: 'Hà Nội Test',
    diaChiLamViec: '',
    ghiChuDiaChi: '',
    ngayNopHoSo: '17/10/2026',
    loaiBang: 'B1',
    giaoVien: 'Test GV',
    hocPhi: 10000000,
    daDong: 5000000
  };

  Logger.log('=== TEST CREATE STUDENT ===');
  Logger.log('Test data: ' + JSON.stringify(testData));

  try {
    const studentId = createStudent(testData);
    Logger.log('✅ SUCCESS! Student ID: ' + studentId);
    return studentId;
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

/**
 * TEST - Kiểm tra sheet có tồn tại không
 */
function testSheetExists() {
  Logger.log('=== TEST SHEET EXISTS ===');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Spreadsheet name: ' + ss.getName());
  Logger.log('Spreadsheet ID: ' + ss.getId());

  const sheetName = 'THÔNG TIN HỌC VIÊN';
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log('❌ Sheet "' + sheetName + '" KHÔNG TỒN TẠI!');
    Logger.log('Available sheets:');
    ss.getSheets().forEach(s => Logger.log('  - ' + s.getName()));
    return false;
  }

  Logger.log('✅ Sheet exists!');
  Logger.log('Last row: ' + sheet.getLastRow());
  Logger.log('Headers: ' + sheet.getRange(1, 1, 1, 10).getValues()[0].join(', '));

  return true;
}

/**
 * TEST - Đọc tất cả students
 */
function testGetAllStudents() {
  Logger.log('=== TEST GET ALL STUDENTS ===');

  try {
    const students = getAllStudents();
    Logger.log('Total students: ' + students.length);

    if (students.length > 0) {
      Logger.log('First student: ' + JSON.stringify(students[0]));
    }

    return students;
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    throw error;
  }
}
