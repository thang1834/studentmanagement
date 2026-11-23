/**
 * Check execution logs của /help command
 * Chạy function này NGAY SAU KHI gửi /help trong Telegram
 */
function checkLastExecutionLogs() {
  // Lấy executions gần nhất
  Logger.log('=== CHECKING RECENT EXECUTIONS ===');
  Logger.log('Go to: Executions tab → Click on the latest doPost execution');
  Logger.log('Look for logs containing "/help" command');
  Logger.log('');
  Logger.log('Things to check:');
  Logger.log('1. Did handleMessage() receive /help?');
  Logger.log('2. Did it call sendHelpMessage()?');
  Logger.log('3. Were there any errors?');
  Logger.log('4. What was the sendMessage() API response?');
}
