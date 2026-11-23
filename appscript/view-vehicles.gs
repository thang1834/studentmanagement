/**
 * VIEW VEHICLES - Xem danh sách xe
 */

/**
 * Handle /ds_xe command
 */
function handleListVehicles(chatId) {
  try {
    const vehicles = getAllVehicles();

    if (vehicles.length === 0) {
      sendMessage(chatId, '🚗 *DANH SÁCH XE*\n\nChưa có xe nào trong hệ thống.', { parse_mode: 'Markdown' });
      return;
    }

    let text = `🚗 *DANH SÁCH XE*\n\n`;
    text += `Tổng: ${vehicles.length} xe\n\n`;

    vehicles.forEach((vehicle, idx) => {
      const statusIcon = vehicle.trangThai === 'Đang dùng' ? '✅' :
                        vehicle.trangThai === 'Bảo trì' ? '🔧' : '🚫';

      text += `${idx + 1}. *${vehicle.bienSo}* - ${vehicle.loaiXe}\n`;
      text += `   🎓 Bằng: ${vehicle.loaiBang}\n`;
      text += `   ${statusIcon} ${vehicle.trangThai}\n`;
      if (vehicle.hang) {
        text += `   🏭 ${vehicle.hang} ${vehicle.dongXe || ''}\n`;
      }
      if (vehicle.kmHienTai) {
        text += `   📏 Km: ${vehicle.kmHienTai.toLocaleString()}\n`;
      }
      text += `\n`;
    });

    sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in handleListVehicles: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi xem danh sách xe. Chi tiết: ' + error.message);
  }
}
