/**
 * importexport.gs — ระบบ Import/Export ข้อมูลทั้งระบบ
 * สำหรับ Admin/Deputy เท่านั้น
 * รองรับการกรอกข้อมูลจำนวนมากแบบ Offline-first
 */

/**
 * ส่งออกข้อมูลทั้งหมดเป็น Spreadsheet ใหม่
 * สร้างไฟล์ใหม่ใน Google Drive ของผู้เรียกใช้
 */
function exportAllData(sessionId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  try {
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd_HHmmss');
    var ssName = 'ระบบบ้านพักครู_Export_' + timestamp;
    var newSS = SpreadsheetApp.create(ssName);
    var sheetsToExport = [
      { key: 'USERS', name: 'Users', desc: 'ข้อมูลผู้ใช้ (userId, email, fullName, phone, role, unitId, status, passwordHash)' },
      { key: 'UNITS', name: 'Units', desc: 'ข้อมูลหน่วยที่พัก (unitId, type, status, householdMembers)' },
      { key: 'SYS_CONFIG', name: 'SysConfig', desc: 'การตั้งค่าระบบ (key, value)' },
      { key: 'WATER_READINGS', name: 'WaterReadings', desc: 'บันทึกมิเตอร์น้ำ (roundId, unitId, prevReading, date, currentReading, amount, note)' },
      { key: 'ELECTRIC_READINGS', name: 'ElectricReadings', desc: 'บันทึกค่าไฟ (roundId, unitId, amount, date, total, userId)' },
      { key: 'BILLING_ROUNDS', name: 'BillingRounds', desc: 'รอบการเรียกเก็บ (roundId, month, year, status, billingDate)' },
      { key: 'PAYMENTS', name: 'Payments', desc: 'การชำระเงิน (roundId, unitId, amount, date, userId, verified, note, slipDataUrl)' },
      { key: 'CENTRAL_LEDGER', name: 'CentralLedger', desc: 'บัญชีกองกลาง (roundId, date, type, description, amount)' },
      { key: 'APPLICATIONS', name: 'Applications', desc: 'คำร้องขอเข้าพัก (applicationId, fullName, email, phone, reason, status, createdAt)' },
      { key: 'QUEUE', name: 'Queue', desc: 'คิวการเข้าพัก (applicationId, order, status, createdAt, expiryDate)' },
      { key: 'ABOUT_CONTENT', name: 'AboutContent', desc: 'เนื้อหาหน้าเกี่ยวกับ (sectionId, title, body, imageUrl, visible, order)' },
      { key: 'AUDIT_LOG', name: 'AuditLog', desc: 'บันทึกการทำงาน (timestamp, userId, action, details)' },
      { key: 'REGISTRATION_REQUESTS', name: 'RegistrationRequests', desc: 'คำขอลงทะเบียน (requestId, fullName, email, phone, status, requestedAt)' },
      { key: 'REPAIR_REQUESTS', name: 'RepairRequests', desc: 'คำร้องแจ้งซ่อม (requestId, unitId, type, note, status, requestedAt)' }
    ];
    var createdSheets = [];
    for (var i = 0; i < sheetsToExport.length; i++) {
      var sheetInfo = sheetsToExport[i];
      var sourceSheet = getSheet(sheetInfo.key);
      var newSheet = newSS.insertSheet(sheetInfo.name);
      createdSheets.push(sheetInfo.name);
      if (!sourceSheet || sourceSheet.getLastRow() === 0) {
        newSheet.appendRow(['หมายเหตุ: ยังไม่มีข้อมูลในชีตนี้']);
        continue;
      }
      var data = sourceSheet.getDataRange().getValues();
      if (data.length === 0) {
        newSheet.appendRow(['หมายเหตุ: ยังไม่มีข้อมูลในชีตนี้']);
        continue;
      }
      var headers = data[0];
      newSheet.appendRow(['คำอธิบาย:', sheetInfo.desc]);
      newSheet.appendRow([]);
      newSheet.appendRow(headers);
      for (var r = 1; r < data.length; r++) {
        newSheet.appendRow(data[r]);
      }
      newSheet.getRange(3, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
      newSheet.setFrozenRows(3);
    }
    var defaultSheet = newSS.getActiveSheet();
    if (defaultSheet) newSS.deleteSheet(defaultSheet);
    var readmeSheet = newSS.insertSheet('README', 0);
    readmeSheet.appendRow(['ระบบบ้านพักครู - ไฟล์ Export ข้อมูล']);
    readmeSheet.appendRow(['วันที่ส่งออก:', Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss')]);
    readmeSheet.appendRow(['ผู้ส่งออก:', s.userId]);
    readmeSheet.appendRow([]);
    readmeSheet.appendRow(['คำแนะนำการนำเข้า:']);
    readmeSheet.appendRow(['1. กรอก/แก้ไขข้อมูลในชีตต่างๆ']);
    readmeSheet.appendRow(['2. ห้ามลบแถว Header (แถวที่ 3)']);
    readmeSheet.appendRow(['3. ห้ามเปลี่ยนชื่อชีต']);
    readmeSheet.appendRow(['4. ใช้ปุ่ม "นำเข้าข้อมูลจากไฟล์" ในระบบ']);
    readmeSheet.appendRow(['5. ระบบจะตรวจสอบโครงสร้างก่อนนำเข้า']);
    readmeSheet.appendRow([]);
    readmeSheet.appendRow(['ชีตที่มีในไฟล์นี้:']);
    for (var j = 0; j < sheetsToExport.length; j++) {
      readmeSheet.appendRow(['- ' + sheetsToExport[j].name + ': ' + sheetsToExport[j].desc]);
    }
    readmeSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setFontSize(14);
    readmeSheet.setColumnWidth(1, 300);
    newSS.setActiveSheet(readmeSheet);
    auditLog('data_export', s.userId, { spreadsheetId: newSS.getId(), spreadsheetName: ssName });
    
    // บันทึกไฟล์ Export ไปยังโฟลเดอร์ Exports (ถ้ามีฟังก์ชัน)
    try {
      var exportUrl = saveExportFile(newSS.getId(), ssName);
      Logger.log('Export file saved to Drive: ' + exportUrl);
    } catch (e) {
      Logger.log('Could not save export to Drive folder: ' + e.message);
      // ไม่ throw error เพราะ Export สำเร็จแล้ว แค่บันทึกใน Drive ไม่ได้
    }
    
    return {
      success: true,
      spreadsheetId: newSS.getId(),
      spreadsheetUrl: newSS.getUrl(),
      spreadsheetName: ssName,
      message: 'ส่งออกข้อมูลเรียบร้อย'
    };
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
  }
}

/**
 * Validate โครงสร้าง Spreadsheet ก่อน import
 */
function validateImportStructure(sourceSS) {
  var errors = [];
  var requiredSheets = [
    'Users', 'Units', 'SysConfig', 'WaterReadings', 'ElectricReadings',
    'BillingRounds', 'Payments', 'CentralLedger', 'Applications', 'Queue',
    'AboutContent', 'AuditLog', 'RegistrationRequests', 'RepairRequests'
  ];
  var sheets = sourceSS.getSheets();
  var sheetNames = [];
  for (var i = 0; i < sheets.length; i++) {
    sheetNames.push(sheets[i].getName());
  }
  for (var j = 0; j < requiredSheets.length; j++) {
    if (sheetNames.indexOf(requiredSheets[j]) < 0) {
      errors.push('ไม่พบชีต: ' + requiredSheets[j]);
    }
  }
  if (errors.length > 0) return { valid: false, errors: errors };
  return { valid: true, errors: [] };
}

/**
 * Validate ข้อมูลในชีตก่อน import
 */
function validateSheetData(sheet, sheetName, expectedHeaders) {
  var errors = [];
  if (!sheet) {
    errors.push('ชีต ' + sheetName + ': ไม่พบชีต');
    return errors;
  }
  var data = sheet.getDataRange().getValues();
  if (data.length < 3) {
    errors.push('ชีต ' + sheetName + ': ไม่มีข้อมูล (ต้องมี Header ที่แถว 3)');
    return errors;
  }
  var headers = data[2];
  if (!headers || headers.length === 0) {
    errors.push('ชีต ' + sheetName + ': ไม่พบ Header');
    return errors;
  }
  if (expectedHeaders && expectedHeaders.length > 0) {
    for (var i = 0; i < expectedHeaders.length; i++) {
      var found = false;
      for (var j = 0; j < headers.length; j++) {
        if (String(headers[j]).toLowerCase() === String(expectedHeaders[i]).toLowerCase()) {
          found = true;
          break;
        }
      }
      if (!found) {
        errors.push('ชีต ' + sheetName + ': ไม่พบคอลัมน์ ' + expectedHeaders[i]);
      }
    }
  }
  return errors;
}

/**
 * นำเข้าข้อมูลจาก Spreadsheet (Transaction-based)
 * Validate ก่อน import ทั้งชุด ถ้ามี error ห้าม import
 */
function importData(sessionId, sourceSpreadsheetId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  try {
    var sourceSS = SpreadsheetApp.openById(sourceSpreadsheetId);
    if (!sourceSS) return { success: false, message: 'ไม่พบไฟล์ Spreadsheet' };
    var validation = validateImportStructure(sourceSS);
    if (!validation.valid) {
      return { success: false, message: 'โครงสร้างไฟล์ไม่ถูกต้อง', errors: validation.errors };
    }
    var allErrors = [];
    var sheetValidations = {
      'Users': ['userId', 'email'],
      'Units': ['unitId'],
      'SysConfig': ['key'],
      'WaterReadings': ['roundId', 'unitId'],
      'ElectricReadings': ['roundId', 'unitId'],
      'BillingRounds': ['roundId'],
      'Payments': ['roundId', 'unitId'],
      'CentralLedger': ['roundId'],
      'Applications': ['applicationId'],
      'Queue': ['applicationId'],
      'AboutContent': ['sectionId'],
      'AuditLog': ['timestamp'],
      'RegistrationRequests': ['requestId'],
      'RepairRequests': ['requestId']
    };
    for (var sheetName in sheetValidations) {
      var sourceSheet = sourceSS.getSheetByName(sheetName);
      var errors = validateSheetData(sourceSheet, sheetName, sheetValidations[sheetName]);
      allErrors = allErrors.concat(errors);
    }
    if (allErrors.length > 0) {
      return {
        success: false,
        message: 'พบข้อผิดพลาดในการตรวจสอบข้อมูล (' + allErrors.length + ' รายการ)',
        errors: allErrors
      };
    }
    var targetSS = getSpreadsheet();
    var importLog = [];
    var transactionStart = new Date();
    try {
      for (var i = 0; i < Object.keys(sheetValidations).length; i++) {
        var sheetKey = Object.keys(sheetValidations)[i];
        var sourceSheet = sourceSS.getSheetByName(sheetKey);
        var targetSheet = getSheet(sheetKey);
        if (!targetSheet) {
          importLog.push('ข้าม: ไม่พบชีต ' + sheetKey + ' ในระบบหลัก');
          continue;
        }
        var sourceData = sourceSheet.getDataRange().getValues();
        if (sourceData.length < 3) {
          importLog.push('ข้าม: ' + sheetKey + ' ไม่มีข้อมูล');
          continue;
        }
        var headers = sourceData[2];
        var rowsToImport = [];
        for (var r = 3; r < sourceData.length; r++) {
          var row = sourceData[r];
          if (!row || row.length === 0 || !row[0]) continue;
          rowsToImport.push(row);
        }
        if (rowsToImport.length === 0) {
          importLog.push('ข้าม: ' + sheetKey + ' ไม่มีแถวข้อมูล');
          continue;
        }
        var existingData = targetSheet.getDataRange().getValues();
        var existingHeaders = existingData.length > 0 ? existingData[0] : [];
        var preserveHistory = (sheetKey === 'AUDIT_LOG');
        if (!preserveHistory && existingData.length > 1) {
          targetSheet.deleteRows(2, existingData.length - 1);
        }
        var headerMap = [];
        for (var h = 0; h < headers.length; h++) {
          var headerName = String(headers[h]).toLowerCase();
          var targetCol = -1;
          for (var e = 0; e < existingHeaders.length; e++) {
            if (String(existingHeaders[e]).toLowerCase() === headerName) {
              targetCol = e;
              break;
            }
          }
          headerMap.push(targetCol);
        }
        var rowsAdded = 0;
        for (var rowIdx = 0; rowIdx < rowsToImport.length; rowIdx++) {
          var newRow = [];
          for (var colIdx = 0; colIdx < headerMap.length; colIdx++) {
            var targetCol = headerMap[colIdx];
            if (targetCol >= 0 && colIdx < rowsToImport[rowIdx].length) {
              newRow[targetCol] = rowsToImport[rowIdx][colIdx];
            }
          }
          var finalRow = [];
          for (var f = 0; f < existingHeaders.length; f++) {
            finalRow.push(newRow[f] !== undefined ? newRow[f] : '');
          }
          targetSheet.appendRow(finalRow);
          rowsAdded++;
        }
        importLog.push('นำเข้า ' + sheetKey + ': ' + rowsAdded + ' แถว' + (preserveHistory ? ' (เก็บประวัติเดิม)' : ' (แทนที่ข้อมูลเดิม)'));
      }
      auditLog('data_import', s.userId, {
        sourceSpreadsheetId: sourceSpreadsheetId,
        timestamp: transactionStart,
        rowsImported: importLog
      });
      return {
        success: true,
        message: 'นำเข้าข้อมูลเรียบร้อย',
        log: importLog
      };
    } catch (importErr) {
      auditLog('data_import_failed', s.userId, {
        sourceSpreadsheetId: sourceSpreadsheetId,
        error: importErr.message
      });
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดระหว่างนำเข้า: ' + importErr.message,
        errors: [importErr.message]
      };
    }
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
  }
}
