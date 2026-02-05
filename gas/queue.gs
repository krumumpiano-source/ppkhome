/**
 * queue.gs — ระบบคำร้องขอเข้าพักและจัดคิว (Admin)
 */

/**
 * ยื่นคำร้อง (Applicant) — ไม่ต้อง login หรือใช้ session เฉพาะ applicant
 */
function submitApplication(payload) {
  var sheet = getSheet('APPLICATIONS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var id = 'app_' + Date.now();
  sheet.appendRow([
    id,
    payload.fullName || '',
    payload.email || '',
    payload.phone || '',
    payload.reason || '',
    'pending',
    new Date()
  ]);
  var queueSheet = getSheet('QUEUE');
  if (queueSheet) {
    var data = queueSheet.getDataRange().getValues();
    var nextOrder = data.length;
    queueSheet.appendRow([id, nextOrder, 'pending', new Date(), getQueueExpiry()]);
  }
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy');
  notifyNewApplication({ name: payload.fullName || 'ผู้ยื่นคำร้อง', date: dateStr });
  return { success: true, applicationId: id, message: 'ยื่นคำร้องเรียบร้อย' };
}

function getQueueExpiry() {
  var end = getSysConfig('queueEndDate');
  if (end) return new Date(end);
  var d = new Date();
  d.setMonth(d.getMonth() + 4);
  return d;
}

/**
 * ดึงสถานะคิวของตนเอง (Applicant) — ใช้ applicationId
 */
function getMyQueueStatus(applicationId) {
  var queueSheet = getSheet('QUEUE');
  if (!queueSheet) return { success: true, position: null, ahead: null, status: 'unknown' };
  var data = queueSheet.getDataRange().getValues();
  var orderCol = 1, statusCol = 2, expiryCol = 4;
  var myOrder = null, status = null, expiry = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === applicationId) {
      myOrder = data[i][orderCol];
      status = data[i][statusCol];
      expiry = data[i][expiryCol];
      break;
    }
  }
  if (myOrder === null) return { success: true, position: null, ahead: null, status: 'not_found' };
  var ahead = 0;
  for (var j = 1; j < data.length; j++) {
    if (data[j][orderCol] < myOrder && data[j][statusCol] === 'in_queue') ahead++;
  }
  var expired = expiry && new Date(expiry) < new Date();
  return {
    success: true,
    position: myOrder + 1,
    ahead: ahead,
    status: expired ? 'expired' : status,
    expiry: expiry
  };
}

/**
 * รายการคำร้องและคิว (Admin) — เรียงลำดับได้
 */
function listApplicationsAndQueue(sessionId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var appSheet = getSheet('APPLICATIONS');
  var queueSheet = getSheet('QUEUE');
  if (!appSheet || !queueSheet) return { success: true, items: [] };
  var appData = appSheet.getDataRange().getValues();
  var queueData = queueSheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < queueData.length; i++) {
    map[queueData[i][0]] = { order: queueData[i][1], status: queueData[i][2], expiry: queueData[i][4] };
  }
  var items = [];
  for (var j = 1; j < appData.length; j++) {
    var appId = appData[j][0];
    items.push({
      applicationId: appId,
      fullName: appData[j][1],
      email: appData[j][2],
      status: (map[appId] && map[appId].status) || appData[j][5],
      order: map[appId] ? map[appId].order : null,
      expiry: map[appId] ? map[appId].expiry : null
    });
  }
  items.sort(function (a, b) { return (a.order || 999) - (b.order || 999); });
  return { success: true, items: items };
}

/**
 * ปรับลำดับคิว (Admin)
 */
function reorderQueue(sessionId, applicationIds) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('QUEUE');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < applicationIds.length; i++) {
    for (var r = 1; r < data.length; r++) {
      if (data[r][0] === applicationIds[i]) {
        sheet.getRange(r + 1, 2).setValue(i);
 break;
      }
    }
  }
  auditLog('queue_reorder', s.userId, {});
  return { success: true, message: 'จัดลำดับคิวเรียบร้อย' };
}
