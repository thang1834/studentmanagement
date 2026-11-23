/**
 * CONVERSATION MANAGEMENT - FIXED VERSION
 * Xử lý conversation state cho multi-step flows
 */

const CONVERSATION_CACHE = CacheService.getUserCache();
const CONVERSATION_TTL = 1800; // 30 minutes

/**
 * Get conversation state
 */
function getConversationState(userId) {
  const key = `conv_${userId}`;
  const data = CONVERSATION_CACHE.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

/**
 * Set conversation state
 */
function setConversationState(userId, state) {
  const key = `conv_${userId}`;
  CONVERSATION_CACHE.put(key, JSON.stringify(state), CONVERSATION_TTL);
}

/**
 * Clear conversation state
 */
function clearConversationState(userId) {
  const key = `conv_${userId}`;
  CONVERSATION_CACHE.remove(key);
}

/**
 * Start add student conversation
 */
function startAddStudentConversation(chatId, userId) {
  const state = {
    type: 'add_student',
    step: 'ho_ten',
    data: {},
    chatId: chatId
  };

  setConversationState(userId, state);

  sendMessage(chatId, '👤 Nhập *họ tên* học viên:', { parse_mode: 'Markdown' });
}

/**
 * Handle conversation state
 */
function handleConversationState(chatId, userId, text) {
  const state = getConversationState(userId);

  if (!state) {
    return;
  }

  switch (state.type) {
    case 'add_student':
      handleAddStudentStep(chatId, userId, state, text);
      break;

    case 'add_schedule':
      handleScheduleConversationState(chatId, userId, text);
      break;

    case 'add_payment':
      handlePaymentConversationState(chatId, userId, text);
      break;

    case 'add_vehicle':
      handleAddVehicleStep(chatId, userId, state, text);
      break;

    case 'add_exam':
      handleAddExamStep(chatId, userId, state, text);
      break;

    case 'edit_student':
      handleEditStudentStep(chatId, userId, state, text);
      break;
  }
}

/**
 * Handle add student conversation steps
 */
function handleAddStudentStep(chatId, userId, state, text) {
  const { step, data } = state;

  switch (step) {
    case 'ho_ten':
      if (!text || text.trim().length < 2) {
        sendMessage(chatId, '❌ Họ tên không hợp lệ. Vui lòng nhập lại:');
        return;
      }
      data.hoTen = text.trim();
      state.step = 'sdt';
      setConversationState(userId, state);
      sendMessage(chatId, '📱 Nhập *số điện thoại* (10 số):', { parse_mode: 'Markdown' });
      break;

    case 'sdt':
      if (!/^0\d{9}$/.test(text.trim())) {
        sendMessage(chatId, '❌ Số điện thoại không hợp lệ. Vui lòng nhập 10 số:');
        return;
      }
      data.sdt = text.trim();
      state.step = 'cmnd';
      setConversationState(userId, state);
      sendMessage(chatId, '🆔 Nhập *CMND/CCCD* (9-12 số):', { parse_mode: 'Markdown' });
      break;

    case 'cmnd':
      if (!/^\d{9,12}$/.test(text.trim())) {
        sendMessage(chatId, '❌ CMND/CCCD không hợp lệ. Vui lòng nhập 9-12 số:');
        return;
      }
      data.cmnd = text.trim();
      state.step = 'ngay_sinh';
      setConversationState(userId, state);
      sendMessage(chatId, '🎂 Nhập *ngày sinh* (VD: 01/05/2002 hoặc 01052002):', { parse_mode: 'Markdown' });
      break;

    case 'ngay_sinh':
      // Flexible date parsing: 01052002, 01/05/2002, 01-05-2002
      const dateStr = text.trim().replace(/[-]/g, '/');
      let formattedDate = '';

      if (/^\d{8}$/.test(dateStr)) {
        // Format: 01052002 → 01/05/2002
        formattedDate = dateStr.substring(0, 2) + '/' + dateStr.substring(2, 4) + '/' + dateStr.substring(4, 8);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        // Already DD/MM/YYYY
        formattedDate = dateStr;
      } else {
        sendMessage(chatId, '❌ Ngày sinh không đúng. Nhập lại (VD: 01/05/2002 hoặc 01052002):');
        return;
      }

      data.ngaySinh = formattedDate;
      state.step = 'gioi_tinh';
      setConversationState(userId, state);

      const genderButtons = [
        [
          createInlineButton('👨 Nam', 'gender:Nam'),
          createInlineButton('👩 Nữ', 'gender:Nữ')
        ]
      ];
      sendMessageWithKeyboard(chatId, '👥 Chọn giới tính:', genderButtons);
      break;

    case 'dia_chi_nha':
      if (!text || text.trim().length < 5) {
        sendMessage(chatId, '❌ Địa chỉ quá ngắn. Vui lòng nhập lại:');
        return;
      }
      data.diaChiNha = text.trim();
      state.step = 'dia_chi_lam_viec';
      setConversationState(userId, state);

      const skipWorkButton = [[createInlineButton('⏭️ Bỏ qua', 'skip:dia_chi_lam_viec')]];
      sendMessageWithKeyboard(chatId, '💼 Nhập địa chỉ làm việc:', skipWorkButton);
      break;

    case 'dia_chi_lam_viec':
      data.diaChiLamViec = text.trim();
      state.step = 'ghi_chu_dia_chi';
      setConversationState(userId, state);

      const skipNoteButton = [[createInlineButton('⏭️ Bỏ qua', 'skip:ghi_chu_dia_chi')]];
      sendMessageWithKeyboard(chatId, '📝 Nhập ghi chú địa chỉ:', skipNoteButton);
      break;

    case 'ghi_chu_dia_chi':
      data.ghiChuDiaChi = text.trim();
      state.step = 'ngay_nop_ho_so';
      setConversationState(userId, state);
      sendMessage(chatId, '📅 Nhập *ngày nộp hồ sơ* (VD: 11/11/2021):', { parse_mode: 'Markdown' });
      break;

    case 'ngay_nop_ho_so':
      const dateStr2 = text.trim().replace(/[-]/g, '/');
      let formattedDate2 = '';

      if (/^\d{8}$/.test(dateStr2)) {
        formattedDate2 = dateStr2.substring(0, 2) + '/' + dateStr2.substring(2, 4) + '/' + dateStr2.substring(4, 8);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr2)) {
        formattedDate2 = dateStr2;
      } else {
        sendMessage(chatId, '❌ Ngày không đúng. Nhập lại (VD: 11/11/2021):');
        return;
      }

      data.ngayNopHoSo = formattedDate2;
      state.step = 'loai_bang';
      setConversationState(userId, state);

      const licenseButtons = [
        [
          createInlineButton('A1', 'license:A1'),
          createInlineButton('A2', 'license:A2'),
          createInlineButton('B1', 'license:B1')
        ],
        [
          createInlineButton('B2', 'license:B2'),
          createInlineButton('C', 'license:C'),
          createInlineButton('D', 'license:D')
        ]
      ];
      sendMessageWithKeyboard(chatId, '🎓 Chọn loại bằng:', licenseButtons);
      break;

    case 'giao_vien':
      if (!text || text.trim().length < 2) {
        sendMessage(chatId, '❌ Tên giáo viên không hợp lệ. Vui lòng nhập lại:');
        return;
      }
      data.giaoVien = text.trim();
      state.step = 'hoc_phi';
      setConversationState(userId, state);
      sendMessage(chatId, '💵 Nhập *học phí* (VD: 19 triệu, 12tr, 19000000):', { parse_mode: 'Markdown' });
      break;

    case 'hoc_phi':
      const hocPhi = parseMoney(text.trim());
      if (hocPhi === null || hocPhi < 0) {
        sendMessage(chatId, '❌ Học phí không hợp lệ. Vui lòng nhập đúng (VD: 12tr, 19 triệu):');
        return;
      }
      data.hocPhi = hocPhi;
      state.step = 'da_dong';
      setConversationState(userId, state);

      const skipPaymentButton = [[createInlineButton('⏭️ Chưa đóng (0đ)', 'skip:da_dong')]];
      sendMessageWithKeyboard(chatId, '✅ Nhập số tiền đã đóng (VD: 5 triệu):', skipPaymentButton);
      break;

    case 'da_dong':
      const daDong = parseMoney(text.trim());
      if (daDong === null || daDong < 0) {
        sendMessage(chatId, '❌ Số tiền không hợp lệ. Vui lòng nhập lại (VD: 5tr):');
        return;
      }
      data.daDong = daDong;

      // Show confirmation
      showAddStudentConfirmation(chatId, userId, data);
      break;
  }
}

