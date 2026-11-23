/**
 * SCHEDULE CONVERSATION - Đặt lịch học
 * Multi-step conversation flow for creating schedules
 */

/**
 * Start schedule conversation
 */
function startScheduleConversation(chatId, userId) {
  // Check if there are any students
  const students = getAllStudents();

  if (students.length === 0) {
    sendMessage(chatId, '❌ Chưa có học viên nào trong hệ thống.\n\nVui lòng thêm học viên trước: /them\\_hv', { parse_mode: 'Markdown' });
    return;
  }

  // Initialize conversation state
  const state = {
    type: 'add_schedule',
    step: 'chon_hoc_vien',
    data: {}
  };

  setConversationState(userId, state);

  // Show student selection with inline keyboard
  showStudentSelection(chatId, userId, students);
}

/**
 * Show student selection
 */
function showStudentSelection(chatId, userId, students, page = 1) {
  const perPage = 5;
  const totalPages = Math.ceil(students.length / perPage);
  const startIdx = (page - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, students.length);
  const pageStudents = students.slice(startIdx, endIdx);

  let text = `📅 *ĐẶT LỊCH HỌC MỚI*\n\n`;
  text += `Bước 1/5: Chọn học viên\n\n`;

  const buttons = [];

  pageStudents.forEach(student => {
    buttons.push([
      createInlineButton(
        `${student.id} - ${student.hoTen}`,
        `schedule_student:${student.id}`
      )
    ]);
  });

  // Pagination
  const navRow = [];
  if (page > 1) {
    navRow.push(createInlineButton('◀️ Trước', `schedule_students_page:${page - 1}`));
  }
  if (page < totalPages) {
    navRow.push(createInlineButton('Sau ▶️', `schedule_students_page:${page + 1}`));
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  buttons.push([createInlineButton('❌ Hủy', 'schedule_cancel')]);

  sendMessageWithKeyboard(chatId, text, buttons);
}

/**
 * Handle student selection
 */
function handleScheduleStudentCallback(chatId, userId, studentId) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_hoc_vien') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /dat\\_lich', { parse_mode: 'Markdown' });
    return;
  }

  const student = getStudentById(studentId);
  if (!student) {
    sendMessage(chatId, '❌ Không tìm thấy học viên.');
    return;
  }

  // Save and move to next step
  state.data.maHocVien = studentId;
  state.data.hoTen = student.hoTen;
  state.step = 'nhap_ngay';
  setConversationState(userId, state);

  const text = `✅ Đã chọn: *${student.hoTen}* (${studentId})\n\n` +
    `📅 *Bước 2/5: Nhập ngày học*\n\n` +
    `Định dạng: DD/MM/YYYY\n` +
    `Ví dụ: 20/10/2026\n\n` +
    `Hoặc gõ "hôm nay", "ngày mai"`;

  sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

/**
 * Handle schedule conversation state
 */
function handleScheduleConversationState(chatId, userId, text) {
  const state = getConversationState(userId);

  if (!state) return false;

  switch (state.step) {
    case 'nhap_ngay':
      return handleScheduleDateInput(chatId, userId, text, state);

    case 'nhap_gio_bat_dau':
      return handleScheduleStartTimeInput(chatId, userId, text, state);

    case 'nhap_gio_ket_thuc':
      return handleScheduleEndTimeInput(chatId, userId, text, state);

    case 'nhap_ghi_chu':
      return handleScheduleNoteInput(chatId, userId, text, state);
  }

  return false;
}

/**
 * Handle date input
 */
function handleScheduleDateInput(chatId, userId, text, state) {
  // parseDate đã xử lý "hôm nay", "ngày mai" và trả về chuỗi dd/MM/yyyy (hoặc null)
  const ngay = parseDate(text);

  if (!ngay) {
    sendMessage(chatId, '❌ Ngày không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 20/10/2026 hoặc "hôm nay"');
    return true;
  }

  // Save and next step
  state.data.ngay = ngay;
  state.step = 'nhap_gio_bat_dau';
  setConversationState(userId, state);

  const text2 = `✅ Ngày: *${state.data.ngay}*\n\n` +
    `⏰ *Bước 3/5: Nhập giờ bắt đầu*\n\n` +
    `Định dạng: HH:mm\n` +
    `Ví dụ: 08:00, 14:30`;

  sendMessage(chatId, text2, { parse_mode: 'Markdown' });
  return true;
}

