/**
 * EXAM CONVERSATION - Đặt lịch thi
 * Flow: Student selection → Exam type → Date → Time → Location → Confirm
 */

/**
 * Start exam scheduling conversation
 */
function startExamConversation(chatId, userId) {
  const state = {
    type: 'add_exam',
    step: 'chon_hoc_vien',
    data: {},
    chatId: chatId
  };

  setConversationState(userId, state);

  // Get students who are ready for exam (have completed enough sessions)
  const students = getAllStudents();

  if (students.length === 0) {
    sendMessage(chatId, '❌ Chưa có học viên nào trong hệ thống.');
    clearConversationState(userId);
    return;
  }

  showExamStudentSelection(chatId, userId, students, 1);
}

/**
 * Show student selection for exam
 */
function showExamStudentSelection(chatId, userId, students, page) {
  const pageSize = 5;
  const totalPages = Math.ceil(students.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, students.length);

  let message = `🎓 *ĐẶT LỊCH THI*\n\n`;
  message += `Bước 1/5: Chọn học viên\n\n`;

  const buttons = [];

  for (let i = start; i < end; i++) {
    const student = students[i];
    const label = `${student.hoTen} - ${student.id}`;
    buttons.push([createInlineButton(label, `exam_student:${student.id}`)]);
  }

  // Pagination
  if (totalPages > 1) {
    const navButtons = [];
    if (page > 1) {
      navButtons.push(createInlineButton('⬅️ Trước', `exam_students_page:${page - 1}`));
    }
    navButtons.push(createInlineButton(`${page}/${totalPages}`, 'noop'));
    if (page < totalPages) {
      navButtons.push(createInlineButton('Sau ➡️', `exam_students_page:${page + 1}`));
    }
    buttons.push(navButtons);
  }

  buttons.push([createInlineButton('❌ Hủy', 'exam_cancel')]);

  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Handle exam conversation step
 */
function handleAddExamStep(chatId, userId, state, text) {
  switch (state.step) {
    case 'nhap_ngay_thi':
      handleExamDateInput(chatId, userId, text, state);
      break;

    case 'nhap_gio_thi':
      handleExamTimeInput(chatId, userId, text, state);
      break;

    case 'nhap_dia_diem':
      handleExamLocationInput(chatId, userId, text, state);
      break;
  }
}

/**
 * Handle student selection callback
 */
function handleExamStudentCallback(chatId, userId, studentId) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_hoc_vien') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /dat\\_lich\\_thi', { parse_mode: 'Markdown' });
    return;
  }

  const student = getStudentById(studentId);
  if (!student) {
    sendMessage(chatId, '❌ Không tìm thấy học viên.');
    return;
  }

  state.data.studentId = studentId;
  state.data.studentName = student.hoTen;
  state.step = 'chon_loai_thi';
  setConversationState(userId, state);

  // Show exam type selection
  const buttons = [
    [createInlineButton('🏍️ Thi lý thuyết', 'exam_type:Lý thuyết')],
    [createInlineButton('🚗 Thi thực hành', 'exam_type:Thực hành')],
    [createInlineButton('📝 Thi sát hạch', 'exam_type:Sát hạch')],
    [createInlineButton('❌ Hủy', 'exam_cancel')]
  ];

  const message = `✅ Học viên: *${student.hoTen}* (${studentId})\n\n` +
    `📝 *Bước 2/5: Chọn loại thi*`;

  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Handle exam type callback
 */
function handleExamTypeCallback(chatId, userId, examType) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_loai_thi') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /dat\\_lich\\_thi', { parse_mode: 'Markdown' });
    return;
  }

  state.data.examType = examType;
  state.step = 'nhap_ngay_thi';
  setConversationState(userId, state);

  const message = `✅ Loại thi: *${examType}*\n\n` +
    `📅 *Bước 3/5: Nhập ngày thi*\n\n` +
    `Ví dụ: 25/12/2024, 25/12, hôm nay, mai`;

  sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Handle exam date input
 */
function handleExamDateInput(chatId, userId, text, state) {
  const date = parseDate(text);

  if (!date) {
    sendMessage(chatId, '❌ Ngày không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 25/12/2024, 25/12, hôm nay, mai');
    return;
  }

  state.data.examDate = date;
  state.step = 'nhap_gio_thi';
  setConversationState(userId, state);

  const buttons = [
    [createInlineButton('⏭️ Bỏ qua', 'exam_skip_time')]
  ];

  const message = `✅ Ngày thi: *${formatDate(date)}*\n\n` +
    `⏰ *Bước 4/5: Nhập giờ thi*\n\n` +
    `Ví dụ: 8h, 8h30, 14:00`;

  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Handle exam time input
 */
function handleExamTimeInput(chatId, userId, text, state) {
  const time = parseTime(text);

  if (!time) {
    sendMessage(chatId, '❌ Giờ không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 8h, 8h30, 14:00');
    return;
  }

  state.data.examTime = time;
  state.step = 'nhap_dia_diem';
  setConversationState(userId, state);

  const buttons = [
    [createInlineButton('⏭️ Bỏ qua', 'exam_skip_location')]
  ];

  const message = `✅ Giờ thi: *${time}*\n\n` +
    `📍 *Bước 5/5: Nhập địa điểm thi*\n\n` +
    `Ví dụ: Sân thi Quận 1, Trung tâm sát hạch`;

  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Handle exam location input
 */
function handleExamLocationInput(chatId, userId, text, state) {
  state.data.location = text.trim();

  // Create exam
  createExamFromState(chatId, userId, state);
}

/**
 * Handle skip time callback
 */
function handleExamSkipTimeCallback(chatId, userId) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'nhap_gio_thi') {
    sendMessage(chatId, '❌ Phiên đã hết hạn.');
    return;
  }

  state.data.examTime = '';
  state.step = 'nhap_dia_diem';
  setConversationState(userId, state);

  const buttons = [
    [createInlineButton('⏭️ Bỏ qua', 'exam_skip_location')]
  ];

  const message = `📍 *Bước 5/5: Nhập địa điểm thi*\n\n` +
    `Ví dụ: Sân thi Quận 1, Trung tâm sát hạch`;

  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Handle skip location callback
 */
function handleExamSkipLocationCallback(chatId, userId) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'nhap_dia_diem') {
    sendMessage(chatId, '❌ Phiên đã hết hạn.');
    return;
  }

  state.data.location = '';
  createExamFromState(chatId, userId, state);
}

/**
 * Create exam from conversation state
 */
function createExamFromState(chatId, userId, state) {
  try {
    const examId = createExam(state.data);

    clearConversationState(userId);

    let summary = `✅ *ĐÃ ĐẶT LỊCH THI THÀNH CÔNG*\n\n`;
    summary += `🎓 Mã thi: *${examId}*\n`;
    summary += `👤 Học viên: ${state.data.studentName} (${state.data.studentId})\n`;
    summary += `📝 Loại thi: ${state.data.examType}\n`;
    summary += `📅 Ngày thi: ${formatDate(state.data.examDate)}\n`;
    if (state.data.examTime) {
      summary += `⏰ Giờ thi: ${state.data.examTime}\n`;
    }
    if (state.data.location) {
      summary += `📍 Địa điểm: ${state.data.location}\n`;
    }
    summary += `⏳ Trạng thái: Chưa thi`;

    sendMessage(chatId, summary, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error creating exam: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi đặt lịch thi. Chi tiết: ' + error.message);
  }
}

/**
 * Handle exam cancel callback
 */
function handleExamCancelCallback(chatId, userId) {
  clearConversationState(userId);
  sendMessage(chatId, '❌ Đã hủy đặt lịch thi.');
}
