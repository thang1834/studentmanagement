/**
 * PAYMENT MANAGEMENT - Quản lý thanh toán
 */

const PAYMENT_SHEET = 'THANH TOÁN';

/**
 * Get payment sheet
 */
function getPaymentSheet() {
  return getDb().getSheetByName(PAYMENT_SHEET);
}

/**
 * Generate next payment ID
 */
function getNextPaymentId() {
  const sheet = getPaymentSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return 'PAY001';
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];
    if (!id || id === '') continue;

    const idStr = id.toString();
    if (idStr.startsWith('PAY')) {
      const num = parseInt(idStr.replace('PAY', ''));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return 'PAY' + nextNum.toString().padStart(3, '0');
}

/**
 * Create payment record
 */
function createPayment(data) {
  const sheet = getPaymentSheet();
  const paymentId = getNextPaymentId();
  const now = getCurrentTimestamp();

  // Columns: ID giao dịch, Ngày giờ, Loại, Khoản mục, ID học viên,
  // Họ tên (formula), Số tiền (VNĐ), Hình thức, Người thu/chi,
  // Biên lai/Hóa đơn, Ghi chú, Ngày tạo

  const row = [
    paymentId,                    // A: ID giao dịch
    now,                          // B: Ngày giờ
    'Thu',                        // C: Loại (Thu/Chi)
    'Học phí',                    // D: Khoản mục
    data.maHocVien,               // E: ID học viên
    '',                           // F: Họ tên (formula tự động)
    data.soTien,                  // G: Số tiền
    data.hinhThuc || 'Tiền mặt', // H: Hình thức
    data.nguoiThu || '',          // I: Người thu
    data.bienLai || '',           // J: Biên lai
    data.ghiChu || '',            // K: Ghi chú
    now                           // L: Ngày tạo
  ];

  sheet.appendRow(row);

  // Update student's paid amount
  updateStudentPayment(data.maHocVien, data.soTien);

  return paymentId;
}

/**
 * Update student payment
 */
function updateStudentPayment(studentId, amount) {
  const sheet = getStudentSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return;

  // Find student row
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === studentId) {
      const rowNum = i + 2; // +2 because: 0-indexed + header row

      // Get current paid amount (column P - index 16)
      const currentPaid = sheet.getRange(rowNum, 16).getValue() || 0;
      const newPaid = Number(currentPaid) + Number(amount);

      // Update paid amount
      sheet.getRange(rowNum, 16).setValue(newPaid);

      // Update last modified time (column T - index 20)
      sheet.getRange(rowNum, 20).setValue(getCurrentTimestamp());

      break;
    }
  }
}

/**
 * Get students with debt
 */
function getStudentsWithDebt() {
  const students = getAllStudents();

  return students
    .filter(s => s.conNo > 0)
    .sort((a, b) => b.conNo - a.conNo); // Sort by debt descending
}
