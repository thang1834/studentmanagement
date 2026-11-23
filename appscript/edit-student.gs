/**
 * EDIT STUDENT - Sửa thông tin học viên qua bot
 * Flow: nút ✏️ Sửa → chọn trường → nhập giá trị (hoặc chọn nút) → lưu → hiện lại chi tiết
 */

/**
 * Các trường cho phép sửa. Key = tên field trong getAllStudents / columnMap của updateStudent.
 * - validate(text): trả về giá trị đã chuẩn hóa, hoặc null nếu không hợp lệ
 * - choices: các hàng nút để chọn (giữ đồng bộ với DROPDOWNS trong create-sheets.gs)
 * - format: cách hiển thị giá trị hiện tại
 * Không cho sửa "Đã đóng": dùng /thu_tien để sheet THANH TOÁN khớp với công nợ.
 */
const EDIT_STUDENT_FIELDS = {
  hoTen: {
    label: 'Họ tên',
    prompt: 'Nhập họ tên mới:',
    validate: v => v.length >= 2 ? v : null
  },
  ngaySinh: {
    label: 'Ngày sinh',
    prompt: 'Nhập ngày sinh mới (VD: 01/05/2002 hoặc 01052002):',
    validate: v => parseDate(v),
    format: v => formatDate(v)
  },
  gioiTinh: {
    label: 'Giới tính',
    choices: [['Nam', 'Nữ', 'Khác']]
  },
  sdt: {
    label: 'SĐT',
    prompt: 'Nhập số điện thoại mới (10 số):',
    validate: v => validatePhone(v) ? v : null
  },
  cmnd: {
    label: 'CMND/CCCD',
    prompt: 'Nhập CMND/CCCD mới (9-12 số):',
    validate: v => validateIdCard(v) ? v : null
  },
  diaChiNha: {
    label: 'Địa chỉ nhà',
    prompt: 'Nhập địa chỉ nhà mới:',
    validate: v => v.length >= 5 ? v : null
  },
  diaChiLamViec: {
    label: 'Địa chỉ làm việc',
    prompt: 'Nhập địa chỉ làm việc mới (gõ - để xóa):',
    validate: v => v === '-' ? '' : v
  },
  ghiChuDiaChi: {
    label: 'Ghi chú địa chỉ',
    prompt: 'Nhập ghi chú địa chỉ mới (gõ - để xóa):',
    validate: v => v === '-' ? '' : v
  },
  ngayNopHoSo: {
    label: 'Ngày nộp HS',
    prompt: 'Nhập ngày nộp hồ sơ mới (VD: 11/11/2021):',
    validate: v => parseDate(v),
    format: v => formatDate(v)
  },
  loaiBang: {
    label: 'Loại bằng',
    choices: [['A1', 'A2', 'B1'], ['B2', 'C', 'D'], ['E']]
  },
  giaoVien: {
    label: 'Giáo viên',
    prompt: 'Nhập tên giáo viên mới:',
    validate: v => v.length >= 2 ? v : null
  },
  trangThai: {
    label: 'Trạng thái',
    choices: [['Chờ xử lý hồ sơ'], ['Đang học'], ['Chờ thi'], ['Đã tốt nghiệp'], ['Bỏ học']]
  },
  hocPhi: {
    label: 'Học phí',
    prompt: 'Nhập học phí mới (VD: 12tr, 19 triệu, 19000000):',
    validate: v => {
      const n = parseMoney(v);
      return n !== null && n >= 0 ? n : null;
    },
    format: v => formatMoney(v)
  },
  ghiChu: {
    label: 'Ghi chú',
    prompt: 'Nhập ghi chú mới (gõ - để xóa):',
    validate: v => v === '-' ? '' : v
  }
};

/**
 * Hiện bàn phím chọn trường cần sửa (từ nút ✏️ Sửa)
 */
