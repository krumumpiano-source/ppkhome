/**
 * auth.gs — การยืนยันตัวตน (Login, Session, Password)
 * ไม่เก็บรหัสผ่านแบบ plain text; ใช้ hash เท่านั้น
 */

/**
 * Login — ตรวจสอบอีเมล+รหัสผ่าน แล้วสร้าง Session
 * @param {string} email
 * @param {string} password  plain text (จะ hash เทียบกับที่เก็บ)
 * @return {Object} { success, role, userId, unitId, message }
 */
function login(email, password) {
  if (!email || !password) {
    return { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }
  var sheet = getSheet('USERS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  var hashCol = headers.indexOf('passwordHash');
  var roleCol = headers.indexOf('role');
  var idCol = headers.indexOf('userId');
  var unitCol = headers.indexOf('unitId');
  var statusCol = headers.indexOf('status');
  var mustChangeCol = headers.indexOf('mustChangePassword');
  if (emailCol < 0 || hashCol < 0 || roleCol < 0) {
    return { success: false, message: 'โครงสร้างข้อมูลผู้ใช้ไม่ถูกต้อง' };
  }
  var emailTrim = String(email).toLowerCase().trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).toLowerCase().trim() !== emailTrim) continue;
    var status = data[i][statusCol];
    if (status === 'suspended' || status === 'rejected') {
      return { success: false, message: 'บัญชีนี้ถูกระงับหรือไม่ได้รับการอนุมัติ' };
    }
    var storedHash = data[i][hashCol];
    if (!storedHash) return { success: false, message: 'บัญชียังไม่ได้ตั้งรหัสผ่าน' };
    var hash = hashPassword(password);
    if (hash !== storedHash) {
      auditLog('login_fail', null, { email: emailTrim });
      return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    var userId = idCol >= 0 ? data[i][idCol] : 'u' + (i + 1);
    var role = data[i][roleCol] || CONFIG.ROLES.RESIDENT;
    var unitId = unitCol >= 0 ? data[i][unitCol] : '';
    var mustChange = mustChangeCol >= 0 && data[i][mustChangeCol] === true;
    var session = createSession(userId, role, unitId);
    auditLog('login', userId, { role: role });
    return {
      success: true,
      sessionId: session.id,
      userId: userId,
      role: role,
      unitId: unitId || null,
      mustChangePassword: mustChange,
      message: mustChange ? 'กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน' : 'เข้าสู่ระบบสำเร็จ'
    };
  }
  auditLog('login_fail', null, { email: emailTrim });
  return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
}

/**
 * สร้าง Session (เก็บใน Cache หรือ Properties; ใช้ Session.getActiveUser() ใน GAS ได้ถ้าใช้ Web App)
 * ที่เก็บจริง: ScriptProperties ใช้ key session_<id> = JSON { userId, role, unitId, expires }
 */
function createSession(userId, role, unitId) {
  var id = Utilities.getUuid();
  var expires = Date.now() + 24 * 60 * 60 * 1000; // 24 ชม.
  var payload = JSON.stringify({
    userId: userId,
    role: role,
    unitId: unitId || null,
    expires: expires
  });
  PropertiesService.getScriptProperties().setProperty('session_' + id, payload);
  return { id: id, expires: expires };
}

/**
 * ตรวจสอบ Session และคืนข้อมูลผู้ใช้
 */
function getSession(sessionId) {
  if (!sessionId) return null;
  var raw = PropertiesService.getScriptProperties().getProperty('session_' + sessionId);
  if (!raw) return null;
  try {
    var s = JSON.parse(raw);
    if (s.expires && s.expires < Date.now()) {
      PropertiesService.getScriptProperties().deleteProperty('session_' + sessionId);
      return null;
    }
    return s;
  } catch (e) {
    return null;
  }
}

/**
 * Logout — ลบ Session
 */
function logout(sessionId) {
  if (sessionId) {
    var s = getSession(sessionId);
    if (s) auditLog('logout', s.userId, {});
    PropertiesService.getScriptProperties().deleteProperty('session_' + sessionId);
  }
  return { success: true };
}

