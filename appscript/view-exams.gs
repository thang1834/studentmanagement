/**
 * VIEW EXAMS - Hiển thị danh sách kỳ thi
 */

/**
 * Handle list exams command
 */
function handleListExams(chatId) {
  const exams = getUpcomingExams();

  if (exams.length === 0) {
    sendMessage(chatId, '📋 Chưa có lịch thi nào được đặt.');
    return;
  }

  // Sort by exam date
  exams.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

  let message = `📋 *DANH SÁCH LỊCH THI*\n\n`;
  message += `Tổng số: ${exams.length} kỳ thi\n\n`;

  for (let i = 0; i < exams.length; i++) {
    const exam = exams[i];

    // Format date properly
    const examDate = typeof exam.examDate === 'string' ? exam.examDate :
      formatDate(exam.examDate);

    // Format time properly
    const examTime = exam.examTime ?
      (typeof exam.examTime === 'string' ? exam.examTime :
        Utilities.formatDate(new Date(exam.examTime), 'Asia/Ho_Chi_Minh', 'HH:mm')) : '';

    message += `🎓 *${exam.examId}*\n`;
    message += `👤 ${exam.studentName} (${exam.studentId})\n`;
    message += `📝 ${exam.examType}\n`;
    message += `📅 ${examDate}`;
    if (examTime) {
      message += ` ${examTime}`;
    }
    message += `\n`;
    if (exam.location) {
      message += `📍 ${exam.location}\n`;
    }
    message += `${getExamStatusIcon(exam.result)} ${exam.result}\n`;

    if (i < exams.length - 1) {
      message += `\n`;
    }
  }

  sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Get exam status icon
 */
function getExamStatusIcon(result) {
  switch (result) {
    case 'Chưa thi':
      return '⏳';
    case 'Đạt':
      return '✅';
    case 'Không đạt':
      return '❌';
    case 'Vắng mặt':
      return '⚠️';
    default:
      return '📝';
  }
}
