/**
 * CALLBACK HANDLERS
 * Xử lý các callbacks từ inline buttons
 */

/**
 * Handle callback query routing
 */
function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  Logger.log('=== HANDLE CALLBACK ===');
  Logger.log('Callback data: ' + data);
  Logger.log('User ID: ' + userId);

  // Parse callback data
  const [action, ...params] = data.split(':');

  Logger.log('Action: ' + action);
  Logger.log('Params: ' + JSON.stringify(params));

  try {
    switch (action) {
      // Student actions
      case 'confirm_add_student':
        answerCallbackQuery(callbackQuery.id, 'Đang xử lý...');
        confirmAddStudent(chatId, userId, messageId);
        break;

      case 'cancel_add_student':
        answerCallbackQuery(callbackQuery.id, 'Đã hủy');
        cancelAddStudent(chatId, userId, messageId);
        break;

      case 'view_student':
        answerCallbackQuery(callbackQuery.id);
        viewStudentDetail(chatId, params[0]);
        break;

      case 'delete_student':
        answerCallbackQuery(callbackQuery.id);
        confirmDeleteStudent(chatId, params[0], messageId);
        break;

      case 'confirm_delete':
        answerCallbackQuery(callbackQuery.id, 'Đang xóa...');
        executeDeleteStudent(chatId, params[0], messageId);
        break;

      case 'cancel_delete':
        answerCallbackQuery(callbackQuery.id, 'Đã hủy');
        editMessage(chatId, messageId, '❌ Đã hủy xóa học viên.');
        break;

      case 'student_schedule':
        answerCallbackQuery(callbackQuery.id);
        viewStudentSchedule(chatId, params[0]);
        break;

      case 'student_payment':
        answerCallbackQuery(callbackQuery.id);
        viewStudentPayment(chatId, params[0]);
        break;

      case 'student_progress':
        answerCallbackQuery(callbackQuery.id);
        viewStudentProgress(chatId, params[0]);
        break;

      case 'edit_student':
        answerCallbackQuery(callbackQuery.id);
        startEditStudent(chatId, params[0]);
        break;

      case 'edit_field':
        answerCallbackQuery(callbackQuery.id);
        handleEditFieldCallback(chatId, userId, params[0], params[1]);
        break;

      case 'edit_value':
        answerCallbackQuery(callbackQuery.id, '✅ Đã chọn');
        handleEditValueCallback(chatId, userId, params.join(':'));
        break;

      case 'edit_cancel':
        answerCallbackQuery(callbackQuery.id, 'Đã hủy');
        handleEditCancelCallback(chatId, userId);
        break;

      // Conversation callbacks
      case 'gender':
        answerCallbackQuery(callbackQuery.id);
        handleGenderCallback(chatId, userId, params[0]);
        break;

      case 'license':
        answerCallbackQuery(callbackQuery.id);
        handleLicenseCallback(chatId, userId, params[0]);
        break;

      case 'skip':
        answerCallbackQuery(callbackQuery.id);
        handleSkipCallback(chatId, userId, params[0]);
        break;

      case 'default':
        answerCallbackQuery(callbackQuery.id);
        handleDefaultCallback(chatId, userId, params[0]);
        break;

      case 'payment_method':
        answerCallbackQuery(callbackQuery.id, '✅ Đã chọn');
        handlePaymentMethodCallback(chatId, userId, params[0]);
        break;

      case 'vehicle_license':
        answerCallbackQuery(callbackQuery.id);
        handleVehicleLicenseCallback(chatId, userId, params[0]);
        break;

      case 'vehicle_type':
        answerCallbackQuery(callbackQuery.id);
        handleVehicleTypeCallback(chatId, userId, params[0]);
        break;

      case 'exam_type':
        answerCallbackQuery(callbackQuery.id, '✅ Đã chọn');
        handleExamTypeCallback(chatId, userId, params[0]);
        break;

      // List students pagination
      case 'list_students':
        answerCallbackQuery(callbackQuery.id);
        handleListStudentsCallback(chatId, messageId, params[0]);
        break;

      // Schedule callbacks
      case 'schedule_student':
        answerCallbackQuery(callbackQuery.id);
        handleScheduleStudentCallback(chatId, userId, params[0]);
        break;

      case 'schedule_students_page':
        answerCallbackQuery(callbackQuery.id);
        const students = getAllStudents();
        showStudentSelection(chatId, userId, students, parseInt(params[0]));
        break;

      case 'schedule_type':
        answerCallbackQuery(callbackQuery.id);
        handleScheduleTypeCallback(chatId, userId, params[0]);
        break;

      case 'schedule_skip_note':
        answerCallbackQuery(callbackQuery.id);
        handleScheduleSkipNoteCallback(chatId, userId);
        break;

      case 'schedule_cancel':
        answerCallbackQuery(callbackQuery.id);
        handleScheduleCancelCallback(chatId, userId);
        break;

      // Payment callbacks
      case 'payment_student':
        answerCallbackQuery(callbackQuery.id);
        handlePaymentStudentCallback(chatId, userId, params[0]);
        break;

      case 'payment_students_page':
        answerCallbackQuery(callbackQuery.id);
        const debtStudents = getStudentsWithDebt();
        showDebtStudentSelection(chatId, userId, debtStudents, parseInt(params[0]));
        break;

      case 'payment_skip_note':
        answerCallbackQuery(callbackQuery.id);
        handlePaymentSkipNoteCallback(chatId, userId);
        break;

      case 'payment_cancel':
        answerCallbackQuery(callbackQuery.id);
        handlePaymentCancelCallback(chatId, userId);
        break;

      // Exam callbacks
      case 'exam_student':
        answerCallbackQuery(callbackQuery.id);
        handleExamStudentCallback(chatId, userId, params[0]);
        break;

      case 'exam_students_page':
        answerCallbackQuery(callbackQuery.id);
        const allStudents = getAllStudents();
        showExamStudentSelection(chatId, userId, allStudents, parseInt(params[0]));
        break;

      case 'exam_skip_time':
        answerCallbackQuery(callbackQuery.id);
        handleExamSkipTimeCallback(chatId, userId);
        break;

      case 'exam_skip_location':
        answerCallbackQuery(callbackQuery.id);
        handleExamSkipLocationCallback(chatId, userId);
        break;

      case 'exam_cancel':
        answerCallbackQuery(callbackQuery.id);
        handleExamCancelCallback(chatId, userId);
        break;

      // Report callbacks
      case 'report':
        answerCallbackQuery(callbackQuery.id);
        handleReportCallback(chatId, params[0]);
        break;

      // Pagination
      case 'page':
        answerCallbackQuery(callbackQuery.id);
        handlePagination(chatId, messageId, params[0], parseInt(params[1]));
        break;

      case 'noop':
        answerCallbackQuery(callbackQuery.id);
        // Do nothing - just for display
        break;

      default:
        answerCallbackQuery(callbackQuery.id, '❌ Hành động không hợp lệ');
        Logger.log('Unknown callback action: ' + action);
    }
  } catch (error) {
    Logger.log('ERROR in handleCallbackQuery: ' + error.toString());
    answerCallbackQuery(callbackQuery.id, '❌ Có lỗi xảy ra');
  }
}