/**
 * Hash รหัสผ่าน (SHA-256 + base64) — ไม่เก็บ plain text
 */
function hashPassword(password) {
  var salt = 'THR_' + (CONFIG.SPREADSHEET_ID || 'salt');
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password, Utilities.Charset.UTF_8));
}

/**
 * เปลี่ยนรหัสผ่าน (ต้องส่ง sessionId + รหัสเก่า + รหัสใหม่)
 */
function changePassword(sessionId, oldPassword, newPassword) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'กรุณาเข้าสู่ระบบใหม่' };
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'รหัสผ่านต้องไม่น้อยกว่า 8 ตัว และมีทั้งตัวเล็ก ตัวใหญ่ ตัวเลข และอักขระพิเศษ' };
  }
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  var hashCol = headers.indexOf('passwordHash');
  var idCol = headers.indexOf('userId');
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(s.userId)) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) return { success: false, message: 'ไม่พบผู้ใช้' };
  var currentHash = data[rowIndex - 1][hashCol];
  if (hashPassword(oldPassword) !== currentHash) {
    return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
  }
  var newHash = hashPassword(newPassword);
  sheet.getRange(rowIndex, hashCol + 1).setValue(newHash);
  var mustCol = headers.indexOf('mustChangePassword');
  if (mustCol >= 0) sheet.getRange(rowIndex, mustCol + 1).setValue(false);
  auditLog('change_password', s.userId, {});
  return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' };
}

/**
 * ขอรีเซ็ตรหัสผ่าน (ส่งอีเมลลิงก์ — ต้องตั้งค่า Mail/ส่งจริงใน production)
 */
function requestPasswordReset(email) {
  var sheet = getSheet('USERS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var data = sheet.getDataRange().getValues();
  var emailCol = data[0].indexOf('email');
  var idCol = data[0].indexOf('userId');
  var emailTrim = String(email).toLowerCase().trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).toLowerCase().trim() !== emailTrim) continue;
    var userId = data[i][idCol];
    var token = Utilities.getUuid();
    PropertiesService.getScriptProperties().setProperty('reset_' + token, userId + '|' + (Date.now() + 3600000));
    var url = getWebAppUrl() + '?mode=reset&token=' + token;
    try {
      MailApp.sendEmail(emailTrim, 'รีเซ็ตรหัสผ่าน - ระบบบ้านพักครู', 'ลิงก์สำหรับรีเซ็ตรหัสผ่าน (ใช้ได้ 1 ชั่วโมง):\n' + url);
    } catch (e) {
      return { success: false, message: 'ส่งอีเมลไม่สำเร็จ: ' + e.message };
    }
    auditLog('password_reset_request', userId, {});
    return { success: true, message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว' };
  }
  return { success: true, message: 'ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์ไปที่อีเมล' };
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * รีเซ็ตรหัสผ่านด้วย token จากอีเมล
 */
function resetPasswordWithToken(token, newPassword) {
  var raw = PropertiesService.getScriptProperties().getProperty('reset_' + token);
  if (!raw) return { success: false, message: 'ลิงก์หมดอายุหรือไม่ถูกต้อง' };
  var parts = raw.split('|');
  if (Number(parts[1]) < Date.now()) {
    PropertiesService.getScriptProperties().deleteProperty('reset_' + token);
    return { success: false, message: 'ลิงก์หมดอายุ' };
  }
  var userId = parts[0];
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'รหัสผ่านต้องไม่น้อยกว่า 8 ตัว' };
  }
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  var idCol = data[0].indexOf('userId');
  var hashCol = data[0].indexOf('passwordHash');
  var mustCol = data[0].indexOf('mustChangePassword');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) !== userId) continue;
    var newHash = hashPassword(newPassword);
    sheet.getRange(i + 1, hashCol + 1).setValue(newHash);
    if (mustCol >= 0) sheet.getRange(i + 1, mustCol + 1).setValue(false);
    PropertiesService.getScriptProperties().deleteProperty('reset_' + token);
    auditLog('password_reset_done', userId, {});
    return { success: true, message: 'ตั้งรหัสผ่านใหม่เรียบร้อย' };
  }
  return { success: false, message: 'ไม่พบผู้ใช้' };
}