/**
 * Show add student confirmation
 */
function showAddStudentConfirmation(chatId, userId, data) {
  const conNo = data.hocPhi - data.daDong;

  const message = `
📋 *XÁC NHẬN THÔNG TIN HỌC VIÊN*

👤 Họ tên: *${data.hoTen}*
📱 SĐT: ${data.sdt}
🆔 CMND: ${data.cmnd}
🎂 Ngày sinh: ${data.ngaySinh}
👥 Giới tính: ${data.gioiTinh}
🏠 Địa chỉ: ${data.diaChiNha}
${data.diaChiLamViec ? `💼 Nơi làm: ${data.diaChiLamViec}\n` : ''}${data.ghiChuDiaChi ? `📝 Ghi chú: ${data.ghiChuDiaChi}\n` : ''}
🎓 Loại bằng: *${data.loaiBang}*
👨‍🏫 Giáo viên: ${data.giaoVien}
📅 Ngày nộp HS: ${data.ngayNopHoSo}

💰 Học phí: ${formatMoney(data.hocPhi)}
✅ Đã đóng: ${formatMoney(data.daDong)}
${conNo > 0 ? `⚠️ Còn nợ: *${formatMoney(conNo)}*` : '✅ Đã thanh toán đủ'}

Xác nhận thêm học viên?
  `.trim();

  const buttons = [
    [
      createInlineButton('✅ Xác nhận', 'confirm_add_student'),
      createInlineButton('❌ Hủy', 'cancel_add_student')
    ]
  ];

  sendMessageWithKeyboard(chatId, message, buttons, 'Markdown');
}

