/**
 * config.gs — การตั้งค่าระบบ (ไม่ hardcode ข้อมูลบุคคล)
 * ระบบบริหารจัดการบ้านพักครู
 */

var CONFIG = {
  /** ID ของ Google Spreadsheet หลัก */
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY',
  
  /** Google Drive Folder IDs สำหรับเก็บไฟล์ */
  DRIVE_FOLDERS: {
    PAYMENT_SLIPS: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_PAYMENT_SLIPS') || '1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF',
    ABOUT_IMAGES: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ABOUT_IMAGES') || '1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ',
    EXPORTS: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_EXPORTS') || '1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg'
  },
  
  /** ชื่อชีตใน Spreadsheet */
  SHEETS: {
    USERS: 'Users',
    UNITS: 'Units',
    SYS_CONFIG: 'SysConfig',
    WATER_READINGS: 'WaterReadings',
    ELECTRIC_READINGS: 'ElectricReadings',
    BILLING_ROUNDS: 'BillingRounds',
    PAYMENTS: 'Payments',
    CENTRAL_LEDGER: 'CentralLedger',
    APPLICATIONS: 'Applications',
    QUEUE: 'Queue',
    ABOUT_CONTENT: 'AboutContent',
    AUDIT_LOG: 'AuditLog',
    REGISTRATION_REQUESTS: 'RegistrationRequests',
    REPAIR_REQUESTS: 'RepairRequests'
  },
  
  /** โครงสร้างทรัพย์สิน (Fixed) — ตาม REQUIREMENTS §2 */
  HOUSING_COUNT: 17,
  FLAT_PREFIX: 'F',
  FLAT_COUNT: 16,
  
  /** บทบาท (Roles) — ตาม REQUIREMENTS §4 */
  ROLES: {
    RESIDENT: 'resident',
    COMMITTEE: 'committee',
    ACCOUNTING: 'accounting',
    ADMIN: 'admin',
    DEPUTY_ADMIN: 'deputy_admin',
    EXECUTIVE: 'executive',
    APPLICANT: 'applicant'
  },
  
  /** ค่าเริ่มต้น (อ่านจาก Sheet ถ้ามี) */
  DEFAULT_WATER_RATE: 9,
  DEFAULT_VACANT_METER_FEE: 9,
  DEFAULT_COMMON_FEE: 0
};

/**
 * ดึง Spreadsheet หลัก
 */
function getSpreadsheet() {
  var id = CONFIG.SPREADSHEET_ID;
  if (!id) throw new Error('SPREADSHEET_ID ไม่ได้ตั้งค่าใน Script Properties');
  return SpreadsheetApp.openById(id);
}

/**
 * ดึงชีตตามชื่อ
 */
function getSheet(name) {
  return getSpreadsheet().getSheetByName(CONFIG.SHEETS[name]);
}

/**
 * อ่านค่าตั้งค่าจาก SysConfig (key-value)
 */
function getSysConfig(key) {
  var sheet = getSheet('SYS_CONFIG');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

/**
 * รายการหน่วยบ้าน (1-17) และแฟลต (F1-F16)
 */
function getUnitIds() {
  var house = [];
  for (var i = 1; i <= CONFIG.HOUSING_COUNT; i++) house.push(String(i));
  var flat = [];
  for (var j = 1; j <= CONFIG.FLAT_COUNT; j++) flat.push(CONFIG.FLAT_PREFIX + j);
  return { house: house, flat: flat };
}
