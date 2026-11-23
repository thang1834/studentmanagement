/**
 * ADD VEHICLE CONVERSATION - Thêm xe mới
 * Simple flow for adding vehicles
 */

/**
 * Start add vehicle conversation
 */
function startAddVehicleConversation(chatId, userId) {
  const state = {
    type: 'add_vehicle',
    step: 'nhap_bien_so',
    data: {},
    chatId: chatId
  };

  setConversationState(userId, state);

  const text = `🚗 *THÊM XE MỚI*\n\n` +
    `Bước 1/3: Nhập biển số xe\n\n` +
    `Ví dụ: 30A-12345, 29B-99999`;

  sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

/**
 * Handle add vehicle conversation step
 */
function handleAddVehicleStep(chatId, userId, state, text) {
  switch (state.step) {
    case 'nhap_bien_so':
      handleVehiclePlateInput(chatId, userId, text, state);
      break;
  }
}

/**
 * Handle vehicle type callback (from button)
 */
function handleVehicleTypeCallback(chatId, userId, vehicleType) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_loai_xe') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /them\\_xe', { parse_mode: 'Markdown' });
    return;
  }

  state.data.loaiXe = vehicleType;

  // Create vehicle
  try {
    const bienSo = createVehicle(state.data);

    clearConversationState(userId);

    let summary = `✅ *ĐÃ THÊM XE THÀNH CÔNG*\n\n`;
    summary += `🚗 Biển số: *${bienSo}*\n`;
    summary += `🎓 Loại bằng: ${state.data.loaiBang}\n`;
    summary += `🚙 Loại xe: ${state.data.loaiXe}\n`;
    summary += `✅ Trạng thái: Đang dùng`;

    sendMessage(chatId, summary, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error creating vehicle: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi thêm xe. Chi tiết: ' + error.message);
  }
}

/**
 * Handle plate number input
 */
function handleVehiclePlateInput(chatId, userId, text, state) {
  const plate = text.trim().toUpperCase();

  if (plate.length < 5) {
    sendMessage(chatId, '❌ Biển số không hợp lệ. Vui lòng nhập lại:\n\nVí dụ: 30A-12345');
    return;
  }

  if (getAllVehicles().some(v => String(v.bienSo).trim().toUpperCase() === plate)) {
    sendMessage(chatId, `❌ Biển số *${plate}* đã có trong danh sách xe. Vui lòng nhập biển số khác:`, { parse_mode: 'Markdown' });
    return;
  }

  state.data.bienSo = plate;
  state.step = 'chon_loai_bang';
  setConversationState(userId, state);

  // Show license type selection
  const buttons = [
    [createInlineButton('🏍️ A1', 'vehicle_license:A1'), createInlineButton('🏍️ A2', 'vehicle_license:A2')],
    [createInlineButton('🚗 B1', 'vehicle_license:B1'), createInlineButton('🚗 B2', 'vehicle_license:B2')],
    [createInlineButton('🚚 C', 'vehicle_license:C')]
  ];

  const text2 = `✅ Biển số: *${plate}*\n\n` +
    `🎓 *Bước 2/3: Chọn loại bằng phù hợp*`;

  sendMessageWithKeyboard(chatId, text2, buttons);
}

/**
 * Handle license type selection
 */
function handleVehicleLicenseCallback(chatId, userId, licenseType) {
  const state = getConversationState(userId);

  if (!state || state.step !== 'chon_loai_bang') {
    sendMessage(chatId, '❌ Phiên đã hết hạn. Vui lòng bắt đầu lại: /them\\_xe', { parse_mode: 'Markdown' });
    return;
  }

  state.data.loaiBang = licenseType;
  state.step = 'chon_loai_xe';
  setConversationState(userId, state);

  // Show vehicle type options based on license type
  let buttons = [];
  let text = `✅ Loại bằng: *${licenseType}*\n\n` +
    `🚗 *Bước 3/3: Chọn loại xe*`;

  switch (licenseType) {
    case 'A1':
      buttons = [
        [createInlineButton('🛵 Xe số', 'vehicle_type:Xe số')],
        [createInlineButton('🛵 Xe ga', 'vehicle_type:Xe ga')]
      ];
      break;

    case 'A2':
      buttons = [
        [createInlineButton('🏍️ Xe côn', 'vehicle_type:Xe côn')],
        [createInlineButton('🏍️ Xe số', 'vehicle_type:Xe số')]
      ];
      break;

    case 'B1':
      buttons = [
        [createInlineButton('🚗 Xe số sàn', 'vehicle_type:Xe số sàn')]
      ];
      break;

    case 'B2':
      buttons = [
        [createInlineButton('🚙 Xe tự động', 'vehicle_type:Xe tự động')]
      ];
      break;

    case 'C':
      buttons = [
        [createInlineButton('🚚 Xe tải', 'vehicle_type:Xe tải')],
        [createInlineButton('🚌 Xe khách', 'vehicle_type:Xe khách')]
      ];
      break;
  }

  sendMessageWithKeyboard(chatId, text, buttons);
}
