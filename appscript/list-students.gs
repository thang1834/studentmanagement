/**
 * LIST STUDENTS - Danh sách học viên
 * Handle /ds_hv command with pagination
 */

const STUDENTS_PER_PAGE = 10;

/**
 * Handle /ds_hv command
 */
function handleListStudents(chatId, messageId = null, page = 1) {
  try {
    const allStudents = getAllStudents();

    if (allStudents.length === 0) {
      sendMessage(chatId, '📋 Chưa có học viên nào trong hệ thống.');
      return;
    }

    const totalPages = Math.ceil(allStudents.length / STUDENTS_PER_PAGE);
    const startIdx = (page - 1) * STUDENTS_PER_PAGE;
    const endIdx = Math.min(startIdx + STUDENTS_PER_PAGE, allStudents.length);
    const pageStudents = allStudents.slice(startIdx, endIdx);

    let text = `📋 *DANH SÁCH HỌC VIÊN*\n`;
    text += `Trang ${page}/${totalPages} (Tổng: ${allStudents.length} học viên)\n\n`;

    pageStudents.forEach((student, idx) => {
      const stt = startIdx + idx + 1;
      const conNo = student.conNo || 0;
      const noIcon = conNo > 0 ? '💰' : '✅';

      text += `${stt}. *${student.id}* - ${student.hoTen}\n`;
      text += `   📱 ${student.sdt} | 🎓 ${student.loaiBang} | ${student.trangThai}\n`;
      text += `   ${noIcon} Còn nợ: *${formatMoney(conNo)}*\n`;
      text += `   👉 /xem\\_${student.id}\n\n`;
    });

    // Pagination buttons
    const buttons = [];
    const navRow = [];

    if (page > 1) {
      navRow.push(createInlineButton('◀️ Trang trước', `list_students:${page - 1}`));
    }

    navRow.push(createInlineButton(`📄 ${page}/${totalPages}`, 'noop'));

    if (page < totalPages) {
      navRow.push(createInlineButton('Trang sau ▶️', `list_students:${page + 1}`));
    }

    buttons.push(navRow);

    if (messageId) {
      editMessageWithKeyboard(chatId, messageId, text, buttons);
    } else {
      sendMessageWithKeyboard(chatId, text, buttons);
    }

  } catch (error) {
    Logger.log('Error in handleListStudents: ' + error);
    const errorMsg = messageId ?
      editMessage(chatId, messageId, '❌ Có lỗi khi lấy danh sách học viên.') :
      sendMessage(chatId, '❌ Có lỗi khi lấy danh sách học viên. Chi tiết: ' + error.message);
  }
}

/**
 * Handle pagination callback
 */
function handleListStudentsCallback(chatId, messageId, page) {
  handleListStudents(chatId, messageId, parseInt(page));
}
