/**
 * STATISTICS - Thống kê tổng quan
 */

/**
 * Handle /thong_ke command
 */
function handleStatistics(chatId) {
  try {
    const stats = calculateStatistics();

    let message = `📊 *THỐNG KÊ TỔNG QUAN*\n\n`;

    // Student statistics
    message += `👥 *HỌC VIÊN*\n`;
    message += `Tổng số: ${stats.students.total}\n`;
    message += `📖 Đang học: ${stats.students.active}\n`;
    message += `⏳ Chờ thi: ${stats.students.waitingExam}\n`;
    message += `🎓 Đã tốt nghiệp: ${stats.students.graduated}\n`;
    message += `❌ Bỏ học: ${stats.students.dropped}\n\n`;

    // Schedule statistics
    message += `📅 *LỊCH HỌC*\n`;
    message += `Hôm nay: ${stats.schedules.today}\n`;
    message += `Tuần này: ${stats.schedules.thisWeek}\n`;
    message += `Tháng này: ${stats.schedules.thisMonth}\n\n`;

    // Financial statistics
    message += `💰 *TÀI CHÍNH*\n`;
    message += `Tổng học phí: ${formatMoney(stats.finance.totalFees)}\n`;
    message += `Đã thu: ${formatMoney(stats.finance.collected)}\n`;
    message += `Còn nợ: ${formatMoney(stats.finance.debt)}\n`;
    message += `Tỷ lệ thu: ${stats.finance.collectionRate}%\n\n`;

    // Vehicle statistics
    message += `🚗 *XE TẬP*\n`;
    message += `Tổng số: ${stats.vehicles.total}\n`;
    message += `✅ Đang dùng: ${stats.vehicles.active}\n`;
    message += `🔧 Bảo trì: ${stats.vehicles.maintenance}\n\n`;

    // Exam statistics
    message += `🎓 *KỲ THI*\n`;
    message += `Sắp tới: ${stats.exams.upcoming}\n`;
    message += `✅ Đạt: ${stats.exams.passed}\n`;
    message += `❌ Không đạt: ${stats.exams.failed}\n`;
    if (stats.exams.total > 0) {
      message += `Tỷ lệ đạt: ${stats.exams.passRate}%`;
    }

    sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in handleStatistics: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tính thống kê. Chi tiết: ' + error.message);
  }
}

/**
 * Calculate all statistics
 */
function calculateStatistics() {
  const students = getAllStudents();
  const schedules = getAllSchedules();
  const vehicles = getAllVehicles();
  const exams = getAllExams();

  // Student stats
  // Giá trị trạng thái theo dropdown STUDENT_STATUS trong create-sheets.gs
  const studentStats = {
    total: students.length,
    active: students.filter(s => s.trangThai === 'Đang học').length,
    waitingExam: students.filter(s => s.trangThai === 'Chờ thi').length,
    graduated: students.filter(s => s.trangThai === 'Đã tốt nghiệp').length,
    dropped: students.filter(s => s.trangThai === 'Bỏ học').length
  };

  // Schedule stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const scheduleStats = {
    today: schedules.filter(s => {
      const scheduleDate = new Date(s.ngayHoc);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === today.getTime();
    }).length,
    thisWeek: schedules.filter(s => {
      const date = formatDateOnly(s.ngayHoc);
      return isDateInRange(date, weekRange.start, weekRange.end);
    }).length,
    thisMonth: schedules.filter(s => {
      const date = formatDateOnly(s.ngayHoc);
      return isDateInRange(date, monthRange.start, monthRange.end);
    }).length
  };

  // Financial stats
  const totalFees = students.reduce((sum, s) => sum + (s.hocPhi || 0), 0);
  const collected = students.reduce((sum, s) => sum + (s.daDong || 0), 0);
  const debt = students.reduce((sum, s) => sum + (s.conNo || 0), 0);
  const collectionRate = totalFees > 0 ? Math.round((collected / totalFees) * 100) : 0;

  const financeStats = {
    totalFees: totalFees,
    collected: collected,
    debt: debt,
    collectionRate: collectionRate
  };

  // Vehicle stats
  const vehicleStats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.trangThai === 'Đang dùng').length,
    maintenance: vehicles.filter(v => v.trangThai === 'Bảo trì').length
  };

  // Exam stats
  const upcomingExams = getUpcomingExams();
  const passedExams = exams.filter(e => e.result === 'Đạt').length;
  const failedExams = exams.filter(e => e.result === 'Không đạt').length;
  const completedExams = passedExams + failedExams;
  const passRate = completedExams > 0 ? Math.round((passedExams / completedExams) * 100) : 0;

  const examStats = {
    upcoming: upcomingExams.length,
    passed: passedExams,
    failed: failedExams,
    total: completedExams,
    passRate: passRate
  };

  return {
    students: studentStats,
    schedules: scheduleStats,
    finance: financeStats,
    vehicles: vehicleStats,
    exams: examStats
  };
}

/**
 * Format date only (remove time)
 */
function formatDateOnly(dateValue) {
  if (!dateValue) return '';

  if (typeof dateValue === 'string' && dateValue.includes('/')) {
    return dateValue.split(' ')[0]; // Extract DD/MM/YYYY part
  }

  if (dateValue instanceof Date) {
    return Utilities.formatDate(dateValue, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }

  return formatDate(dateValue).split(' ')[0];
}

/**
 * Check if date is in range
 */
function isDateInRange(dateStr, startStr, endStr) {
  if (!dateStr || !startStr || !endStr) return false;

  // Parse dates in DD/MM/YYYY format
  const parseSimpleDate = (str) => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  const date = parseSimpleDate(dateStr);
  const start = parseSimpleDate(startStr);
  const end = parseSimpleDate(endStr);

  if (!date || !start || !end) return false;

  return date >= start && date <= end;
}