function startEditStudent(chatId, studentId) {
  const student = getStudentById(studentId);

  if (!student) {
    sendMessage(chatId, `❌ Không tìm thấy học viên ${studentId}`);
    return;
  }

  const rows = [
    ['hoTen', 'ngaySinh', 'gioiTinh'],
    ['sdt', 'cmnd'],
    ['diaChiNha', 'diaChiLamViec', 'ghiChuDiaChi'],
    ['ngayNopHoSo', 'loaiBang', 'giaoVien'],
    ['trangThai', 'hocPhi', 'ghiChu']
  ];

  const buttons = rows.map(row =>
    row.map(field => createInlineButton(EDIT_STUDENT_FIELDS[field].label, `edit_field:${studentId}:${field}`))
  );
  buttons.push([createInlineButton('❌ Hủy', 'edit_cancel')]);

  const message = `✏️ *SỬA HỌC VIÊN ${studentId}*\n👤 ${student.hoTen}\n\nChọn thông tin cần sửa:`;
  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Đã chọn trường → hỏi giá trị mới (nhập text hoặc chọn nút)
 */
function handleEditFieldCallback(chatId, userId, studentId, field) {
  const def = EDIT_STUDENT_FIELDS[field];
  const student = getStudentById(studentId);

  if (!def || !student) {
    sendMessage(chatId, '❌ Không tìm thấy học viên hoặc trường cần sửa.');
    return;
  }

  const format = def.format || (v => v);
  const current = student[field] ? format(student[field]) : '(trống)';
  const header = `✏️ *Sửa ${def.label}* - ${student.hoTen} (${studentId})\n\nHiện tại: ${current}\n\n`;

  const state = {
    type: 'edit_student',
    step: def.choices ? 'chon_gia_tri' : 'nhap_gia_tri',
    data: { studentId: studentId, field: field },
    chatId: chatId
  };
  setConversationState(userId, state);

  if (def.choices) {
    const buttons = def.choices.map(row => row.map(c => createInlineButton(c, `edit_value:${c}`)));
    buttons.push([createInlineButton('❌ Hủy', 'edit_cancel')]);
    sendMessageWithKeyboard(chatId, header + 'Chọn giá trị mới:', buttons);
  } else {
    sendMessageWithKeyboard(chatId, header + def.prompt, [[createInlineButton('❌ Hủy', 'edit_cancel')]]);
  }
}

/**
 * Nhập giá trị bằng text (gọi từ handleConversationState)
 */
function handleEditStudentStep(chatId, userId, state, text) {
  if (state.step === 'chon_gia_tri') {
    sendMessage(chatId, 'Vui lòng chọn một trong các nút phía trên, hoặc bấm ❌ Hủy.');
    return;
  }

  const def = EDIT_STUDENT_FIELDS[state.data.field];
  const value = def ? def.validate(text.trim()) : null;

  if (value === null || value === undefined) {
    sendMessage(chatId, `❌ Giá trị không hợp lệ. ${def ? def.prompt : ''}`);
    return;
  }

  saveStudentEdit(chatId, userId, state, value);
}

/**
 * Chọn giá trị bằng nút (giới tính, loại bằng, trạng thái)
 */
function handleEditValueCallback(chatId, userId, value) {
  const state = getConversationState(userId);

  if (!state || state.type !== 'edit_student' || state.step !== 'chon_gia_tri') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bấm ✏️ Sửa lại.');
    return;
  }

  const def = EDIT_STUDENT_FIELDS[state.data.field];

  if (!def || !def.choices || !def.choices.flat().includes(value)) {
    sendMessage(chatId, '❌ Giá trị không hợp lệ.');
    return;
  }

  saveStudentEdit(chatId, userId, state, value);
}

/**
 * Ghi vào sheet và hiện lại chi tiết
 */
function saveStudentEdit(chatId, userId, state, value) {
  const { studentId, field } = state.data;
  const updates = {};
  updates[field] = value;

  const ok = updateStudent(studentId, updates);
  clearConversationState(userId);

  if (!ok) {
    sendMessage(chatId, `❌ Không tìm thấy học viên ${studentId}.`);
    return;
  }

  sendMessage(chatId, `✅ Đã cập nhật *${EDIT_STUDENT_FIELDS[field].label}* cho ${studentId}.`, { parse_mode: 'Markdown' });
  handleViewStudent(chatId, studentId);
}

/**
 * Hủy sửa
 */
function handleEditCancelCallback(chatId, userId) {
  const state = getConversationState(userId);

  if (state && state.type === 'edit_student') {
    clearConversationState(userId);
  }

  sendMessage(chatId, '❌ Đã hủy sửa học viên.');
}
