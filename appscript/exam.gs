/**
 * EXAM MANAGEMENT - Quản lý thi
 */

const EXAM_SHEET = 'LỊCH THI';

/**
 * Get exam sheet
 */
function getExamSheet() {
  return getDb().getSheetByName(EXAM_SHEET);
}

/**
 * Generate next exam ID
 */
function getNextExamId() {
  const sheet = getExamSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return 'THI001';
  }

  // Read all IDs in one batch
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];
    if (id && typeof id === 'string' && id.startsWith('THI')) {
      const num = parseInt(id.replace('THI', ''));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return 'THI' + (maxNum + 1).toString().padStart(3, '0');
}

/**
 * Get all exams
 */
function getAllExams() {
  const sheet = getExamSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const exams = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (!row[0]) continue; // Skip empty rows

    exams.push({
      examId: row[0],
      studentId: row[1],
      studentName: row[2],
      examType: row[3],
      examDate: row[4],
      examTime: row[5],
      location: row[6],
      result: row[7],
      notes: row[8],
      createdDate: row[9],
      updatedDate: row[10]
    });
  }

  return exams;
}

/**
 * Get exams by student
 */
function getExamsByStudent(studentId) {
  const allExams = getAllExams();
  return allExams.filter(exam => exam.studentId === studentId);
}

/**
 * Get upcoming exams (chưa thi hoặc ngày thi >= hôm nay)
 */
function getUpcomingExams() {
  const allExams = getAllExams();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return allExams.filter(exam => {
    const examDate = new Date(exam.examDate);
    examDate.setHours(0, 0, 0, 0);
    return exam.result === 'Chưa thi' || examDate >= today;
  });
}

/**
 * Create new exam
 */
function createExam(data) {
  const sheet = getExamSheet();
  const examId = getNextExamId();
  const now = getCurrentTimestamp();

  // Get student name
  const student = getStudentById(data.studentId);
  const studentName = student ? student.hoTen : '';

  // Columns: Mã thi, Mã HV, Tên HV, Loại thi, Ngày thi, Giờ thi,
  // Địa điểm, Kết quả, Ghi chú, Ngày tạo, Ngày cập nhật

  const row = [
    examId,                         // A: Mã thi
    data.studentId,                 // B: Mã HV
    studentName,                    // C: Tên HV
    data.examType,                  // D: Loại thi
    data.examDate,                  // E: Ngày thi
    data.examTime || '',            // F: Giờ thi
    data.location || '',            // G: Địa điểm
    'Chưa thi',                     // H: Kết quả
    data.notes || '',               // I: Ghi chú
    now,                            // J: Ngày tạo
    now                             // K: Ngày cập nhật
  ];

  sheet.appendRow(row);
  return examId;
}

/**
 * Update exam result
 */
function updateExamResult(examId, result, notes) {
  const sheet = getExamSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return false;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === examId) {
      const rowIndex = i + 2;
      sheet.getRange(rowIndex, 8).setValue(result); // Column H: Kết quả
      if (notes) {
        sheet.getRange(rowIndex, 9).setValue(notes); // Column I: Ghi chú
      }
      sheet.getRange(rowIndex, 11).setValue(getCurrentTimestamp()); // Column K: Ngày cập nhật
      return true;
    }
  }

  return false;
}
