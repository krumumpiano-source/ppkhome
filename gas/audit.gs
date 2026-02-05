/**
 * audit.gs — บันทึกการใช้งาน (Audit Log)
 * ทุกการกระทำสำคัญต้องตรวจย้อนหลังได้
 */

/**
 * บันทึก Log
 * @param {string} action  เช่น login, logout, billing_submit, water_record
 * @param {string} userId  ผู้ดำเนินการ
 * @param {Object} detail  รายละเอียด (ไม่ใส่ข้อมูลส่วนบุคคลเกินจำเป็น)
 */
function auditLog(action, userId, detail) {
  try {
    var sheet = getSheet('AUDIT_LOG');
    if (!sheet) return;
    var row = [
      new Date(),
      userId || '',
      action,
      detail ? JSON.stringify(detail) : ''
    ];
    sheet.appendRow(row);
  } catch (e) {
    Logger.log('auditLog error: ' + e.message);
  }
}

/**
 * ดึง Audit Log (Admin/Executive เท่านั้น)
 * @param {string} sessionId
 * @param {Object} options  { from, to, userId, action, limit }
 */
function getAuditLog(sessionId, options) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  var role = s.role;
  if (role !== CONFIG.ROLES.ADMIN && role !== CONFIG.ROLES.DEPUTY_ADMIN && role !== CONFIG.ROLES.EXECUTIVE) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('AUDIT_LOG');
  if (!sheet) return { success: true, rows: [] };
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, rows: [] };
  var headers = data[0];
  var rows = [];
  var from = options && options.from ? new Date(options.from).getTime() : 0;
  var to = options && options.to ? new Date(options.to).getTime() : Number.MAX_VALUE;
  var filterUserId = options && options.userId;
  var filterAction = options && options.action;
  var limit = (options && options.limit) || 500;
  for (var i = data.length - 1; i >= 1 && rows.length < limit; i--) {
    var t = new Date(data[i][0]).getTime();
    if (t < from || t > to) continue;
    if (filterUserId && data[i][1] !== filterUserId) continue;
    if (filterAction && data[i][2] !== filterAction) continue;
    rows.push({
      when: data[i][0],
      userId: data[i][1],
      action: data[i][2],
      detail: data[i][3]
    });
  }
  return { success: true, rows: rows };
}