/**
 * Handle start time input
 */
function handleScheduleStartTimeInput(chatId, userId, text, state) {
  const time = parseTime(text);

  if (!time) {
    sendMessage(chatId, '❌ Giờ không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 08:00, 14:30, 8h, 14h30');
    return true;
  }

  state.data.gioBatDau = time;
  state.step = 'nhap_gio_ket_thuc';
  setConversationState(userId, state);

  const text2 = `✅ Giờ bắt đầu: *${time}*\n\n` +
    `⏰ *Bước 4/5: Nhập giờ kết thúc*\n\n` +
    `Ví dụ: 10:00, 16:30, 10h, 16h30`;

  sendMessage(chatId, text2, { parse_mode: 'Markdown' });
  return true;
}

/**
 * Handle end time input
 */
function handleScheduleEndTimeInput(chatId, userId, text, state) {
  const endTime = parseTime(text);

  if (!endTime) {
    sendMessage(chatId, '❌ Giờ không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 10:00, 16:30, 10h, 16h30');
    return true;
  }

  // Validate end time > start time
  if (endTime <= state.data.gioBatDau) {
    sendMessage(chatId, '❌ Giờ kết thúc phải sau giờ bắt đầu. Vui lòng nhập lại.');
    return true;
  }

  state.data.gioKetThuc = endTime;
  state.step = 'chon_loai_buoi';
  setConversationState(userId, state);

  // Show session type selection
  const buttons = [
    [createInlineButton('📖 Lý thuyết', 'schedule_type:Lý thuyết')],
    [createInlineButton('🚗 Thực hành', 'schedule_type:Thực hành')],
    [createInlineButton('🏁 Sa hình', 'schedule_type:Sa hình')]
  ];

  const text2 = `✅ Giờ kết thúc: *${state.data.gioKetThuc}*\n\n` +
    `📚 *Bước 5/5: Chọn loại buổi học*`;

  sendMessageWithKeyboard(chatId, text2, buttons);
  return true;
}

/**
 * Handle session type selection
 */
function handleScheduleTypeCallback(chatId, userId, sessionType) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_loai_buoi') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /dat\\_lich', { parse_mode: 'Markdown' });
    return;
  }

  state.data.loaiBuoiHoc = sessionType;
  state.step = 'nhap_ghi_chu';
  setConversationState(userId, state);

  const buttons = [[createInlineButton('⏭️ Bỏ qua', 'schedule_skip_note')]];

  const text = `✅ Loại buổi: *${sessionType}*\n\n` +
    `📝 *Ghi chú (không bắt buộc)*\n\n` +
    `Nhập ghi chú hoặc bấm Bỏ qua:`;

  sendMessageWithKeyboard(chatId, text, buttons);
}

/**
 * Handle note input
 */
function handleScheduleNoteInput(chatId, userId, text, state) {
  state.data.ghiChu = text.trim();

  // Create schedule
  try {
    const scheduleId = createSchedule(state.data);

    clearConversationState(userId);

    let summary = `✅ *ĐÃ TẠO LỊCH HỌC THÀNH CÔNG*\n\n`;
    summary += `🆔 Mã lịch: *${scheduleId}*\n`;
    summary += `👤 Học viên: ${state.data.hoTen}\n`;
    summary += `📅 Ngày: ${state.data.ngay}\n`;
    summary += `⏰ Giờ: ${state.data.gioBatDau} - ${state.data.gioKetThuc}\n`;
    summary += `📚 Loại buổi: ${state.data.loaiBuoiHoc}\n`;
    if (state.data.ghiChu) {
      summary += `📝 Ghi chú: ${state.data.ghiChu}\n`;
    }

    sendMessage(chatId, summary, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error creating schedule: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tạo lịch học. Chi tiết: ' + error.message);
  }

  return true;
}

/**
 * Handle skip note
 */
function handleScheduleSkipNoteCallback(chatId, userId) {
  return handleScheduleNoteInput(chatId, userId, '', getConversationState(userId));
}

/**
 * Handle cancel
 */
function handleScheduleCancelCallback(chatId, userId) {
  clearConversationState(userId);
  sendMessage(chatId, '❌ Đã hủy đặt lịch học.');
}
