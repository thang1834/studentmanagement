/**
 * REPORTS - Báo cáo chi tiết
 */

/**
 * Handle /bao_cao command
 */
function handleReports(chatId) {
  // Show report options
  const buttons = [
    [createInlineButton('📊 Báo cáo học viên', 'report:students')],
    [createInlineButton('💰 Báo cáo tài chính', 'report:finance')],
    [createInlineButton('📅 Báo cáo lịch học', 'report:schedules')],
    [createInlineButton('🎓 Báo cáo kỳ thi', 'report:exams')],
    [createInlineButton('🚗 Báo cáo xe tập', 'report:vehicles')]
  ];

  const message = `📋 *BÁO CÁO CHI TIẾT*\n\nChọn loại báo cáo:`;
  sendMessageWithKeyboard(chatId, message, buttons);
}

/**
 * Handle report type callback
 */
function handleReportCallback(chatId, reportType) {
  switch (reportType) {
    case 'students':
      sendStudentReport(chatId);
      break;

    case 'finance':
      sendFinanceReport(chatId);
      break;

    case 'schedules':
      sendScheduleReport(chatId);
      break;

    case 'exams':
      sendExamReport(chatId);
      break;

    case 'vehicles':
      sendVehicleReport(chatId);
      break;

    default:
      sendMessage(chatId, '❌ Loại báo cáo không hợp lệ.');
  }
}

/**
 * Send student report
 */
function sendStudentReport(chatId) {
  try {
    const students = getAllStudents();

    if (students.length === 0) {
      sendMessage(chatId, '📊 *BÁO CÁO HỌC VIÊN*\n\nChưa có học viên nào.', { parse_mode: 'Markdown' });
      return;
    }

    // Group by status
    const byStatus = groupBy(students, 'trangThai');

    // Group by license type
    const byLicense = groupBy(students, 'loaiBang');

    let message = `📊 *BÁO CÁO HỌC VIÊN*\n\n`;
    message += `Tổng số: ${students.length} học viên\n\n`;

    // By status
    message += `*Theo trạng thái:*\n`;
    Object.keys(byStatus).sort().forEach(status => {
      const count = byStatus[status].length;
      const percent = Math.round((count / students.length) * 100);
      message += `${getStatusEmoji(status)} ${status}: ${count} (${percent}%)\n`;
    });

    message += `\n*Theo loại bằng:*\n`;
    Object.keys(byLicense).sort().forEach(license => {
      const count = byLicense[license].length;
      message += `🎓 ${license}: ${count}\n`;
    });

    // Top debtors
    const debtors = students
      .filter(s => s.conNo > 0)
      .sort((a, b) => b.conNo - a.conNo)
      .slice(0, 5);

    if (debtors.length > 0) {
      message += `\n*Top công nợ:*\n`;
      debtors.forEach((s, idx) => {
        message += `${idx + 1}. ${s.hoTen}: ${formatMoney(s.conNo)}\n`;
      });
    }

    sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in sendStudentReport: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tạo báo cáo.');
  }
}

/**
 * Send finance report
 */
function sendFinanceReport(chatId) {
  try {
    const students = getAllStudents();
    const payments = getAllPayments();

    const totalFees = students.reduce((sum, s) => sum + (s.hocPhi || 0), 0);
    const collected = students.reduce((sum, s) => sum + (s.daDong || 0), 0);
    const debt = students.reduce((sum, s) => sum + (s.conNo || 0), 0);

    // This month's payments (Ngày giờ có thể là Date hoặc chuỗi dd/MM/yyyy HH:mm:ss)
    const thisMonth = new Date();
    const thisMonthKey = Utilities.formatDate(thisMonth, 'Asia/Ho_Chi_Minh', 'MM/yyyy');
    const monthPayments = payments.filter(p =>
      p.loai !== 'Chi' && formatDateOnly(p.ngayGio).slice(3) === thisMonthKey
    );
    const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.soTien || 0), 0);

    let message = `💰 *BÁO CÁO TÀI CHÍNH*\n\n`;
    message += `*Tổng quan:*\n`;
    message += `Tổng học phí: ${formatMoney(totalFees)}\n`;
    message += `Đã thu: ${formatMoney(collected)}\n`;
    message += `Còn nợ: ${formatMoney(debt)}\n`;
    message += `Tỷ lệ thu: ${Math.round((collected / totalFees) * 100)}%\n\n`;

    message += `*Tháng này (${thisMonth.getMonth() + 1}/${thisMonth.getFullYear()}):*\n`;
    message += `Số giao dịch: ${monthPayments.length}\n`;
    message += `Tổng thu: ${formatMoney(monthRevenue)}\n\n`;

    // By payment method
    const byMethod = groupBy(monthPayments, 'hinhThuc');
    if (Object.keys(byMethod).length > 0) {
      message += `*Theo phương thức:*\n`;
      Object.keys(byMethod).forEach(method => {
        const count = byMethod[method].length;
        const amount = byMethod[method].reduce((sum, p) => sum + (p.soTien || 0), 0);
        message += `${method}: ${count} giao dịch - ${formatMoney(amount)}\n`;
      });
    }

    sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in sendFinanceReport: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tạo báo cáo.');
  }
}