/**
 * Confirm add student
 */
function confirmAddStudent(chatId, userId, messageId) {
  const state = getConversationState(userId);

  if (!state || state.type !== 'add_student') {
    sendMessage(chatId, '❌ Phiên làm việc đã hết hạn. Vui lòng thử lại.');
    return;
  }

  try {
    const studentId = createStudent(state.data);

    editMessage(chatId, messageId, '✅ Đã thêm học viên thành công!');

    clearConversationState(userId);

    // Show student detail (use Utilities.sleep instead of setTimeout)
    Utilities.sleep(1000);
    viewStudentDetail(chatId, studentId);

  } catch (error) {
    Logger.log('❌ ERROR creating student: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    editMessage(chatId, messageId, '❌ Có lỗi xảy ra. Vui lòng thử lại.\n\n' + error.message);
  }
}

/**
 * Cancel add student
 */
function cancelAddStudent(chatId, userId, messageId) {
  clearConversationState(userId);
  editMessage(chatId, messageId, '❌ Đã hủy thêm học viên.');
}

/**
 * Handle gender callback
 */
function handleGenderCallback(chatId, userId, gender) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'gioi_tinh') {
    return;
  }

  state.data.gioiTinh = gender;
  state.step = 'dia_chi_nha';
  setConversationState(userId, state);

  const skipAddressButton = [[createInlineButton('⏭️ Bỏ qua', 'skip:dia_chi_nha')]];
  sendMessageWithKeyboard(chatId, '🏠 Nhập địa chỉ nhà:', skipAddressButton);
}

/**
 * Handle license callback
 */