/**
 * Handle pagination
 */
function handlePagination(chatId, messageId, type, page) {
  switch (type) {
    case 'student':
      const students = getAllStudents();
      const message = formatStudentList(students, page, 5);
      const totalPages = Math.ceil(students.length / 5);

      const buttons = [];
      const navButtons = [];

      if (page > 1) {
        navButtons.push(createInlineButton('⬅️ Trước', `page:student:${page - 1}`));
      }

      navButtons.push(createInlineButton(`${page}/${totalPages}`, 'noop'));

      if (page < totalPages) {
        navButtons.push(createInlineButton('Sau ➡️', `page:student:${page + 1}`));
      }

      if (navButtons.length > 0) {
        buttons.push(navButtons);
      }

      editMessageWithKeyboard(chatId, messageId, message, buttons);
      break;
  }
}

/**
 * Confirm delete student
 */
function confirmDeleteStudent(chatId, studentId, messageId) {
  const student = getStudentById(studentId);

  if (!student) {
    editMessage(chatId, messageId, '❌ Không tìm thấy học viên.');
    return;
  }

  const message = `⚠️ *XÁC NHẬN XÓA HỌC VIÊN*\n\n👤 ${student.hoTen}\n🆔 ${studentId}\n\n_Thao tác này không thể hoàn tác!_`;

  const buttons = [
    [
      createInlineButton('✅ Xác nhận xóa', `confirm_delete:${studentId}`),
      createInlineButton('❌ Hủy', 'cancel_delete')
    ]
  ];

  editMessageWithKeyboard(chatId, messageId, message, buttons);
}