/**
 * Send schedule report
 */
function sendScheduleReport(chatId) {
  try {
    const schedules = getAllSchedules();

    if (schedules.length === 0) {
      sendMessage(chatId, '📅 *BÁO CÁO LỊCH HỌC*\n\nChưa có lịch học nào.', { parse_mode: 'Markdown' });
      return;
    }

    // By type
    const byType = groupBy(schedules, 'loaiBuoiHoc');

    // By status
    const byStatus = groupBy(schedules, 'trangThai');

    let message = `📅 *BÁO CÁO LỊCH HỌC*\n\n`;
    message += `Tổng số: ${schedules.length} buổi học\n\n`;

    message += `*Theo loại:*\n`;
    Object.keys(byType).forEach(type => {
      const count = byType[type].length;
      message += `${type}: ${count}\n`;
    });

    message += `\n*Theo trạng thái:*\n`;
    Object.keys(byStatus).forEach(status => {
      const count = byStatus[status].length;
      const percent = Math.round((count / schedules.length) * 100);
      message += `${status}: ${count} (${percent}%)\n`;
    });

    sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in sendScheduleReport: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tạo báo cáo.');
  }
}

/**
 * Send exam report
 */
function sendExamReport(chatId) {
  try {
    const exams = getAllExams();

    if (exams.length === 0) {
      sendMessage(chatId, '🎓 *BÁO CÁO KỲ THI*\n\nChưa có kỳ thi nào.', { parse_mode: 'Markdown' });
      return;
    }

    // By type
    const byType = groupBy(exams, 'examType');

    // By result
    const byResult = groupBy(exams, 'result');

    // Pass rate
    const completed = exams.filter(e => e.result === 'Đạt' || e.result === 'Không đạt');
    const passed = exams.filter(e => e.result === 'Đạt').length;
    const passRate = completed.length > 0 ? Math.round((passed / completed.length) * 100) : 0;

    let message = `🎓 *BÁO CÁO KỲ THI*\n\n`;
    message += `Tổng số: ${exams.length} kỳ thi\n`;
    message += `Đã hoàn thành: ${completed.length}\n`;
    message += `Tỷ lệ đạt: ${passRate}%\n\n`;

    message += `*Theo loại thi:*\n`;
    Object.keys(byType).forEach(type => {
      const count = byType[type].length;
      message += `${type}: ${count}\n`;
    });

    message += `\n*Theo kết quả:*\n`;
    Object.keys(byResult).forEach(result => {
      const count = byResult[result].length;
      const icon = getExamStatusIcon(result);
      message += `${icon} ${result}: ${count}\n`;
    });

    sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in sendExamReport: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tạo báo cáo.');
  }
}

/**
 * Send vehicle report
 */
function sendVehicleReport(chatId) {
  try {
    const vehicles = getAllVehicles();

    if (vehicles.length === 0) {
      sendMessage(chatId, '🚗 *BÁO CÁO XE TẬP*\n\nChưa có xe nào.', { parse_mode: 'Markdown' });
      return;
    }

    // By license type
    const byLicense = groupBy(vehicles, 'loaiBang');

    // By status
    const byStatus = groupBy(vehicles, 'trangThai');

    let message = `🚗 *BÁO CÁO XE TẬP*\n\n`;
    message += `Tổng số: ${vehicles.length} xe\n\n`;

    message += `*Theo loại bằng:*\n`;
    Object.keys(byLicense).sort().forEach(license => {
      const count = byLicense[license].length;
      message += `🎓 ${license}: ${count}\n`;
    });

    message += `\n*Theo trạng thái:*\n`;
    Object.keys(byStatus).forEach(status => {
      const count = byStatus[status].length;
      const icon = status === 'Đang dùng' ? '✅' : '🔧';
      message += `${icon} ${status}: ${count}\n`;
    });

    sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    Logger.log('Error in sendVehicleReport: ' + error);
    sendMessage(chatId, '❌ Có lỗi khi tạo báo cáo.');
  }
}

/**
 * Get all payments
 */
function getAllPayments() {
  const sheet = getPaymentSheet();
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  // Columns theo đúng thứ tự headers trong sheet THANH TOÁN (xem createPayment):
  // A ID giao dịch, B Ngày giờ, C Loại, D Khoản mục, E ID học viên, F Họ tên,
  // G Số tiền, H Hình thức, I Người thu/chi, J Biên lai, K Ghi chú, L Ngày tạo
  const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();

  return data
    .filter(row => row[0])
    .map(row => ({
      maGiaoDich: row[0],
      ngayGio: row[1],
      loai: row[2],
      khoanMuc: row[3],
      maHocVien: row[4],
      hoTen: row[5],
      soTien: Number(row[6]) || 0,
      hinhThuc: row[7],
      nguoiThu: row[8],
      bienLai: row[9],
      ghiChu: row[10],
      ngayTao: row[11]
    }));
}
