/**
 * SEARCH STUDENTS - Tìm kiếm học viên
 * Handle /tim_hv command
 */

/**
 * Search students by keyword
 */
function searchStudent(chatId, keyword) {
  try {
    const allStudents = getAllStudents();

    if (allStudents.length === 0) {
      sendMessage(chatId, '📋 Chưa có học viên nào trong hệ thống.');
      return;
    }

    // Search in: ID, hoTen, sdt, cmnd
    const lowerKeyword = keyword.toLowerCase();
    const results = allStudents.filter(student => {
      return (
        student.id.toLowerCase().includes(lowerKeyword) ||
        student.hoTen.toLowerCase().includes(lowerKeyword) ||
        student.sdt.includes(keyword) ||
        student.cmnd.includes(keyword)
      );
    });

    if (results.length === 0) {
      sendMessage(chatId, `🔍 Không tìm thấy học viên với từ khóa: *${keyword}*`, { parse_mode: 'Markdown' });
      return;
    }

    let text = `🔍 *KẾT QUẢ TÌM KIẾM*\n`;
    text += `Từ khóa: "${keyword}"\n`;
    text += `Tìm thấy: ${results.length} học viên\n\n`;

    results.forEach((student, idx) => {
      const conNo = student.conNo || 0;
      const noIcon = conNo > 0 ? '💰' : '✅';

      text += `${idx + 1}. *${student.id}* - ${student.hoTen}\n`;
      text += `   📱 ${student.sdt} | 🎓 ${student.loaiBang} | ${student.trangThai}\n`;
      text += `   ${noIcon} Còn nợ: *${formatMoney(conNo)}*\n`;
      text += `   👉 /xem\\_${student.id}\n\n`;
    });

    sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in searchStudent: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tìm kiếm học viên. Chi tiết: ' + error.message);
  }
}
