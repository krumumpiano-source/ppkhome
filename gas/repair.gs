/**
 * repair.gs — คำร้องแจ้งซ่อม/ปรับปรุง/ต่อเติม (Resident/Committee)
 */

/**
 * ยื่นคำร้องแจ้งซ่อม — บันทึกลงชีต และแจ้งเตือน Telegram
 */
function submitRepairRequest(sessionId, unitId, type, note) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.unitId !== unitId && s.role !== CONFIG.ROLES.COMMITTEE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์แจ้งซ่อมสำหรับหน่วยนี้' };
  }
  var typeLabel = type === 'ปรับปรุง' ? 'ปรับปรุง' : (type === 'ต่อเติม' ? 'ต่อเติม' : 'แจ้งซ่อม');
  var sheet = getSheet('REPAIR_REQUESTS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) sheet.appendRow(['requestId', 'unitId', 'type', 'note', 'status', 'requestedAt']);
  sheet.appendRow(['rep_' + new Date().getTime(), unitId, typeLabel, note || '', 'pending', new Date()]);
  auditLog('repair_request', s.userId, { unitId: unitId, type: typeLabel });
  notifyRepairRequest({ houseNo: unitId, type: typeLabel });
  return { success: true, message: 'ส่งคำร้องแจ้งซ่อมเรียบร้อย' };
}
