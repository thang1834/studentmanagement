/**
 * DEBUG FUNCTIONS
 * Kiểm tra kết nối và cấu hình bot
 */

/**
 * Test bot connection và token
 */
function debugBotConnection() {
  const CONFIG = getConfig();
  const token = CONFIG.TELEGRAM_BOT_TOKEN;

  Logger.log('=== DEBUG BOT CONNECTION ===');
  Logger.log('Token exists: ' + !!token);
  Logger.log('Token length: ' + (token ? token.length : 0));
  Logger.log('Token preview: ' + (token ? token.substring(0, 10) + '...' : 'NULL'));

  if (!token) {
    Logger.log('❌ ERROR: TELEGRAM_BOT_TOKEN not set in Script Properties');
    return { error: 'Token not set' };
  }

  // Test getMe API
  try {
    const url = `${CONFIG.TELEGRAM_API_URL}${token}/getMe`;
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());

    Logger.log('getMe result: ' + JSON.stringify(result));

    if (result.ok) {
      Logger.log('✅ Bot connection OK');
      Logger.log('Bot username: @' + result.result.username);
      Logger.log('Bot name: ' + result.result.first_name);
      return result;
    } else {
      Logger.log('❌ Bot API error: ' + result.description);
      return result;
    }
  } catch (error) {
    Logger.log('❌ EXCEPTION: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * Test send message với chat ID cụ thể
 */
function debugSendMessage() {
  const testChatId = PropertiesService.getScriptProperties().getProperty('TEST_CHAT_ID');

  if (!testChatId) {
    Logger.log('❌ TEST_CHAT_ID not set. Please set it first.');
    return { error: 'TEST_CHAT_ID not set' };
  }

  Logger.log('=== DEBUG SEND MESSAGE ===');
  Logger.log('Test Chat ID: ' + testChatId);

  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const payload = {
    chat_id: testChatId,
    text: '🔧 DEBUG TEST MESSAGE\n\nNếu bạn thấy tin nhắn này, bot đang hoạt động bình thường!\n\nTimestamp: ' + new Date().toISOString()
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    Logger.log('Sending request to: ' + url);
    Logger.log('Payload: ' + JSON.stringify(payload));

    const response = UrlFetchApp.fetch(url, params);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Response code: ' + responseCode);
    Logger.log('Response body: ' + responseText);

    const result = JSON.parse(responseText);

    if (result.ok) {
      Logger.log('✅ Message sent successfully');
      return result;
    } else {
      Logger.log('❌ Telegram API error: ' + result.description);
      return result;
    }
  } catch (error) {
    Logger.log('❌ EXCEPTION: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * Kiểm tra tất cả Script Properties
 */
function debugScriptProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();

  Logger.log('=== SCRIPT PROPERTIES ===');

  const keys = Object.keys(props);
  Logger.log('Total properties: ' + keys.length);

  keys.forEach(key => {
    if (key === 'TELEGRAM_BOT_TOKEN') {
      Logger.log(key + ': ' + props[key].substring(0, 10) + '...' + ' (length: ' + props[key].length + ')');
    } else {
      Logger.log(key + ': ' + props[key]);
    }
  });

  // Check required properties
  const required = ['TELEGRAM_BOT_TOKEN', 'WEB_APP_URL'];
  const missing = required.filter(k => !props[k]);

  if (missing.length > 0) {
    Logger.log('⚠️ Missing required properties: ' + missing.join(', '));
  } else {
    Logger.log('✅ All required properties set');
  }

  return props;
}

/**
 * Kiểm tra webhook info
 */
function debugWebhookInfo() {
  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/getWebhookInfo`;

  try {
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());

    Logger.log('=== WEBHOOK INFO ===');
    Logger.log(JSON.stringify(result, null, 2));

    if (result.ok) {
      const info = result.result;
      Logger.log('Webhook URL: ' + info.url);
      Logger.log('Pending updates: ' + info.pending_update_count);
      Logger.log('Max connections: ' + info.max_connections);

      if (info.last_error_date) {
        Logger.log('⚠️ Last error: ' + info.last_error_message);
        Logger.log('   Date: ' + new Date(info.last_error_date * 1000).toISOString());
      } else {
        Logger.log('✅ No errors');
      }
    }

    return result;
  } catch (error) {
    Logger.log('❌ EXCEPTION: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * Test webhook response trực tiếp
 */
function testWebhookResponse() {
  const webAppUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');

  if (!webAppUrl) {
    Logger.log('❌ WEB_APP_URL not set');
    return { error: 'WEB_APP_URL not set' };
  }

  Logger.log('=== TEST WEBHOOK RESPONSE ===');
  Logger.log('Testing URL: ' + webAppUrl);

  // Simulate a Telegram update (gửi tới TEST_CHAT_ID trong Script Properties)
  const testChatId = Number(PropertiesService.getScriptProperties().getProperty('TEST_CHAT_ID'));
  const fakeUpdate = {
    update_id: 999999999,
    message: {
      message_id: 1,
      from: {
        id: testChatId,
        first_name: "Test"
      },
      chat: {
        id: testChatId,
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start"
    }
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(fakeUpdate),
    followRedirects: false, // Don't follow redirects - we want to see the 302
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(webAppUrl, params);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Response code: ' + responseCode);
    Logger.log('Response text: ' + responseText);
    Logger.log('Response headers: ' + JSON.stringify(response.getHeaders()));

    if (responseCode === 200) {
      Logger.log('✅ Webhook responding correctly with 200 OK');
      return { success: true, code: responseCode };
    } else if (responseCode === 302) {
      Logger.log('❌ Webhook returning 302 redirect - THIS IS THE PROBLEM');
      Logger.log('Location header: ' + response.getHeaders()['Location']);
      return { error: '302 redirect', location: response.getHeaders()['Location'] };
    } else {
      Logger.log('⚠️ Unexpected response code: ' + responseCode);
      return { error: 'Unexpected code', code: responseCode };
    }
  } catch (error) {
    Logger.log('❌ EXCEPTION: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * Test send help message trực tiếp
 */
function testSendHelpMessage() {
  const testChatId = PropertiesService.getScriptProperties().getProperty('TEST_CHAT_ID');

  if (!testChatId) {
    Logger.log('❌ TEST_CHAT_ID not set');
    return;
  }

  Logger.log('=== TEST SEND HELP MESSAGE ===');
  Logger.log('Chat ID: ' + testChatId);

  const message = `
📚 *DANH SÁCH LỆNH*

*👥 QUẢN LÝ HỌC VIÊN*
/them_hv - Thêm học viên mới
/ds_hv - Danh sách học viên
/tim_hv <từ khóa> - Tìm kiếm học viên
/xem_hv <mã HV> - Xem chi tiết học viên

*📅 LỊCH HỌC*
/dat_lich - Đặt lịch học mới
/lich_hom_nay - Xem lịch hôm nay
/lich_tuan - Xem lịch tuần

*💰 THANH TOÁN*
/thu_tien - Thu tiền học phí
/xem_no - Xem danh sách công nợ

*📝 LỊCH THI*
/dat_lich_thi - Đặt lịch thi
/ds_thi - Danh sách kỳ thi

*🚗 QUẢN LÝ XE*
/ds_xe - Danh sách xe
/them_xe - Thêm xe mới

*📊 BÁO CÁO*
/thong_ke - Thống kê tổng quan
/bao_cao - Báo cáo chi tiết

_Liên hệ admin nếu cần hỗ trợ._
  `.trim();

  Logger.log('Sending help message...');
  const result = sendMessage(testChatId, message, { parse_mode: 'Markdown' });

  Logger.log('Result: ' + JSON.stringify(result));

  if (result && result.ok) {
    Logger.log('✅ Help message sent successfully');
  } else {
    Logger.log('❌ Failed to send help message');
    if (result) {
      Logger.log('Error: ' + result.description);
    }
  }

  return result;
}

/**
 * Chạy tất cả debug tests
 */
function runAllDebugTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING ALL DEBUG TESTS');
  Logger.log('========================================\n');

  debugScriptProperties();
  Logger.log('\n');

  debugBotConnection();
  Logger.log('\n');

  debugWebhookInfo();
  Logger.log('\n');

  testWebhookResponse();
  Logger.log('\n');

  debugSendMessage();

  Logger.log('\n========================================');
  Logger.log('DEBUG TESTS COMPLETED');
  Logger.log('========================================');
}
