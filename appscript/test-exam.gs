/**
 * TEST EXAM FUNCTIONS
 */

/**
 * Test if exam sheet exists
 */
function testExamSheetExists() {
  const sheet = getExamSheet();

  if (!sheet) {
    Logger.log('❌ Exam sheet does not exist');
    return false;
  }

  const lastRow = sheet.getLastRow();
  Logger.log('✅ Exam sheet exists with ' + lastRow + ' rows');
  return true;
}

/**
 * Test create exam
 */
function testCreateExam() {
  Logger.log('=== TEST CREATE EXAM ===');

  // First, get a test student
  const students = getAllStudents();
  if (students.length === 0) {
    Logger.log('❌ No students found. Create a student first.');
    return;
  }

  const testStudent = students[0];

  const testData = {
    studentId: testStudent.studentId,
    examType: 'Lý thuyết',
    examDate: '2024-12-25',
    examTime: '08:00',
    location: 'Sân thi Quận 1'
  };

  try {
    const examId = createExam(testData);
    Logger.log('✅ Exam created successfully: ' + examId);

    // Verify
    const exams = getAllExams();
    const found = exams.find(e => e.examId === examId);

    if (found) {
      Logger.log('✅ Exam found in sheet');
      Logger.log('Student: ' + found.studentName);
      Logger.log('Type: ' + found.examType);
      Logger.log('Date: ' + found.examDate);
      Logger.log('Result: ' + found.result);
    } else {
      Logger.log('❌ Exam not found in sheet');
    }

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * Test get upcoming exams
 */
function testGetUpcomingExams() {
  Logger.log('=== TEST GET UPCOMING EXAMS ===');

  try {
    const exams = getUpcomingExams();
    Logger.log('Total upcoming exams: ' + exams.length);

    if (exams.length > 0) {
      Logger.log('\nFirst exam:');
      Logger.log(JSON.stringify(exams[0], null, 2));
    }

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * Test get all exams
 */
function testGetAllExams() {
  Logger.log('=== TEST GET ALL EXAMS ===');

  try {
    const exams = getAllExams();
    Logger.log('Total exams: ' + exams.length);

    if (exams.length > 0) {
      Logger.log('\nFirst exam:');
      Logger.log(JSON.stringify(exams[0], null, 2));
    }

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}
