/**
 * PAYMENT CONVERSATION - Thu tiền học phí
 * Multi-step conversation flow for collecting payments
 */

/**
 * Start payment conversation
 */
function startPaymentConversation(chatId, userId) {
  // Get students with debt
  const students = getStudentsWithDebt();

  if (students.length === 0) {
    sendMessage(chatId, '✅ Tất cả học viên đã đóng đủ học phí!');
    return;
  }

  // Initialize conversation state
  const state = {
    type: 'add_payment',
    step: 'chon_hoc_vien',
    data: {}
  };

  setConversationState(userId, state);

  // Show student selection with debt info
  showDebtStudentSelection(chatId, userId, students);
}

/**
 * Show student selection with debt
 */
function showDebtStudentSelection(chatId, userId, students, page = 1) {
  const perPage = 5;
  const totalPages = Math.ceil(students.length / perPage);
  const startIdx = (page - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, students.length);
  const pageStudents = students.slice(startIdx, endIdx);

  let text = `💰 *THU TIỀN HỌC PHÍ*\n\n`;
  text += `Bước 1/3: Chọn học viên\n\n`;

  const buttons = [];

  pageStudents.forEach(student => {
    const debtStr = formatMoney(student.conNo);
    buttons.push([
      createInlineButton(
        `${student.id} - ${student.hoTen} (Nợ: ${debtStr})`,
        `payment_student:${student.id}`
      )
    ]);
  });

  // Pagination
  const navRow = [];
  if (page > 1) {
    navRow.push(createInlineButton('◀️ Trước', `payment_students_page:${page - 1}`));
  }
  if (page < totalPages) {
    navRow.push(createInlineButton('Sau ▶️', `payment_students_page:${page + 1}`));
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  buttons.push([createInlineButton('❌ Hủy', 'payment_cancel')]);

  sendMessageWithKeyboard(chatId, text, buttons);
}

/**
 * Handle student selection
 */
function handlePaymentStudentCallback(chatId, userId, studentId) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_hoc_vien') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /thu\\_tien', { parse_mode: 'Markdown' });
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
  state.data.conNo = student.conNo;
  state.step = 'nhap_so_tien';
  setConversationState(userId, state);

  const text = `✅ Đã chọn: *${student.hoTen}*\n\n` +
    `💰 Còn nợ: *${formatMoney(student.conNo)}*\n\n` +
    `💵 *Bước 2/3: Nhập số tiền thu*\n\n` +
    `Nhập số tiền (VNĐ):\n` +
    `Ví dụ: 5000000, 5tr, 5 triệu`;

  sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

/**
 * Handle payment conversation state
 */
function handlePaymentConversationState(chatId, userId, text) {
  const state = getConversationState(userId);

  if (!state) return false;

  switch (state.step) {
    case 'nhap_so_tien':
      return handlePaymentAmountInput(chatId, userId, text, state);

    case 'nhap_ghi_chu':
      return handlePaymentNoteInput(chatId, userId, text, state);
  }

  return false;
}

/**
 * Handle amount input
 */
function handlePaymentAmountInput(chatId, userId, text, state) {
  const amount = parseMoney(text);

  if (!amount || amount <= 0) {
    sendMessage(chatId, '❌ Số tiền không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 5000000, 5tr, 5 triệu');
    return true;
  }

  // Check if amount exceeds debt
  if (amount > state.data.conNo) {
    sendMessage(chatId, `⚠️ Số tiền thu (${formatMoney(amount)}) lớn hơn số nợ (${formatMoney(state.data.conNo)}).\n\nVui lòng nhập lại.`);
    return true;
  }

  state.data.soTien = amount;
  state.step = 'chon_hinh_thuc';
  setConversationState(userId, state);

  // Show payment method selection
  const buttons = [
    [createInlineButton('💵 Tiền mặt', 'payment_method:Tiền mặt')],
    [createInlineButton('🏦 Chuyển khoản', 'payment_method:Chuyển khoản')]
  ];

  const text2 = `✅ Số tiền: *${formatMoney(amount)}*\n\n` +
    `💳 *Bước 3/3: Chọn hình thức thanh toán*`;

  sendMessageWithKeyboard(chatId, text2, buttons);
  return true;
}

/**
 * Handle payment method selection
 */
function handlePaymentMethodCallback(chatId, userId, method) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_hinh_thuc') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /thu\\_tien', { parse_mode: 'Markdown' });
    return;
  }

  state.data.hinhThuc = method;
  state.step = 'nhap_ghi_chu';
  setConversationState(userId, state);

  const buttons = [[createInlineButton('⏭️ Bỏ qua', 'payment_skip_note')]];

  const text = `✅ Hình thức: *${method}*\n\n` +
    `📝 *Ghi chú (không bắt buộc)*\n\n` +
    `Nhập ghi chú hoặc bấm Bỏ qua:`;

  sendMessageWithKeyboard(chatId, text, buttons);
}

/**
 * Handle note input
 */
function handlePaymentNoteInput(chatId, userId, text, state) {
  state.data.ghiChu = text.trim();

  // Create payment
  try {
    const paymentId = createPayment(state.data);

    // Get updated student info
    const student = getStudentById(state.data.maHocVien);

    clearConversationState(userId);

    let summary = `✅ *ĐÃ THU TIỀN THÀNH CÔNG*\n\n`;
    summary += `🆔 Mã GD: *${paymentId}*\n`;
    summary += `👤 Học viên: ${state.data.hoTen}\n`;
    summary += `💵 Số tiền: *${formatMoney(state.data.soTien)}*\n`;
    summary += `💳 Hình thức: ${state.data.hinhThuc}\n`;
    if (state.data.ghiChu) {
      summary += `📝 Ghi chú: ${state.data.ghiChu}\n`;
    }
    summary += `\n`;
    summary += `💰 Còn nợ: *${formatMoney(student.conNo)}*`;

    sendMessage(chatId, summary, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error creating payment: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi ghi nhận thanh toán. Chi tiết: ' + error.message);
  }

  return true;
}

/**
 * Handle skip note
 */
function handlePaymentSkipNoteCallback(chatId, userId) {
  return handlePaymentNoteInput(chatId, userId, '', getConversationState(userId));
}

/**
 * Handle cancel
 */
function handlePaymentCancelCallback(chatId, userId) {
  clearConversationState(userId);
  sendMessage(chatId, '❌ Đã hủy thu tiền.');
}
