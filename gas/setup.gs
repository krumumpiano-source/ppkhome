/**
 * setup.gs — ฟังก์ชัน Setup ระบบครั้งแรก
 * สร้าง Header Rows และข้อมูลเริ่มต้น
 * เรียกใช้ครั้งเดียวเมื่อ deploy ครั้งแรก
 */

/**
 * สร้าง Header Rows สำหรับทุก Sheet
 */
function setupSheetHeaders() {
  var ss = getSpreadsheet();
  if (!ss) {
    Logger.log('ERROR: ไม่พบ Spreadsheet');
    return { success: false, message: 'ไม่พบ Spreadsheet' };
  }
  
  var results = [];
  
  // Users Sheet
  var usersSheet = ss.getSheetByName('Users');
  if (usersSheet && usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(['userId', 'email', 'passwordHash', 'fullName', 'phone', 'role', 'unitId', 'status', 'householdMembers', 'mustChangePassword', 'createdAt', 'updatedAt']);
    results.push('Users: Header created');
  }
  
  // Units Sheet
  var unitsSheet = ss.getSheetByName('Units');
  if (unitsSheet && unitsSheet.getLastRow() === 0) {
    unitsSheet.appendRow(['unitId', 'type', 'status', 'notes']);
    results.push('Units: Header created');
  }
  
  // SysConfig Sheet
  var sysConfigSheet = ss.getSheetByName('SysConfig');
  if (sysConfigSheet && sysConfigSheet.getLastRow() === 0) {
    sysConfigSheet.appendRow(['key', 'value']);
    results.push('SysConfig: Header created');
  }
  
  // WaterReadings Sheet
  var waterSheet = ss.getSheetByName('WaterReadings');
  if (waterSheet && waterSheet.getLastRow() === 0) {
    waterSheet.appendRow(['roundId', 'unitId', 'prevReading', 'prevDate', 'currentReading', 'amount', 'note']);
    results.push('WaterReadings: Header created');
  }
  
  // ElectricReadings Sheet
  var electricSheet = ss.getSheetByName('ElectricReadings');
  if (electricSheet && electricSheet.getLastRow() === 0) {
    electricSheet.appendRow(['roundId', 'unitId', 'amount', 'date', 'total', 'userId']);
    results.push('ElectricReadings: Header created');
  }
  
  // BillingRounds Sheet
  var billingRoundsSheet = ss.getSheetByName('BillingRounds');
  if (billingRoundsSheet && billingRoundsSheet.getLastRow() === 0) {
    billingRoundsSheet.appendRow(['roundId', 'month', 'year', 'status', 'billingDate']);
    results.push('BillingRounds: Header created');
  }
  
  // Payments Sheet
  var paymentsSheet = ss.getSheetByName('Payments');
  if (paymentsSheet && paymentsSheet.getLastRow() === 0) {
    paymentsSheet.appendRow(['roundId', 'unitId', 'amount', 'date', 'userId', 'verified', 'note', 'slipDataUrl']);
    results.push('Payments: Header created');
  }
  
  // CentralLedger Sheet
  var ledgerSheet = ss.getSheetByName('CentralLedger');
  if (ledgerSheet && ledgerSheet.getLastRow() === 0) {
    ledgerSheet.appendRow(['roundId', 'date', 'type', 'description', 'amount']);
    results.push('CentralLedger: Header created');
  }
  
  // Applications Sheet
  var appsSheet = ss.getSheetByName('Applications');
  if (appsSheet && appsSheet.getLastRow() === 0) {
    appsSheet.appendRow(['applicationId', 'fullName', 'email', 'phone', 'reason', 'status', 'submittedAt']);
    results.push('Applications: Header created');
  }
  
  // Queue Sheet
  var queueSheet = ss.getSheetByName('Queue');
  if (queueSheet && queueSheet.getLastRow() === 0) {
    queueSheet.appendRow(['applicationId', 'order', 'status', 'createdAt', 'expiry']);
    results.push('Queue: Header created');
  }
  
  // AboutContent Sheet
  var aboutSheet = ss.getSheetByName('AboutContent');
  if (aboutSheet && aboutSheet.getLastRow() === 0) {
    aboutSheet.appendRow(['sectionId', 'title', 'body', 'imageUrl', 'visible', 'order']);
    results.push('AboutContent: Header created');
  }
  
  // AuditLog Sheet
  var auditSheet = ss.getSheetByName('AuditLog');
  if (auditSheet && auditSheet.getLastRow() === 0) {
    auditSheet.appendRow(['timestamp', 'userId', 'action', 'detail']);
    results.push('AuditLog: Header created');
  }
  
  // RegistrationRequests Sheet
  var regSheet = ss.getSheetByName('RegistrationRequests');
  if (regSheet && regSheet.getLastRow() === 0) {
    regSheet.appendRow(['requestId', 'fullName', 'email', 'phone', 'status', 'requestedAt']);
    results.push('RegistrationRequests: Header created');
  }
  
  // RepairRequests Sheet
  var repairSheet = ss.getSheetByName('RepairRequests');
  if (repairSheet && repairSheet.getLastRow() === 0) {
    repairSheet.appendRow(['requestId', 'unitId', 'type', 'note', 'status', 'requestedAt']);
    results.push('RepairRequests: Header created');
  }
  
  return { success: true, results: results };
}

