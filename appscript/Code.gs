/**
 * TELEGRAM BOT - QUẢN LÝ HỌC VIÊN
 * Main entry point - xử lý webhook từ Telegram
 */

// Configuration getter (avoid global const conflict)
function getConfig() {
  return {
    TELEGRAM_BOT_TOKEN: PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN'),
    TELEGRAM_API_URL: 'https://api.telegram.org/bot',
    SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId()
  };
}

// Phân quyền (admin / giáo viên) và ngữ cảnh dữ liệu: xem teachers.gs (isAuthorized, setCurrentUser, getDb)

/**
 * Setup webhook cho Telegram bot
 * Chạy 1 lần sau khi deploy web app
 */
function setWebhook() {
  const CONFIG = getConfig();
  const webAppUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');

  if (!webAppUrl) {
    throw new Error('Chưa set WEB_APP_URL. Vui lòng deploy web app trước.');
  }

  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/setWebhook?url=${webAppUrl}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());

  Logger.log('Webhook setup result: ' + JSON.stringify(result));
  return result;
}

/**
 * Remove webhook (để test)
 */
function removeWebhook() {
  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/deleteWebhook`;
  const response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}

/**
 * Xóa tất cả updates cũ và reset webhook
 * Chạy hàm này nếu bot gửi duplicate messages
 */
function clearUpdatesAndResetWebhook() {
  const CONFIG = getConfig();
  const token = CONFIG.TELEGRAM_BOT_TOKEN;

  if (!token) {
    SpreadsheetApp.getUi().alert('❌ Chưa set TELEGRAM_BOT_TOKEN trong Script Properties');
    return;
  }

  // 1. Xóa webhook hiện tại và drop pending updates
  const deleteUrl = `${CONFIG.TELEGRAM_API_URL}${token}/deleteWebhook?drop_pending_updates=true`;
  UrlFetchApp.fetch(deleteUrl);
  Logger.log('✅ Đã xóa webhook và pending updates');

  Utilities.sleep(1000); // Đợi 1 giây

  // 2. Set lại webhook
  const webAppUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');

  if (!webAppUrl) {
    SpreadsheetApp.getUi().alert('❌ Chưa set WEB_APP_URL trong Script Properties');
    return;
  }

  const setUrl = `${CONFIG.TELEGRAM_API_URL}${token}/setWebhook?url=${webAppUrl}&drop_pending_updates=true`;
  const response = UrlFetchApp.fetch(setUrl);
  const result = JSON.parse(response.getContentText());

  Logger.log('Kết quả: ' + JSON.stringify(result));

  if (result.ok) {
    SpreadsheetApp.getUi().alert('✅ Đã reset webhook thành công!\n\nThử gửi /start lại trong Telegram.');
  } else {
    SpreadsheetApp.getUi().alert('❌ Lỗi: ' + result.description);
  }

  return result;
}

/**
 * doPost - Telegram webhook handler
 * Được gọi mỗi khi có message/callback từ user
 */
function doPost(e) {
  try {
    Logger.log('=== WEBHOOK RECEIVED ===');
    Logger.log('Raw data: ' + e.postData.contents);

    const update = JSON.parse(e.postData.contents);
    const updateId = update.update_id;

    Logger.log('Update ID: ' + updateId);

    // Check duplicate using cache (prevents processing same update twice)
    const cache = CacheService.getScriptCache();
    const cacheKey = `update_${updateId}`;

    if (cache.get(cacheKey)) {
      Logger.log('Duplicate update, skipping: ' + updateId);
      return HtmlService.createHtmlOutput('OK');
    }

    // Mark as processed (cache for 1 hour)
    cache.put(cacheKey, 'processed', 3600);

    // Chỉ cho phép user ID (người gửi) trong whitelist (xem isAuthorized)
    const from = update.message ? update.message.from :
      update.callback_query ? update.callback_query.from : null;
    const userId = from ? from.id : null;

    if (!isAuthorized(userId)) {
      Logger.log('⛔ Unauthorized user: ' + userId);
      if (update.callback_query) {
        answerCallbackQuery(update.callback_query.id, '⛔ Không có quyền sử dụng bot', true);
      } else if (update.message) {
        sendMessage(update.message.chat.id,
          `⛔ Bạn không có quyền sử dụng bot này.\nID của bạn: ${userId}. Gửi ID này cho quản trị viên để được cấp quyền.`);
      }
      return HtmlService.createHtmlOutput('OK');
    }

    // Dữ liệu của người gửi: Sheet riêng của thầy; admin dùng file gốc hoặc thầy đang chọn (teachers.gs)
    setCurrentUser(userId);

    // Handle message
    if (update.message) {
      Logger.log('Processing message from: ' + update.message.chat.id);
      handleMessage(update.message);
    }

    // Handle callback query (button clicks)
    if (update.callback_query) {
      Logger.log('Processing callback from: ' + update.callback_query.message.chat.id);
      handleCallbackQuery(update.callback_query);
    }

    Logger.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');

    // Return HTML 200 OK - avoids Google redirect
    return HtmlService.createHtmlOutput('OK');

  } catch (error) {
    Logger.log('❌ ERROR in doPost: ' + error.toString());
    Logger.log('Stack: ' + error.stack);

    // Still return 200 OK to Telegram, just log the error
    return HtmlService.createHtmlOutput('OK');
  }
}

/**
 * doGet - Handle GET requests (for testing)
 * Trả về status khi mở URL trong browser
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Telegram Bot Webhook is running',
    timestamp: new Date().toISOString()
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle incoming messages
 */
function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';

  Logger.log('=== HANDLE MESSAGE ===');
  Logger.log('Chat ID: ' + chatId);
  Logger.log('Text: ' + text);

  // Commands
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1);

    Logger.log('Command: ' + command);

    try {
      switch (command) {
        case '/start':
          sendWelcomeMessage(chatId);
          break;

        case '/help':
          sendHelpMessage(chatId);
          break;

        case '/huy':
          if (getConversationState(message.from.id)) {
            clearConversationState(message.from.id);
            sendMessage(chatId, '✅ Đã hủy thao tác đang thực hiện.');
          } else {
            sendMessage(chatId, 'Không có thao tác nào đang thực hiện.');
          }
          break;

        case '/them_gv':
        case '/ds_gv':
        case '/xoa_gv':
        case '/chon_gv':
          if (!isAdmin(message.from.id)) {
            sendMessage(chatId, '❌ Lệnh này chỉ dành cho admin.');
          } else if (command === '/them_gv') {
            handleAddTeacher(chatId, args);
          } else if (command === '/ds_gv') {
            handleListTeachers(chatId);
          } else if (command === '/xoa_gv') {
            handleRemoveTeacher(chatId, args);
          } else {
            handleSelectTeacher(chatId, message.from.id, args);
          }
          break;

        case '/them_hv':
          startAddStudentConversation(chatId, message.from.id);
          break;

        case '/ds_hv':
          handleListStudents(chatId, null, 1);
          break;

        case '/tim_hv':
          if (args.length > 0) {
            const keyword = args.join(' ');
            searchStudent(chatId, keyword);
          } else {
            sendMessage(chatId, '❌ Vui lòng nhập từ khóa tìm kiếm.\n\nVí dụ: /tim\\_hv Nguyễn', { parse_mode: 'Markdown' });
          }
          break;

        case '/dat_lich':
          startScheduleConversation(chatId, message.from.id);
          break;

        case '/lich_hom_nay':
          handleTodaySchedule(chatId);
          break;

        case '/lich_tuan':
          handleWeekSchedule(chatId);
          break;

        case '/thu_tien':
          startPaymentConversation(chatId, message.from.id);
          break;

        case '/xem_no':
          if (isAdminAtRoot()) {
            handleAdminDebt(chatId);
          } else {
            handleViewDebt(chatId);
          }
          break;

        case '/ds_xe':
          handleListVehicles(chatId);
          break;

        case '/them_xe':
          startAddVehicleConversation(chatId, message.from.id);
          break;

        case '/dat_lich_thi':
          startExamConversation(chatId, message.from.id);
          break;

        case '/ds_thi':
          handleListExams(chatId);
          break;

        case '/thong_ke':
          if (isAdminAtRoot()) {
            handleAdminStatistics(chatId);
          } else {
            handleStatistics(chatId);
          }
          break;

        case '/bao_cao':
          handleReports(chatId);
          break;

        default:
          // Check if command matches /xem_HVXXX pattern
          if (command.startsWith('/xem_')) {
            const studentId = command.substring(5); // Remove '/xem_'
            handleViewStudent(chatId, studentId);
          } else {
            sendMessage(chatId, '❌ Lệnh không hợp lệ. Gõ /help để xem danh sách lệnh.');
          }
      }
    } catch (error) {
      Logger.log('ERROR in command: ' + error.toString());
      sendMessage(chatId, '❌ Lỗi: ' + error.toString());
    }
  } else {
    // Handle conversation state
    handleConversationState(chatId, message.from.id, text);
  }
}

// handleCallbackQuery moved to callbacks.gs to avoid duplication

/**
 * Send welcome message
 */
function sendWelcomeMessage(chatId) {
  Logger.log('=== SENDING WELCOME MESSAGE ===');
  Logger.log('Chat ID: ' + chatId);

  const line = getContextLine();
  const contextLine = line ? line + '\n\n' : '';

  const message = `
🎓 *CHÀO MỪNG ĐẾN BOT QUẢN LÝ HỌC VIÊN*

Bot hỗ trợ bạn quản lý:
✅ Thông tin học viên
✅ Lịch học & lịch thi
✅ Thanh toán & công nợ
✅ Tiến độ học tập
✅ Quản lý xe tập
✅ Nhắc nhở tự động
✅ Báo cáo thống kê

${contextLine}📝 Gõ /help để xem danh sách lệnh.
  `.trim();

  const result = sendMessage(chatId, message, { parse_mode: 'Markdown' });
  Logger.log('Send message result: ' + JSON.stringify(result));

  return result;
}

/**
 * Send help message
 */
function sendHelpMessage(chatId) {
  const ctx = getCurrentContext();
  const adminSection = ctx && ctx.isAdmin ? `
*👑 ADMIN*
/them\\_gv <ID> <Tên> [email] - Thêm giáo viên, tạo Sheet riêng
/ds\\_gv - Danh sách giáo viên
/xoa\\_gv <ID> - Khóa giáo viên
/chon\\_gv <ID> - Vào dữ liệu của một thầy, /chon\\_gv để quay về
/thong\\_ke, /xem\\_no - Tổng hợp toàn trường (khi ở file gốc)
` : '';

  const message = `
📚 *DANH SÁCH LỆNH*

*👥 QUẢN LÝ HỌC VIÊN*
/them\\_hv - Thêm học viên mới
/ds\\_hv - Danh sách học viên
/tim\\_hv <từ khóa> - Tìm kiếm học viên
/xem\\_<mã HV> - Xem chi tiết học viên

*📅 LỊCH HỌC*
/dat\\_lich - Đặt lịch học mới
/lich\\_hom\\_nay - Xem lịch hôm nay
/lich\\_tuan - Xem lịch tuần

*💰 THANH TOÁN*
/thu\\_tien - Thu tiền học phí
/xem\\_no - Xem danh sách công nợ

*🎓 LỊCH THI*
/dat\\_lich\\_thi - Đặt lịch thi mới
/ds\\_thi - Danh sách lịch thi

*🚗 QUẢN LÝ XE*
/ds\\_xe - Danh sách xe tập
/them\\_xe - Thêm xe mới

*📊 BÁO CÁO*
/thong\\_ke - Thống kê tổng quan
/bao\\_cao - Báo cáo chi tiết

*⚙️ KHÁC*
/huy - Hủy thao tác đang thực hiện
${adminSection}
_Liên hệ admin nếu cần hỗ trợ\\._
  `.trim();

  sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Test function - gửi message thử
 */
function testSendMessage() {
  const testChatId = PropertiesService.getScriptProperties().getProperty('TEST_CHAT_ID');

  if (!testChatId) {
    Logger.log('Chưa set TEST_CHAT_ID trong Script Properties');
    return;
  }

  sendMessage(testChatId, '✅ Bot đang hoạt động!\n\nGõ /start để bắt đầu.');
}

/**
 * Setup Script Properties (chạy 1 lần đầu)
 */
function setupProperties() {
  const ui = SpreadsheetApp.getUi();

  // Bot Token
  const tokenResponse = ui.prompt(
    'Setup Bot',
    'Nhập Telegram Bot Token:',
    ui.ButtonSet.OK_CANCEL
  );

  if (tokenResponse.getSelectedButton() === ui.Button.OK) {
    const token = tokenResponse.getResponseText();
    PropertiesService.getScriptProperties().setProperty('TELEGRAM_BOT_TOKEN', token);

    // Test Chat ID
    const chatIdResponse = ui.prompt(
      'Setup Bot',
      'Nhập Chat ID của bạn (được phép dùng bot):',
      ui.ButtonSet.OK_CANCEL
    );

    if (chatIdResponse.getSelectedButton() === ui.Button.OK) {
      const chatId = chatIdResponse.getResponseText();
      PropertiesService.getScriptProperties().setProperty('TEST_CHAT_ID', chatId);
      PropertiesService.getScriptProperties().setProperty('ADMIN_IDS', chatId);

      // Admin Name
      const nameResponse = ui.prompt(
        'Setup Bot',
        'Nhập tên của bạn (giáo viên mặc định):',
        ui.ButtonSet.OK_CANCEL
      );

      if (nameResponse.getSelectedButton() === ui.Button.OK) {
        const adminName = nameResponse.getResponseText();
        PropertiesService.getScriptProperties().setProperty('ADMIN_NAME', adminName);
      }

      ui.alert('✅ Setup thành công!\n\nBước tiếp:\n1. Deploy web app\n2. Copy URL\n3. Chạy setWebhook()');
    }
  }
}
