/**
 * VEHICLE MANAGEMENT - Quản lý xe
 */

const VEHICLE_SHEET = 'QUẢN LÝ XE';

/**
 * Get vehicle sheet
 */
function getVehicleSheet() {
  return getDb().getSheetByName(VEHICLE_SHEET);
}

/**
 * Get all vehicles
 */
function getAllVehicles() {
  const sheet = getVehicleSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
  const vehicles = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (!row[0]) continue; // Skip empty rows

    vehicles.push({
      bienSo: row[0],
      loaiBang: row[1],
      loaiXe: row[2],
      hang: row[3],
      dongXe: row[4],
      namSanXuat: row[5],
      kmHienTai: row[6],
      trangThai: row[7],
      ngayDangKiemCuoi: row[8],
      ngayDangKiemTiepTheo: row[9],
      ngayBaoDuongCuoi: row[10],
      kmBaoDuongTiepTheo: row[11],
      chiPhiBaoTri: row[12],
      ghiChu: row[13],
      ngayTao: row[14],
      ngayCapNhat: row[15]
    });
  }

  return vehicles;
}

/**
 * Create new vehicle
 */
function createVehicle(data) {
  const sheet = getVehicleSheet();
  const now = getCurrentTimestamp();

  // Columns: Biển số, Phù hợp bằng, Loại xe, Hãng, Dòng xe, Năm sản xuất,
  // Km hiện tại, Trạng thái, Ngày đăng kiểm cuối, Ngày đăng kiểm tiếp theo,
  // Ngày bảo dưỡng cuối, Km bảo dưỡng tiếp theo, Chi phí bảo trì (tháng),
  // Ghi chú, Ngày tạo, Ngày cập nhật

  const row = [
    data.bienSo,                    // A: Biển số
    data.loaiBang,                  // B: Phù hợp bằng
    data.loaiXe,                    // C: Loại xe
    data.hang || '',                // D: Hãng
    data.dongXe || '',              // E: Dòng xe
    data.namSanXuat || '',          // F: Năm sản xuất
    data.kmHienTai || 0,            // G: Km hiện tại
    'Đang dùng',                    // H: Trạng thái
    data.ngayDangKiemCuoi || '',    // I: Ngày đăng kiểm cuối
    data.ngayDangKiemTiepTheo || '',// J: Ngày đăng kiểm tiếp theo
    '',                             // K: Ngày bảo dưỡng cuối
    data.kmBaoDuongTiepTheo || '',  // L: Km bảo dưỡng tiếp theo
    data.chiPhiBaoTri || '',        // M: Chi phí bảo trì
    data.ghiChu || '',              // N: Ghi chú
    now,                            // O: Ngày tạo
    now                             // P: Ngày cập nhật
  ];

  sheet.appendRow(row);
  return data.bienSo;
}