/**
 * สร้างข้อมูลเริ่มต้นสำหรับ Units (บ้าน 1-17, แฟลต F1-F16)
 */
function setupInitialUnits() {
  var sheet = getSheet('UNITS');
  if (!sheet) return { success: false, message: 'ไม่พบ Sheet Units' };
  
  var data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    return { success: true, message: 'Units มีข้อมูลอยู่แล้ว', count: data.length - 1 };
  }
  
  var units = [];
  
  // บ้านพัก 1-17
  for (var i = 1; i <= CONFIG.HOUSING_COUNT; i++) {
    units.push([String(i), 'house', 'vacant', '']);
  }
  
  // แฟลต F1-F16
  for (var j = 1; j <= CONFIG.FLAT_COUNT; j++) {
    units.push([CONFIG.FLAT_PREFIX + j, 'flat', 'vacant', '']);
  }
  
  if (units.length > 0) {
    sheet.getRange(2, 1, units.length, 4).setValues(units);
  }
  
  return { success: true, message: 'สร้าง Units เริ่มต้นเรียบร้อย', count: units.length };
}

/**
 * สร้างข้อมูลเริ่มต้นสำหรับ SysConfig
 */
function setupInitialSysConfig() {
  var sheet = getSheet('SYS_CONFIG');
  if (!sheet) return { success: false, message: 'ไม่พบ Sheet SysConfig' };
  
  var data = sheet.getDataRange().getValues();
  var existingKeys = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) existingKeys[data[i][0]] = true;
  }
  
  var configs = [];
  
  if (!existingKeys['waterRate']) {
    configs.push(['waterRate', CONFIG.DEFAULT_WATER_RATE]);
  }
  if (!existingKeys['commonFee']) {
    configs.push(['commonFee', CONFIG.DEFAULT_COMMON_FEE]);
  }
  if (!existingKeys['vacantMeterFee']) {
    configs.push(['vacantMeterFee', CONFIG.DEFAULT_VACANT_METER_FEE]);
  }
  if (!existingKeys['approvalEnabled']) {
    configs.push(['approvalEnabled', 'true']);
  }
  if (!existingKeys['holidayDates']) {
    configs.push(['holidayDates', '']);
  }
  
  if (configs.length > 0) {
    var startRow = data.length + 1;
    sheet.getRange(startRow, 1, configs.length, 2).setValues(configs);
  }
  
  return { success: true, message: 'สร้าง SysConfig เริ่มต้นเรียบร้อย', count: configs.length };
}

/**
 * สร้างข้อมูลเริ่มต้นสำหรับ AboutContent
 */
