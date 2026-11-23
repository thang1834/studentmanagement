/**
 * TEST VEHICLE FUNCTIONS
 */

/**
 * Test if vehicle sheet exists
 */
function testVehicleSheetExists() {
  const sheet = getVehicleSheet();

  if (!sheet) {
    Logger.log('❌ Vehicle sheet does not exist');
    return false;
  }

  const lastRow = sheet.getLastRow();
  Logger.log('✅ Vehicle sheet exists with ' + lastRow + ' rows');
  return true;
}

/**
 * Test create vehicle
 */
function testCreateVehicle() {
  Logger.log('=== TEST CREATE VEHICLE ===');

  const testData = {
    bienSo: '30A-TEST123',
    loaiBang: 'B2',
    loaiXe: 'Xe tự động'
  };

  try {
    const bienSo = createVehicle(testData);
    Logger.log('✅ Vehicle created successfully: ' + bienSo);

    // Verify
    const vehicles = getAllVehicles();
    const found = vehicles.find(v => v.bienSo === testData.bienSo);

    if (found) {
      Logger.log('✅ Vehicle found in sheet');
      Logger.log('License Type: ' + found.loaiBang);
      Logger.log('Vehicle Type: ' + found.loaiXe);
      Logger.log('Status: ' + found.trangThai);
    } else {
      Logger.log('❌ Vehicle not found in sheet');
    }

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * Test get all vehicles
 */
function testGetAllVehicles() {
  Logger.log('=== TEST GET ALL VEHICLES ===');

  try {
    const vehicles = getAllVehicles();
    Logger.log('Total vehicles: ' + vehicles.length);

    if (vehicles.length > 0) {
      Logger.log('\nFirst vehicle:');
      Logger.log(JSON.stringify(vehicles[0], null, 2));
    }

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}