function handleLicenseCallback(chatId, userId, license) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'loai_bang') {
    return;
  }

  state.data.loaiBang = license;
  state.step = 'giao_vien';
  setConversationState(userId, state);

  const defaultTeacherButton = [[createInlineButton('👤 Tôi', 'default:teacher')]];
  sendMessageWithKeyboard(chatId, `👨‍🏫 Nhập tên giáo viên phụ trách:`, defaultTeacherButton);
}

/**
 * Handle skip callback
 */
function handleSkipCallback(chatId, userId, field) {
  const state = getConversationState(userId);

  if (!state) {
    return;
  }

  switch (field) {
    case 'dia_chi_nha':
      if (state.step !== 'dia_chi_nha') return;
      state.data.diaChiNha = 'Không cung cấp';
      state.step = 'dia_chi_lam_viec';
      setConversationState(userId, state);

      const skipWorkButton = [[createInlineButton('⏭️ Bỏ qua', 'skip:dia_chi_lam_viec')]];
      sendMessageWithKeyboard(chatId, '💼 Nhập địa chỉ làm việc:', skipWorkButton);
      break;

    case 'dia_chi_lam_viec':
      if (state.step !== 'dia_chi_lam_viec') return;
      state.data.diaChiLamViec = '';
      state.step = 'ghi_chu_dia_chi';
      setConversationState(userId, state);

      const skipNoteButton = [[createInlineButton('⏭️ Bỏ qua', 'skip:ghi_chu_dia_chi')]];
      sendMessageWithKeyboard(chatId, '📝 Nhập ghi chú địa chỉ:', skipNoteButton);
      break;

    case 'ghi_chu_dia_chi':
      if (state.step !== 'ghi_chu_dia_chi') return;
      state.data.ghiChuDiaChi = '';
      state.step = 'ngay_nop_ho_so';
      setConversationState(userId, state);
      sendMessage(chatId, '📅 Nhập *ngày nộp hồ sơ* (VD: 11/11/2021):', { parse_mode: 'Markdown' });
      break;

    case 'da_dong':
      if (state.step !== 'da_dong') return;
      state.data.daDong = 0;
      showAddStudentConfirmation(chatId, userId, state.data);
      break;
  }
}

/**
 * Handle default value callback
 */
function handleDefaultCallback(chatId, userId, field) {
  const state = getConversationState(userId);

  if (!state) {
    return;
  }

  if (field === 'teacher' && state.step === 'giao_vien') {
    const ctx = getCurrentContext();
    const adminName = (ctx && ctx.name) || PropertiesService.getScriptProperties().getProperty('ADMIN_NAME') || 'Tôi';

    state.data.giaoVien = adminName;
    state.step = 'hoc_phi';
    setConversationState(userId, state);

    sendMessage(chatId, `💵 Nhập *học phí* (VD: 19 triệu, 12tr, 19000000):`, { parse_mode: 'Markdown' });
  }
}

/**
 * Parse money from text - IMPROVED
 * Supports: "19 triệu", "12tr", "19000000", "19.000.000"
 */
function parseMoney(text) {
  if (!text) return null;

  // Remove spaces
  text = text.toLowerCase().replace(/\s+/g, '');

  // Fix common typos: "12t" should be rejected, only "12tr" or "12 triệu"
  if (text.match(/^\d+t$/)) {
    // Just "12t" without "r" - invalid
    return null;
  }

  // Handle "triệu" or "tr"
  if (text.includes('triệu') || text.includes('tr')) {
    const num = parseFloat(text.replace(/[^\d.]/g, ''));
    if (isNaN(num)) return null;
    return num * 1000000;
  }

  // Handle "nghìn" or "k"
  if (text.includes('nghìn') || text.includes('k')) {
    const num = parseFloat(text.replace(/[^\d.]/g, ''));
    if (isNaN(num)) return null;
    return num * 1000;
  }

  // Handle plain number with dots/commas (must be at least 4 digits for safety)
  const cleaned = text.replace(/[,\.]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) return null;

  // Require at least 4 digits to avoid ambiguity
  if (cleaned.length < 4) return null;

  return num;
}
