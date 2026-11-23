/**
 * SCHEDULE MANAGEMENT - Quản lý lịch học
 */

const SCHEDULE_SHEET = 'LỊCH HỌC';

/**
 * Get schedule sheet
 */
function getScheduleSheet() {
  return getDb().getSheetByName(SCHEDULE_SHEET);
}

/**
 * Generate next schedule ID
 */
function getNextScheduleId() {
  const sheet = getScheduleSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return 'SCH001';
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];
    if (!id || id === '') continue;

    const idStr = id.toString();
    if (idStr.startsWith('SCH')) {
      const num = parseInt(idStr.replace('SCH', ''));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return 'SCH' + nextNum.toString().padStart(3, '0');
}

/**
 * Create new schedule
 */
function createSchedule(data) {
  const sheet = getScheduleSheet();
  const scheduleId = getNextScheduleId();
  const now = getCurrentTimestamp();

  // Columns: ID buổi học, Ngày, Giờ bắt đầu, Giờ kết thúc, ID học viên,
  // Họ tên (formula), Loại bằng (formula), Loại buổi học, Nội dung,
  // Địa chỉ đón, Địa chỉ trả, Biển số xe, Loại xe (formula), Trạng thái,
  // Giáo viên, Đánh giá, Ghi chú, Ngày tạo, Ngày cập nhật

  const row = [
    scheduleId,                    // A: ID buổi học
    data.ngay,                     // B: Ngày
    data.gioBatDau,                // C: Giờ bắt đầu
    data.gioKetThuc,               // D: Giờ kết thúc
    data.maHocVien,                // E: ID học viên
    '',                            // F: Họ tên (formula tự động)
    '',                            // G: Loại bằng (formula tự động)
    data.loaiBuoiHoc,              // H: Loại buổi học
    data.noiDung || '',            // I: Nội dung
    data.diaChiDon || '',          // J: Địa chỉ đón
    data.diaChiTra || '',          // K: Địa chỉ trả
    data.bienSoXe || '',           // L: Biển số xe
    '',                            // M: Loại xe (formula tự động)
    'Chưa học',                    // N: Trạng thái
    data.giaoVien || '',           // O: Giáo viên
    '',                            // P: Đánh giá
    data.ghiChu || '',             // Q: Ghi chú
    now,                           // R: Ngày tạo
    now                            // S: Ngày cập nhật
  ];

  sheet.appendRow(row);
  return scheduleId;
}

/**
 * Get schedules by date range
 */
function getSchedulesByDateRange(startDate, endDate) {
  const sheet = getScheduleSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
  const schedules = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (!row[0]) continue; // Skip empty rows

    // Parse date (column B - index 1)
    const scheduleDate = new Date(row[1]);

    if (scheduleDate >= startDate && scheduleDate <= endDate) {
      // Format time fields (columns C, D are stored as Date objects)
      const gioBatDau = typeof row[2] === 'string' ? row[2] :
        Utilities.formatDate(new Date(row[2]), 'Asia/Ho_Chi_Minh', 'HH:mm');
      const gioKetThuc = typeof row[3] === 'string' ? row[3] :
        Utilities.formatDate(new Date(row[3]), 'Asia/Ho_Chi_Minh', 'HH:mm');

      schedules.push({
        id: row[0],
        ngay: row[1],
        gioBatDau: gioBatDau,
        gioKetThuc: gioKetThuc,
        maHocVien: row[4],
        hoTen: row[5],
        loaiBang: row[6],
        loaiBuoiHoc: row[7],
        noiDung: row[8],
        diaChiDon: row[9],
        diaChiTra: row[10],
        bienSoXe: row[11],
        loaiXe: row[12],
        trangThai: row[13],
        giaoVien: row[14],
        danhGia: row[15],
        ghiChu: row[16],
        ngayTao: row[17],
        ngayCapNhat: row[18]
      });
    }
  }

  // Sort by date, then time
  schedules.sort((a, b) => {
    const dateCompare = new Date(a.ngay) - new Date(b.ngay);
    if (dateCompare !== 0) return dateCompare;
    return a.gioBatDau.localeCompare(b.gioBatDau);
  });

  return schedules;
}

/**
 * Get today's schedules
 */
function getTodaySchedules() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getSchedulesByDateRange(today, tomorrow);
}

/**
 * Get this week's schedules
 */
function getWeekSchedules() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return getSchedulesByDateRange(today, nextWeek);
}

/**
 * Get all schedules
 */
function getAllSchedules() {
  const sheet = getScheduleSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
  const schedules = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (!row[0]) continue; // Skip empty rows

    // Format time fields
    const gioBatDau = typeof row[2] === 'string' ? row[2] :
      Utilities.formatDate(new Date(row[2]), 'Asia/Ho_Chi_Minh', 'HH:mm');
    const gioKetThuc = typeof row[3] === 'string' ? row[3] :
      Utilities.formatDate(new Date(row[3]), 'Asia/Ho_Chi_Minh', 'HH:mm');

    schedules.push({
      id: row[0],
      ngayHoc: row[1],
      gioBatDau: gioBatDau,
      gioKetThuc: gioKetThuc,
      maHocVien: row[4],
      hoTen: row[5],
      loaiBang: row[6],
      loaiBuoiHoc: row[7],
      noiDung: row[8],
      diaChiDon: row[9],
      diaChiTra: row[10],
      bienSoXe: row[11],
      loaiXe: row[12],
      trangThai: row[13],
      giaoVien: row[14],
      danhGia: row[15],
      ghiChu: row[16],
      ngayTao: row[17],
      ngayCapNhat: row[18]
    });
  }

  return schedules;
}

/**
 * Get schedules by student
 */
function getScheduleByStudent(studentId) {
  const allSchedules = getAllSchedules();
  return allSchedules.filter(s => s.maHocVien === studentId);
}
