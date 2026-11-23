/**
 * QUICK SETUP - Set admin name
 * Chạy function này để set tên giáo viên mặc định
 */
function setAdminName() {
  const adminName = 'Nguyễn Đức Thắng'; // Thay bằng tên của bạn

  PropertiesService.getScriptProperties().setProperty('ADMIN_NAME', adminName);

  Logger.log('✅ Đã set ADMIN_NAME: ' + adminName);

  return adminName;
}

/**
 * Check all properties
 */
function checkAllProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();

  Logger.log('=== ALL SCRIPT PROPERTIES ===');

  Object.keys(props).forEach(key => {
    if (key === 'TELEGRAM_BOT_TOKEN') {
      Logger.log(key + ': ' + props[key].substring(0, 10) + '...');
    } else {
      Logger.log(key + ': ' + props[key]);
    }
  });

  return props;
}
