/**
 * UTILITY FUNCTIONS
 * Helper functions for formatting, validation, etc.
 */

/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Format date
 */
function formatDate(dateValue) {
  if (!dateValue) return '-';

  if (typeof dateValue === 'string') {
    return dateValue;
  }

  // Handle Date object - format with time; date-only cells (00:00) show just the date
  if (dateValue instanceof Date) {
    const day = Utilities.formatDate(dateValue, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
    const time = Utilities.formatDate(dateValue, 'Asia/Ho_Chi_Minh', 'HH:mm');
    return time === '00:00' ? day : `${day} ${time}`;
  }

  return Utilities.formatDate(new Date(dateValue), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
}

/**
 * Format money
 */
function formatMoney(amount) {
  if (!amount || amount === 0) return '0₫';

  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
}

/**
 * Parse date from flexible input
 * Supports: 25/12/2024, 25/12, 25-12-2024, 25122026, hôm nay, mai, ngày mai
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const text = dateStr.trim().toLowerCase();
  const now = new Date();

  // Handle relative dates
  if (text === 'hôm nay' || text === 'hom nay') {
    return Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }

  if (text === 'mai' || text === 'ngày mai' || text === 'ngay mai') {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return Utilities.formatDate(tomorrow, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }

  // Handle DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const parts = text.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  // Handle DD/MM format (no year - use current year)
  if (/^\d{1,2}\/\d{1,2}$/.test(text)) {
    const parts = text.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = now.getFullYear();

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  // Handle DD-MM-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(text)) {
    const parts = text.split('-');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  // Handle DDMMYYYY format (8 digits)
  if (/^\d{8}$/.test(text)) {
    const day = parseInt(text.substring(0, 2));
    const month = parseInt(text.substring(2, 4));
    const year = parseInt(text.substring(4, 8));

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  return null;
}

/**
 * Get today as DD/MM/YYYY
 */
function getToday() {
  return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
}

/**
 * Get status emoji
 */
function getStatusEmoji(status) {
  // Theo dropdown STUDENT_STATUS trong create-sheets.gs
  const emojiMap = {
    'Chờ xử lý hồ sơ': '📂',
    'Đang học': '📖',
    'Chờ thi': '⏳',
    'Đã tốt nghiệp': '🎓',
    'Bỏ học': '❌'
  };

  return emojiMap[status] || '📌';
}

/**
 * Validate phone number
 */
function validatePhone(phone) {
  return /^0\d{9}$/.test(phone);
}

/**
 * Validate ID card
 */
function validateIdCard(idCard) {
  return /^\d{9,12}$/.test(idCard);
}

/**
 * Validate date format
 */
function validateDateFormat(dateStr) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
}

/**
 * Validate money amount
 */
function validateMoney(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
}

/**
 * Escape markdown
 */
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Truncate text
 */
function truncate(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate random ID
 */
function generateId(prefix, length = 3) {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Check if date is today
 */
function isToday(dateStr) {
  return dateStr === getToday();
}

/**
 * Get week start and end
 */
function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday

  const monday = new Date(now.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: Utilities.formatDate(monday, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'),
    end: Utilities.formatDate(sunday, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy')
  };
}

/**
 * Get month start and end
 */
function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: Utilities.formatDate(start, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'),
    end: Utilities.formatDate(end, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy')
  };
}

/**
 * Calculate days difference
 */
function daysDiff(dateStr1, dateStr2) {
  const date1 = parseDate(dateStr1);
  const date2 = parseDate(dateStr2);

  if (!date1 || !date2) return null;

  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Sort by date
 */
function sortByDate(items, dateField, ascending = true) {
  return items.sort((a, b) => {
    const dateA = parseDate(a[dateField]);
    const dateB = parseDate(b[dateField]);

    if (!dateA || !dateB) return 0;

    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Group by field
 */
function groupBy(items, field) {
  return items.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Calculate sum
 */
function sum(items, field) {
  return items.reduce((total, item) => total + (item[field] || 0), 0);
}

/**
 * Calculate average
 */
function average(items, field) {
  if (items.length === 0) return 0;
  return sum(items, field) / items.length;
}

/**
 * Log error
 */
function logError(error, context = '') {
  const sheet = getDb().getSheetByName('LOGS');

  if (!sheet) return;

  const timestamp = getCurrentTimestamp();
  const errorMsg = error.toString();

  sheet.appendRow([timestamp, context, errorMsg]);
}

/**
 * Send notification to admin
 */
function notifyAdmin(message) {
  const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');

  if (!adminChatId) return;

  sendMessage(adminChatId, `🔔 *Thông báo hệ thống*\n\n${message}`, { parse_mode: 'Markdown' });
}

/**
 * Parse time input flexibly
 * Accepts: 17h, 17h30, 17:00, 17:30
 * Returns: HH:mm format or null if invalid
 */
function parseTime(text) {
  if (!text) return null;

  let time = text.trim().toLowerCase();

  // Convert "17h" → "17:00"
  if (/^\d{1,2}h$/.test(time)) {
    time = time.replace('h', ':00');
  }
  // Convert "17h30" → "17:30"
  else if (/^\d{1,2}h\d{2}$/.test(time)) {
    time = time.replace('h', ':');
  }

  // Validate HH:mm format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    return null;
  }

  return time;
}
