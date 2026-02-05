/**
 * users.gs — จัดการผู้ใช้และบทบาท (จาก Sheet เท่านั้น ไม่ hardcode)
 */

/**
 * ขอลงทะเบียนใช้งานระบบ (ไม่ต้อง login) — บันทึกลงชีต รอแอดมินอนุมัติ/แจ้งอีเมล
 */
function registerRequest(payload) {
  if (!payload || !payload.email || !payload.fullName) {
    return { success: false, message: 'กรุณากรอกชื่อและอีเมลให้ครบ' };
  }
  var sheet = getSheet('REGISTRATION_REQUESTS');
  if (!sheet) return { success: false, message: 'ระบบลงทะเบียนยังไม่เปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
  var data = sheet.getDataRange().getValues();
  var emailCol = data[0].indexOf('email');
  if (emailCol >= 0) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][emailCol]).toLowerCase() === String(payload.email).toLowerCase()) {
        return { success: false, message: 'อีเมลนี้เคยส่งคำขอลงทะเบียนแล้ว รอการตรวจสอบหรือติดต่อผู้ดูแลระบบ' };
      }
    }
  }
  var row = [
    'req_' + new Date().getTime(),
    payload.fullName || '',
    payload.email || '',
    payload.phone || '',
    'pending',
    new Date()
  ];
  if (data.length === 0) {
    sheet.appendRow(['requestId', 'fullName', 'email', 'phone', 'status', 'requestedAt']);
  }
  sheet.appendRow(row);
  return { success: true, message: 'ส่งคำขอลงทะเบียนเรียบร้อย เจ้าหน้าที่จะตรวจสอบและแจ้งผลทางอีเมล' };
}

/**
 * ดึงข้อมูลผู้ใช้ตาม session (เฉพาะข้อมูลที่ role อนุญาต)
 */
function getMyProfile(sessionId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  var sheet = getSheet('USERS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('userId');
  if (idCol < 0) idCol = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) !== String(s.userId)) continue;
    var row = data[i];
    var profile = {};
    var safeKeys = ['userId', 'email', 'fullName', 'phone', 'role', 'unitId', 'status'];
    for (var k = 0; k < headers.length; k++) {
      if (safeKeys.indexOf(headers[k]) >= 0) profile[headers[k]] = row[k];
    }
    return { success: true, profile: profile };
  }
  return { success: false, message: 'ไม่พบผู้ใช้' };
}

/**
 * อัปเดตข้อมูลส่วนตัว (Resident เท่านั้นที่แก้ได้เอง — ชื่อ อีเมล เบอร์ สมาชิกในบ้าน)
 */
function updateMyProfile(sessionId, payload) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('userId');
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(s.userId)) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { success: false, message: 'ไม่พบผู้ใช้' };
  var allowed = ['fullName', 'phone', 'householdMembers'];
  for (var key in payload) {
    if (allowed.indexOf(key) < 0) continue;
    var col = headers.indexOf(key);
    if (col >= 0) sheet.getRange(rowIndex, col + 1).setValue(payload[key]);
  }
  if (payload.email) {
    var emailCol = headers.indexOf('email');
    if (emailCol >= 0) {
      sheet.getRange(rowIndex, emailCol + 1).setValue(payload.email);
      auditLog('profile_update', s.userId, { field: 'email' });
    }
  }
  auditLog('profile_update', s.userId, {});
  return { success: true, message: 'บันทึกเรียบร้อย' };
}

/**
 * รายการผู้ใช้ (Admin/Deputy เท่านั้น)
 */
function listUsers(sessionId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('USERS');
  if (!sheet) return { success: true, users: [] };
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, users: [] };
  var headers = data[0];
  var users = [];
  for (var i = 1; i < data.length; i++) {
    var u = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j] === 'passwordHash') continue;
      u[headers[j]] = data[i][j];
    }
    users.push(u);
  }
  return { success: true, users: users };
}

/**
 * อนุมัติ/ระงับ/ปลด หรือแต่งตั้งบทบาท (Admin/Deputy)
 */
function setUserStatusOrRole(sessionId, targetUserId, action, value) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('userId');
  var statusCol = headers.indexOf('status');
  var roleCol = headers.indexOf('role');
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(targetUserId)) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { success: false, message: 'ไม่พบผู้ใช้' };
  if (action === 'status' && statusCol >= 0) {
    sheet.getRange(rowIndex, statusCol + 1).setValue(value);
    auditLog('user_status', s.userId, { target: targetUserId, value: value });
  }
  if (action === 'role' && roleCol >= 0) {
    sheet.getRange(rowIndex, roleCol + 1).setValue(value);
    auditLog('user_role', s.userId, { target: targetUserId, value: value });
  }
  return { success: true, message: 'บันทึกเรียบร้อย' };
}
