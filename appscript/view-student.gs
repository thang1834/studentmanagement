/**
 * VIEW STUDENT DETAIL
 * Handle /xem_HVXXX command
 */

/**
 * Handle /xem_HVXXX command
 */
function handleViewStudent(chatId, studentId) {
  try {
    // Convert to uppercase to match sheet format
    studentId = studentId.toUpperCase();

    const student = getStudentById(studentId);

    if (!student) {
      sendMessage(chatId, `❌ Không tìm thấy học viên *${studentId}*`, { parse_mode: 'Markdown' });
      return;
    }

    const conNo = student.conNo || 0;
    const noIcon = conNo > 0 ? '💰' : '✅';

    let text = `👤 *CHI TIẾT HỌC VIÊN*\n\n`;
    text += `🆔 Mã HV: *${student.id}*\n`;
    text += `📝 Họ tên: *${student.hoTen}*\n`;
    text += `🎂 Ngày sinh: ${formatDate(student.ngaySinh)}\n`;
    text += `⚧️ Giới tính: ${student.gioiTinh}\n`;
    text += `📱 SĐT: ${student.sdt}\n`;
    text += `🆔 CMND/CCCD: ${student.cmnd}\n\n`;

    text += `📍 *ĐỊA CHỈ*\n`;
    if (student.diaChiNha) {
      text += `   🏠 Nhà: ${student.diaChiNha}\n`;
    }
    if (student.diaChiLamViec) {
      text += `   🏢 Làm việc: ${student.diaChiLamViec}\n`;
    }
    if (student.ghiChuDiaChi) {
      text += `   📝 Ghi chú: ${student.ghiChuDiaChi}\n`;
    }
    text += `\n`;

    text += `🎓 *HỌC TẬP*\n`;
    text += `   📋 Loại bằng: *${student.loaiBang}*\n`;
    text += `   👨‍🏫 Giáo viên: ${student.giaoVien}\n`;
    text += `   📊 Trạng thái: ${student.trangThai}\n`;
    text += `   📅 Ngày nộp hồ sơ: ${formatDate(student.ngayNopHoSo)}\n`;
    if (student.ngayDangKy) {
      text += `   📅 Ngày đăng ký: ${formatDate(student.ngayDangKy)}\n`;
    }
    text += `\n`;

    text += `💰 *HỌC PHÍ*\n`;
    text += `   💵 Tổng học phí: *${formatMoney(student.hocPhi)}*\n`;
    text += `   ✅ Đã đóng: *${formatMoney(student.daDong)}*\n`;
    text += `   ${noIcon} Còn nợ: *${formatMoney(conNo)}*\n\n`;

    if (student.ghiChu) {
      text += `📝 Ghi chú: ${student.ghiChu}\n\n`;
    }

    if (student.ngayTao) {
      text += `🕐 Tạo: ${formatDate(student.ngayTao)}\n`;
    }
    if (student.capNhatCuoi) {
      text += `🕐 Cập nhật: ${formatDate(student.capNhatCuoi)}`;
    }

    const buttons = [
      [
        createInlineButton('📅 Lịch học', `student_schedule:${student.id}`),
        createInlineButton('💰 Thanh toán', `student_payment:${student.id}`)
      ],
      [
        createInlineButton('📊 Tiến độ', `student_progress:${student.id}`),
        createInlineButton('✏️ Sửa', `edit_student:${student.id}`)
      ],
      [
        createInlineButton('🗑️ Xóa', `delete_student:${student.id}`)
      ]
    ];

    sendMessageWithKeyboard(chatId, text, buttons);

  } catch (error) {
    Logger.log('Error in handleViewStudent: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi xem chi tiết học viên. Chi tiết: ' + error.message);
  }
}
