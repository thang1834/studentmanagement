/**
 * DRY-RUN WEBHOOK TEST - Chạy khô toàn bộ luồng bot trong trình soạn
 *
 * Giả lập các update Telegram đi qua handleMessage / handleCallbackQuery với dữ liệu THẬT
 * trong sheet, nhưng chặn mọi lệnh gọi Telegram API: nội dung bot định gửi được in ra
 * Execution log thay vì gửi đi. Không gửi tin, không ghi sheet (chỉ dùng lệnh đọc và
 * các callback mở menu / hủy). Chạy hàm dryRunWebhook() rồi xem log.
 */
function dryRunWebhook() {
  const chatId = Number(PropertiesService.getScriptProperties().getProperty('TEST_CHAT_ID'));

  if (!chatId) {
    Logger.log('❌ Chưa set TEST_CHAT_ID trong Script Properties');
    return;
  }

  setCurrentUser(chatId); // admin → file gốc, hoặc thầy đang chọn bằng /chon_gv
  Logger.log('Ngữ cảnh: ' + getContextLine());

  const firstStudent = getAllStudents()[0];
  const sid = firstStudent ? firstStudent.id : 'HV001';
  const firstVehicle = getAllVehicles()[0];
  const plate = firstVehicle ? String(firstVehicle.bienSo) : '30A-12345';
  Logger.log(`Chat ID: ${chatId} | Học viên dùng để test: ${sid} | Biển số có sẵn: ${plate}`);

  const steps = [
    { text: '/start' },
    { text: '/ds_hv' },
    { text: '/thong_ke' },
    { text: '/ds_gv' },
    { text: '/xem_no' },
    { text: '/lich_hom_nay' },
    { text: '/lich_tuan' },
    { text: '/ds_thi' },
    { text: '/ds_xe' },
    { text: '/bao_cao' },
    { data: 'report:finance' },
    { data: 'report:students' },
    { text: `/xem_${sid}` },
    { data: `student_schedule:${sid}` },
    { data: `student_payment:${sid}` },
    { data: `edit_student:${sid}` },
    { data: `edit_field:${sid}:sdt` },
    { text: 'abc' },                 // giá trị sai → phải bị từ chối, không ghi
    { data: 'edit_cancel' },
    { text: '/dat_lich' },
    { data: `schedule_student:${sid}` },
    { text: '25/12/2026' },          // điểm từng crash
    { data: 'schedule_cancel' },
    { text: '/thu_tien' },
    { data: 'payment_cancel' },
    { text: '/them_xe' },
    { text: plate },                 // biển số trùng → phải bị từ chối, không ghi
    { text: '/huy' },                // đang ở luồng thêm xe → "Đã hủy"
    { text: '/huy' }                 // không còn luồng nào → "Không có thao tác"
  ];

  // Chặn Telegram API: ghi lại thay vì gửi
  const sent = [];
  const original = {
    sendMessage: sendMessage,
    editMessage: editMessage,
    answerCallbackQuery: answerCallbackQuery
  };

  const buttonLabels = options => {
    const kb = options && options.reply_markup && options.reply_markup.inline_keyboard;
    return kb ? kb.flat().map(b => b.text).join(' | ') : '';
  };

  sendMessage = (c, text, options) => {
    sent.push({ kind: 'send', text: text, buttons: buttonLabels(options) });
    return { ok: true, result: { message_id: sent.length } };
  };
  editMessage = (c, messageId, text, options) => {
    sent.push({ kind: 'edit', text: text, buttons: buttonLabels(options) });
    return { ok: true };
  };
  answerCallbackQuery = () => ({ ok: true });

  let errors = 0;

  try {
    steps.forEach((step, i) => {
      sent.length = 0;
      const label = step.text || `[nút] ${step.data}`;

      try {
        if (step.text) {
          handleMessage({
            message_id: 1000 + i,
            from: { id: chatId, first_name: 'DryRun' },
            chat: { id: chatId, type: 'private' },
            text: step.text
          });
        } else {
          handleCallbackQuery({
            id: 'dry' + i,
            from: { id: chatId, first_name: 'DryRun' },
            message: { message_id: 1000 + i, chat: { id: chatId, type: 'private' } },
            data: step.data
          });
        }

        Logger.log(`\n===== ${i + 1}. ${label} → ${sent.length} tin =====`);
        sent.forEach(m => {
          const head = m.buttons ? `[${m.kind}, nút: ${m.buttons}]` : `[${m.kind}]`;
          Logger.log(`${head}\n${m.text}`);
        });
        if (sent.length === 0) {
          Logger.log('⚠️ Không có tin nào được gửi');
        }
      } catch (e) {
        errors++;
        Logger.log(`\n===== ${i + 1}. ${label} → ❌ LỖI: ${e} =====\n${e.stack}`);
      }
    });
  } finally {
    sendMessage = original.sendMessage;
    editMessage = original.editMessage;
    answerCallbackQuery = original.answerCallbackQuery;
    clearConversationState(chatId);
  }

  Logger.log(`\n===== KẾT THÚC: ${steps.length} bước, ${errors} lỗi =====`);
}