/**
 * Execute delete student
 */
function executeDeleteStudent(chatId, studentId, messageId) {
  const success = deleteStudent(studentId);

  if (success) {
    editMessage(chatId, messageId, `✅ Đã xóa học viên ${studentId} thành công.`);
  } else {
    editMessage(chatId, messageId, `❌ Không thể xóa học viên ${studentId}.`);
  }
}

/**
 * View student progress
 */
function viewStudentProgress(chatId, studentId) {
  const student = getStudentById(studentId);

  if (!student) {
    sendMessage(chatId, `❌ Không tìm thấy học viên ${studentId}`);
    return;
  }

  // Get schedules count
  const schedules = getScheduleByStudent(studentId);
  const completedSchedules = schedules.filter(s => s.trangThai === 'Đã học').length;

  const message = `
📊 *TIẾN ĐỘ HỌC TẬP - ${student.hoTen}*

🎓 Loại bằng: ${student.loaiBang}
📊 Trạng thái: ${getStatusEmoji(student.trangThai)} ${student.trangThai}

📅 Tổng buổi học: ${schedules.length}
✅ Đã hoàn thành: ${completedSchedules}

_Chức năng chi tiết đang phát triển..._
  `.trim();

  sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * View student schedule
 */
function viewStudentSchedule(chatId, studentId) {
  const student = getStudentById(studentId);

  if (!student) {
    sendMessage(chatId, `❌ Không tìm thấy học viên ${studentId}`);
    return;
  }

  const schedules = getScheduleByStudent(studentId);

  let message = `📅 *LỊCH HỌC - ${student.hoTen}*\n\n`;

  if (schedules.length === 0) {
    message += '_Chưa có buổi học nào._';
  } else {
    message += `Tổng: ${schedules.length} buổi\n\n`;
    schedules.forEach((s, idx) => {
      message += `${idx + 1}. 📆 ${formatDateOnly(s.ngayHoc)} ⏰ ${s.gioBatDau} - ${s.gioKetThuc}\n`;
      message += `   📚 ${s.loaiBuoiHoc} | ${getScheduleStatusIcon(s.trangThai)} ${s.trangThai}\n`;
      if (s.ghiChu) {
        message += `   📝 ${s.ghiChu}\n`;
      }
    });
  }

  sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * View student payment history
 */
function viewStudentPayment(chatId, studentId) {
  const student = getStudentById(studentId);

  if (!student) {
    sendMessage(chatId, `❌ Không tìm thấy học viên ${studentId}`);
    return;
  }

  const payments = getAllPayments().filter(p => p.maHocVien === studentId);

  let message = `💰 *THANH TOÁN - ${student.hoTen}*\n\n`;
  message += `💵 Học phí: ${formatMoney(student.hocPhi)}\n`;
  message += `✅ Đã đóng: ${formatMoney(student.daDong)}\n`;
  message += `${student.conNo > 0 ? '⚠️' : '✅'} Còn nợ: *${formatMoney(student.conNo)}*\n\n`;

  if (payments.length === 0) {
    message += '_Chưa có giao dịch nào._';
  } else {
    message += `*LỊCH SỬ GIAO DỊCH (${payments.length})*\n`;
    payments.forEach((p, idx) => {
      message += `${idx + 1}. ${formatDateOnly(p.ngayGio)} - *${formatMoney(p.soTien)}* (${p.hinhThuc})\n`;
      if (p.ghiChu) {
        message += `   📝 ${p.ghiChu}\n`;
      }
    });
  }

  sendMessage(chatId, message, { parse_mode: 'Markdown' });
}
