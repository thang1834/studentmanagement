/**
 * TELEGRAM API FUNCTIONS
 * Gửi messages, keyboards, callbacks
 */

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

/**
 * Send message to chat
 * Tin dài hơn giới hạn được cắt theo dòng; chỉ phần cuối mang reply_markup.
 */
function sendMessage(chatId, text, options = {}) {
  if (text.length > TELEGRAM_MAX_MESSAGE_LENGTH) {
    const chunks = splitMessage(text, TELEGRAM_MAX_MESSAGE_LENGTH);
    let result = null;
    chunks.forEach((chunk, i) => {
      const isLast = i === chunks.length - 1;
      result = sendMessage(chatId, chunk, isLast ? options : { parse_mode: options.parse_mode });
    });
    return result;
  }

  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
    ...options
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    return retryWithoutMarkdown(url, params, payload, JSON.parse(response.getContentText()));
  } catch (error) {
    Logger.log('Error sending message: ' + error.toString());
    return null;
  }
}

/**
 * Edit message
 */
function editMessage(chatId, messageId, text, options = {}) {
  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/editMessageText`;

  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    ...options
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    return retryWithoutMarkdown(url, params, payload, JSON.parse(response.getContentText()));
  } catch (error) {
    Logger.log('Error editing message: ' + error.toString());
    return null;
  }
}

/**
 * Delete message
 */
function deleteMessage(chatId, messageId) {
  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/deleteMessage`;

  const payload = {
    chat_id: chatId,
    message_id: messageId
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error deleting message: ' + error.toString());
    return null;
  }
}

/**
 * Answer callback query
 */
function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  const CONFIG = getConfig();
  const url = `${CONFIG.TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;

  const payload = {
    callback_query_id: callbackQueryId,
    text: text,
    show_alert: showAlert
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error answering callback: ' + error.toString());
    return null;
  }
}

/**
 * Create inline keyboard
 */
function createInlineKeyboard(buttons) {
  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
}

/**
 * Create inline button
 */
function createInlineButton(text, callbackData) {
  return {
    text: text,
    callback_data: callbackData
  };
}

/**
 * Create reply keyboard
 */
function createReplyKeyboard(buttons, options = {}) {
  return {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true,
      one_time_keyboard: false,
      ...options
    }
  };
}

/**
 * Remove keyboard
 */
function removeKeyboard() {
  return {
    reply_markup: {
      remove_keyboard: true
    }
  };
}

/**
 * Send message with inline keyboard
 */
function sendMessageWithKeyboard(chatId, text, buttons, parseMode = 'Markdown') {
  const keyboard = createInlineKeyboard(buttons);
  return sendMessage(chatId, text, {
    parse_mode: parseMode,
    ...keyboard
  });
}

/**
 * Edit message with inline keyboard
 */
function editMessageWithKeyboard(chatId, messageId, text, buttons, parseMode = 'Markdown') {
  const keyboard = createInlineKeyboard(buttons);
  return editMessage(chatId, messageId, text, {
    parse_mode: parseMode,
    ...keyboard
  });
}

/**
 * Nếu Telegram không parse được Markdown (tên/ghi chú chứa _ * ` [ chưa escape),
 * gửi lại cùng nội dung dạng text thuần để tin nhắn không bị mất.
 */
function retryWithoutMarkdown(url, params, payload, result) {
  if (result && !result.ok && payload.parse_mode && /parse entities/i.test(result.description || '')) {
    Logger.log('Markdown parse failed, resending as plain text: ' + result.description);
    delete payload.parse_mode;
    params.payload = JSON.stringify(payload);
    return JSON.parse(UrlFetchApp.fetch(url, params).getContentText());
  }
  return result;
}

/**
 * Cắt text dài thành nhiều phần <= maxLength, ưu tiên cắt tại xuống dòng
 */
function splitMessage(text, maxLength) {
  const chunks = [];
  let current = '';

  for (let line of text.split('\n')) {
    // Một dòng đơn lẻ quá dài: cắt cứng
    while (line.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      chunks.push(line.substring(0, maxLength));
      line = line.substring(maxLength);
    }

    const candidate = current ? current + '\n' + line : line;
    if (candidate.length > maxLength) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
