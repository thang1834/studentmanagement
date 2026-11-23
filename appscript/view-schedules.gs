/**
 * VIEW SCHEDULES - Xem lịch học
 */

/**
 * Handle /lich_hom_nay command
 */
function handleTodaySchedule(chatId) {
  try {
    const schedules = getTodaySchedules();

    if (schedules.length === 0) {
      sendMessage(chatId, '📅 *LỊCH HỌC HÔM NAY*\n\nChưa có lịch học nào.', { parse_mode: 'Markdown' });
      return;
    }

    const today = new Date();
    const dateStr = Utilities.formatDate(today, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy (EEEE)');

    let text = `📅 *LỊCH HỌC HÔM NAY*\n${dateStr}\n\n`;
    text += `Tổng: ${schedules.length} buổi học\n\n`;

    schedules.forEach((schedule, idx) => {
      const statusIcon = getScheduleStatusIcon(schedule.trangThai);

      text += `${idx + 1}. ⏰ ${schedule.gioBatDau} - ${schedule.gioKetThuc}\n`;
      text += `   👤 ${schedule.hoTen} (${schedule.maHocVien})\n`;
      text += `   📚 ${schedule.loaiBuoiHoc}\n`;
      text += `   ${statusIcon} ${schedule.trangThai}\n`;
      if (schedule.giaoVien) {
        text += `   👨‍🏫 GV: ${schedule.giaoVien}\n`;
      }
      if (schedule.ghiChu) {
        text += `   📝 ${schedule.ghiChu}\n`;
      }
      text += `\n`;
    });

    sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in handleTodaySchedule: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi xem lịch học. Chi tiết: ' + error.message);
  }
}

/**
 * Handle /lich_tuan command
 */
function handleWeekSchedule(chatId) {
  try {
    const schedules = getWeekSchedules();

    if (schedules.length === 0) {
      sendMessage(chatId, '📅 *LỊCH HỌC TUẦN NÀY*\n\nChưa có lịch học nào.', { parse_mode: 'Markdown' });
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);

    const startStr = Utilities.formatDate(today, 'Asia/Ho_Chi_Minh', 'dd/MM');
    const endStr = Utilities.formatDate(endDate, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');

    let text = `📅 *LỊCH HỌC 7 NGÀY TỚI*\n${startStr} - ${endStr}\n\n`;
    text += `Tổng: ${schedules.length} buổi học\n\n`;

    // Group by date
    let currentDate = null;

    schedules.forEach((schedule, idx) => {
      const scheduleDate = new Date(schedule.ngay);
      const dateStr = Utilities.formatDate(scheduleDate, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy (EEEE)');

      if (currentDate !== dateStr) {
        if (currentDate !== null) text += `\n`;
        text += `📆 *${dateStr}*\n\n`;
        currentDate = dateStr;
      }

      const statusIcon = getScheduleStatusIcon(schedule.trangThai);

      text += `⏰ ${schedule.gioBatDau} - ${schedule.gioKetThuc}\n`;
      text += `   👤 ${schedule.hoTen} - ${schedule.loaiBuoiHoc}\n`;
      text += `   ${statusIcon} ${schedule.trangThai}\n`;
      if (schedule.giaoVien) {
        text += `   👨‍🏫 ${schedule.giaoVien}\n`;
      }
      text += `\n`;
    });

    sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in handleWeekSchedule: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi xem lịch học. Chi tiết: ' + error.message);
  }
}

/**
 * Get schedule status icon
 */
function getScheduleStatusIcon(status) {
  switch (status) {
    case 'Đã học':
      return '✅';
    case 'Chưa học':
      return '⏳';
    case 'Hủy':
      return '❌';
    case 'Nghỉ có phép':
      return '🏥';
    default:
      return '📋';
  }
}