function setupInitialAboutContent() {
  var sheet = getSheet('ABOUT_CONTENT');
  if (!sheet) return { success: false, message: 'ไม่พบ Sheet AboutContent' };
  
  var data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    return { success: true, message: 'AboutContent มีข้อมูลอยู่แล้ว' };
  }
  
  var sections = [
    ['basic', 'ข้อมูลพื้นฐาน', 'จำนวนบ้านพัก 17 หลัง (เลข 1–17) จำนวนแฟลต 16 ยูนิต (F1–F16) หน่วยงานที่กำกับดูแลตามที่ตั้งค่าในระบบ', '', true, 1],
    ['policy', 'ขอบเขตการใช้บ้านพัก', 'ใช้เพื่อการบริหารจัดการที่พักอาศัยของบุคลากรตามนโยบายหน่วยงาน', '', true, 2]
  ];
  
  if (sections.length > 0) {
    sheet.getRange(2, 1, sections.length, 6).setValues(sections);
  }
  
  return { success: true, message: 'สร้าง AboutContent เริ่มต้นเรียบร้อย', count: sections.length };
}

/**
 * Setup ระบบทั้งหมด (เรียกครั้งเดียว)
 */
function setupSystem() {
  try {
    var results = [];
    
    // 1. สร้าง Header Rows
    var headerResult = setupSheetHeaders();
    if (headerResult.success) {
      results = results.concat(headerResult.results);
    }
    
    // 2. สร้าง Units เริ่มต้น
    var unitsResult = setupInitialUnits();
    if (unitsResult.success) {
      results.push('Units: ' + unitsResult.count + ' units created');
    }
    
    // 3. สร้าง SysConfig เริ่มต้น
    var configResult = setupInitialSysConfig();
    if (configResult.success) {
      results.push('SysConfig: ' + configResult.count + ' configs created');
    }
    
    // 4. สร้าง AboutContent เริ่มต้น
    var aboutResult = setupInitialAboutContent();
    if (aboutResult.success) {
      results.push('AboutContent: ' + aboutResult.count + ' sections created');
    }
    
    return {
      success: true,
      message: 'Setup ระบบเรียบร้อย',
      results: results
    };
  } catch (e) {
    Logger.log('setupSystem error: ' + e.message);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + e.message
    };
  }
}

/**
 * ฟังก์ชัน Helper สำหรับสร้าง Admin คนแรก (รันใน Editor)
 * เรียกใช้: createMyAdmin()
 */
function createMyAdmin() {
  return createFirstAdmin(
    'pongsatoorn.b@ppk.ac.th',
    'Abcd1234*',
    'Pongsatoorn B.'
  );
}

/**
 * สร้างผู้ใช้ Admin คนแรก (เรียกใช้แยก)
 * @param {string} email - อีเมล
 * @param {string} password - รหัสผ่าน (plain text)
 * @param {string} fullName - ชื่อ-นามสกุล
 */
function createFirstAdmin(email, password, fullName) {
  if (!email || !password || !fullName) {
    return { success: false, message: 'กรุณากรอกอีเมล รหัสผ่าน และชื่อให้ครบ' };
  }
  
  var sheet = getSheet('USERS');
  if (!sheet) return { success: false, message: 'ไม่พบ Sheet Users' };
  
  // ตรวจสอบว่ามี email ซ้ำหรือไม่
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var emailCol = headers.indexOf('email');
  
  if (emailCol >= 0) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][emailCol]).toLowerCase() === String(email).toLowerCase()) {
        return { success: false, message: 'อีเมลนี้มีอยู่แล้ว' };
      }
    }
  }
  
  // Hash password (ใช้ฟังก์ชันจาก auth.gs)
  // ต้อง import hashPassword จาก auth.gs หรือเรียกใช้โดยตรง
  var hash = hashPassword(password);
  
  // สร้าง userId
  var userId = 'admin_' + Date.now();
  
  // สร้าง row
  var row = [
    userId,
    email,
    hash,
    fullName,
    '',
    CONFIG.ROLES.ADMIN,
    '',
    'active',
    '',
    false, // mustChangePassword
    new Date(),
    new Date()
  ];
  
  // ถ้ายังไม่มี header ให้สร้างก่อน
  if (data.length === 0) {
    sheet.appendRow(['userId', 'email', 'passwordHash', 'fullName', 'phone', 'role', 'unitId', 'status', 'householdMembers', 'mustChangePassword', 'createdAt', 'updatedAt']);
  }
  
  sheet.appendRow(row);
  
  return {
    success: true,
    message: 'สร้างผู้ใช้ Admin เรียบร้อย',
    userId: userId,
    email: email
  };
}
