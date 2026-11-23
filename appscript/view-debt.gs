/**
 * VIEW DEBT - Xem danh sách công nợ
 */

/**
 * Handle /xem_no command
 */
function handleViewDebt(chatId) {
  try {
    const students = getStudentsWithDebt();

    if (students.length === 0) {
      sendMessage(chatId, '✅ *DANH SÁCH CÔNG NỢ*\n\nTất cả học viên đã đóng đủ học phí!', { parse_mode: 'Markdown' });
      return;
    }

    let totalDebt = 0;
    let text = `💰 *DANH SÁCH CÔNG NỢ*\n\n`;
    text += `Tổng: ${students.length} học viên còn nợ\n\n`;

    students.forEach((student, idx) => {
      totalDebt += student.conNo;

      text += `${idx + 1}. *${student.id}* - ${student.hoTen}\n`;
      text += `   📱 ${student.sdt}\n`;
      text += `   💵 Tổng HP: ${formatMoney(student.hocPhi)}\n`;
      text += `   ✅ Đã đóng: ${formatMoney(student.daDong)}\n`;
      text += `   💰 Còn nợ: *${formatMoney(student.conNo)}*\n`;
      text += `   👉 /thu\\_tien hoặc /xem\\_${student.id}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━\n`;
    text += `📊 *Tổng công nợ: ${formatMoney(totalDebt)}*`;

    sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in handleViewDebt: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi xem danh sách công nợ. Chi tiết: ' + error.message);
  }
}
