/**
 * report.gs — รายงานเชิงบริหาร (Executive Read Only)
 */

/**
 * แดชบอร์ดผู้บริหาร — ภาพรวมเท่านั้น ไม่มีรายชื่อบุคคล
 */
function getExecutiveDashboard(sessionId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.EXECUTIVE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var units = getUnitIds();
  var totalUnits = units.house.length + units.flat.length;
  var unitsSheet = getSheet('UNITS');
  var occupied = 0, vacant = 0;
  if (unitsSheet) {
    var data = unitsSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === 'occupied') occupied++; else vacant++;
    }
  }
  var round = getCurrentBillingRound();
  var paymentRate = null;
  var overdueCount = 0;
  if (round) {
    var paymentsSheet = getSheet('PAYMENTS');
    if (paymentsSheet) {
      var pd = paymentsSheet.getDataRange().getValues();
      var paid = 0, total = occupied;
      for (var j = 1; j < pd.length; j++) {
        if (pd[j][0] === round.id) paid++;
      }
      paymentRate = total > 0 ? Math.round(100 * paid / total) : 0;
      overdueCount = total - paid;
    }
  }
  var appSheet = getSheet('APPLICATIONS');
  var totalApps = 0, inQueue = 0;
  if (appSheet) {
    var ad = appSheet.getDataRange().getValues();
    totalApps = ad.length - 1;
  }
  var queueSheet = getSheet('QUEUE');
  if (queueSheet) {
    var qd = queueSheet.getDataRange().getValues();
    for (var k = 1; k < qd.length; k++) {
      if (qd[k][2] === 'in_queue') inQueue++;
    }
  }
  return {
    success: true,
    totalUnits: totalUnits,
    occupied: occupied,
    vacant: vacant,
    paymentRate: paymentRate,
    overdueCount: overdueCount,
    centralBalance: null,
    applicationsTotal: totalApps,
    applicationsInQueue: inQueue
  };
}

/**
 * รายงานตามช่วงเวลา (เดือน/ภาคเรียน/ปี)
 */
function getReportByPeriod(sessionId, fromDate, toDate, format) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.EXECUTIVE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var from = new Date(fromDate).getTime();
  var to = new Date(toDate).getTime();
  var summary = { from: fromDate, to: toDate, paymentCount: 0, totalAmount: 0 };
  var paymentsSheet = getSheet('PAYMENTS');
  if (paymentsSheet) {
    var data = paymentsSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var d = new Date(data[i][3]).getTime();
      if (d >= from && d <= to) {
        summary.paymentCount++;
        summary.totalAmount += Number(data[i][2]) || 0;
      }
    }
  }
  return { success: true, report: summary };
}
