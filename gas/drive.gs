/**
 * drive.gs — จัดการไฟล์ใน Google Drive
 * อัปโหลดสลิปการชำระเงิน รูปภาพ และไฟล์ Export
 */

/**
 * อัปโหลดสลิปการชำระเงิน (Base64 → Google Drive File)
 * @param {string} base64Data - Base64 string ของรูปภาพ
 * @param {string} roundId - รอบการเรียกเก็บ
 * @param {string} unitId - รหัสหน่วย
 * @param {string} userId - ผู้ชำระเงิน
 * @return {string} URL ของไฟล์ใน Google Drive
 */
function uploadPaymentSlip(base64Data, roundId, unitId, userId) {
  try {
    var folderId = CONFIG.DRIVE_FOLDERS.PAYMENT_SLIPS;
    var folder = DriveApp.getFolderById(folderId);
    if (!folder) {
      throw new Error('ไม่พบโฟลเดอร์ PaymentSlips');
    }
    
    // แปลง Base64 เป็น Blob
    var base64Content = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    var contentType = base64Data.indexOf('data:image/png') === 0 ? 'image/png' : 'image/jpeg';
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType);
    
    // สร้างชื่อไฟล์
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd_HHmmss');
    var fileName = 'slip_' + roundId + '_' + unitId + '_' + timestamp + '.' + (contentType === 'image/png' ? 'png' : 'jpg');
    
    // อัปโหลดไฟล์
    var file = folder.createFile(blob);
    file.setName(fileName);
    
    // ตั้งค่า Permissions (ให้ทุกคนที่มีลิงก์สามารถดูได้)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    Logger.log('uploadPaymentSlip error: ' + e.message);
    throw new Error('ไม่สามารถอัปโหลดสลิปได้: ' + e.message);
  }
}

/**
 * อัปโหลดรูปภาพหน้าเกี่ยวกับ (Base64 → Google Drive File)
 * @param {string} base64Data - Base64 string ของรูปภาพ
 * @param {string} sectionId - ID ของ section
 * @return {string} URL ของไฟล์ใน Google Drive
 */
function uploadAboutImage(base64Data, sectionId) {
  try {
    var folderId = CONFIG.DRIVE_FOLDERS.ABOUT_IMAGES;
    var folder = DriveApp.getFolderById(folderId);
    if (!folder) {
      throw new Error('ไม่พบโฟลเดอร์ AboutImages');
    }
    
    // แปลง Base64 เป็น Blob
    var base64Content = base64Data.replace(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, '');
    var contentType = 'image/jpeg';
    if (base64Data.indexOf('data:image/png') === 0) contentType = 'image/png';
    else if (base64Data.indexOf('data:image/gif') === 0) contentType = 'image/gif';
    else if (base64Data.indexOf('data:image/webp') === 0) contentType = 'image/webp';
    
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType);
    
    // สร้างชื่อไฟล์
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd_HHmmss');
    var ext = contentType.split('/')[1];
    var fileName = 'about_' + (sectionId || 'img') + '_' + timestamp + '.' + ext;
    
    // อัปโหลดไฟล์
    var file = folder.createFile(blob);
    file.setName(fileName);
    
    // ตั้งค่า Permissions
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    Logger.log('uploadAboutImage error: ' + e.message);
    throw new Error('ไม่สามารถอัปโหลดรูปภาพได้: ' + e.message);
  }
}

/**
 * สร้างไฟล์ Export ในโฟลเดอร์ Exports
 * @param {string} spreadsheetId - ID ของ Spreadsheet ที่ export
 * @param {string} exportName - ชื่อไฟล์
 * @return {string} URL ของไฟล์ใน Google Drive
 */
function saveExportFile(spreadsheetId, exportName) {
  try {
    var folderId = CONFIG.DRIVE_FOLDERS.EXPORTS;
    var folder = DriveApp.getFolderById(folderId);
    if (!folder) {
      throw new Error('ไม่พบโฟลเดอร์ Exports');
    }
    
    var ss = SpreadsheetApp.openById(spreadsheetId);
    if (!ss) {
      throw new Error('ไม่พบ Spreadsheet');
    }
    
    // คัดลอกไฟล์ไปยังโฟลเดอร์ Exports
    var file = DriveApp.getFileById(spreadsheetId);
    var copiedFile = file.makeCopy(exportName, folder);
    
    return copiedFile.getUrl();
  } catch (e) {
    Logger.log('saveExportFile error: ' + e.message);
    throw new Error('ไม่สามารถบันทึกไฟล์ Export ได้: ' + e.message);
  }
}

/**
 * ลบไฟล์เก่าในโฟลเดอร์ (สำหรับ cleanup)
 * @param {string} folderKey - 'PAYMENT_SLIPS', 'ABOUT_IMAGES', หรือ 'EXPORTS'
 * @param {number} daysOld - ลบไฟล์ที่เก่ากว่า X วัน (default: 365)
 */
function cleanupOldFiles(folderKey, daysOld) {
  try {
    daysOld = daysOld || 365;
    var folderId = CONFIG.DRIVE_FOLDERS[folderKey];
    if (!folderId) return;
    
    var folder = DriveApp.getFolderById(folderId);
    if (!folder) return;
    
    var files = folder.getFiles();
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    var deletedCount = 0;
    
    while (files.hasNext()) {
      var file = files.next();
      if (file.getDateCreated() < cutoffDate) {
        file.setTrashed(true);
        deletedCount++;
      }
    }
    
    Logger.log('Deleted ' + deletedCount + ' old files from ' + folderKey);
    return deletedCount;
  } catch (e) {
    Logger.log('cleanupOldFiles error: ' + e.message);
  }
}
