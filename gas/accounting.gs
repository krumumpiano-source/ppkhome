/**
 * accounting.gs — สรุปรอบการเงิน บัญชีกองกลาง ตรวจสอบยอด
 */

/**
 * สรุปรอบการเงิน (หน้าเดียว) — Accounting / Admin
 */
function getRoundSummary(sessionId, roundId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ACCOUNTING && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var waterTotal = 0, electricTotal = 0;
  var waterSheet = getSheet('WATER_READINGS');
  if (waterSheet) {
    var wd = waterSheet.getDataRange().getValues();
    for (var i = 1; i < wd.length; i++) {
      if (wd[i][0] === roundId) waterTotal += Number(wd[i][5]) || 0;
    }
  }
  var elecSheet = getSheet('ELECTRIC_READINGS');
  if (elecSheet) {
    var ed = elecSheet.getDataRange().getValues();
    for (var j = 1; j < ed.length; j++) {
      if (ed[j][0] === roundId) electricTotal += Number(ed[j][4]) || 0;
    }
  }
  var commonFee = Number(getSysConfig('commonFee')) || 0;
  var unitIds = getUnitIds();
  var occupiedCount = 0;
  var unitsSheet = getSheet('UNITS');
  if (unitsSheet) {
    var ud = unitsSheet.getDataRange().getValues();
    for (var k = 1; k < ud.length; k++) {
      if (ud[k][2] === 'occupied') occupiedCount++;
    }
  }
  var commonTotal = occupiedCount * commonFee;
  var vacantFee = Number(getSysConfig('vacantMeterFee')) || CONFIG.DEFAULT_VACANT_METER_FEE;
  return {
    success: true,
    roundId: roundId,
    depositWater: waterTotal,
    depositElectric: electricTotal,
    depositTotal: waterTotal + electricTotal,
    commonFeeTotal: commonTotal,
    vacantMeterFee: vacantFee,
    expenses: []
  };
}

/**
 * บัญชีรายรับ–รายจ่ายกองกลาง
 */
function getCentralLedger(sessionId, roundId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ACCOUNTING && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('CENTRAL_LEDGER');
  if (!sheet) return { success: true, income: [], expense: [], balance: 0 };
  var data = sheet.getDataRange().getValues();
  var income = [], expense = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== roundId) continue;
    if (data[i][2] === 'income') income.push({ desc: data[i][3], amount: data[i][4] });
    if (data[i][2] === 'expense') expense.push({ desc: data[i][3], amount: data[i][4] });
  }
  var balance = 0;
  income.forEach(function (x) { balance += Number(x.amount) || 0; });
  expense.forEach(function (x) { balance -= Number(x.amount) || 0; });
  return { success: true, income: income, expense: expense, balance: balance };
}

/**
 * ตรวจสอบยอดเงิน — กรอกยอดจากแอปธนาคาร เทียบกับระบบ บันทึกหมายเหตุ (ไม่แก้ยอด)
 */
function verifyBankBalance(sessionId, roundId, bankBalance, note) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ACCOUNTING && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var summary = getRoundSummary(sessionId, roundId);
  if (!summary.success) return summary;
  var systemBalance = summary.depositTotal - 0;
  var diff = Number(bankBalance) - systemBalance;
  auditLog('bank_verify', s.userId, { roundId: roundId, bank: bankBalance, system: systemBalance, note: note });
  var match = Math.abs(diff) < 0.01;
  if (match) {
    var roundInfo = getRoundMonthYear(roundId);
    notifyAccountingClosed({ month: roundInfo.month, year: roundInfo.year });
  }
  var overdueCount = 0;
  var paymentsSheet = getSheet('PAYMENTS');
  var unitsSheet = getSheet('UNITS');
  if (paymentsSheet && unitsSheet) {
    var pd = paymentsSheet.getDataRange().getValues();
    var ud = unitsSheet.getDataRange().getValues();
    var occupied = 0;
    for (var u = 1; u < ud.length; u++) { if (ud[u][2] === 'occupied') occupied++; }
    var paidUnits = {};
    for (var p = 1; p < pd.length; p++) {
      if (pd[p][0] === roundId) paidUnits[pd[p][1]] = true;
    }
    overdueCount = Math.max(0, occupied - Object.keys(paidUnits).length);
  }
  if (overdueCount > 0) notifyOutstandingFound({ count: overdueCount });
  return {
    success: true,
    systemBalance: systemBalance,
    bankBalance: Number(bankBalance),
    difference: diff,
    match: match,
    message: note || (match ? 'ตรงกัน' : 'ไม่ตรงกัน กรุณาบันทึกหมายเหตุ')
  };
}
