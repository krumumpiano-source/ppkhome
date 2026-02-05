/**
 * electric.gs — บันทึกค่าไฟ (คณะกรรมการ) ปัดขึ้นอัตโนมัติ
 */

/**
 * ดึงรายการหน่วยและยอดค่าไฟของรอบก่อน (สำหรับฟอร์มบันทึก)
 */
function getElectricFormData(sessionId, roundId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.COMMITTEE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var units = getUnitIds();
  var list = [];
  units.house.forEach(function (id) { list.push({ unitId: id, type: 'house' }); });
  units.flat.forEach(function (id) { list.push({ unitId: id, type: 'flat' }); });
  return { success: true, roundId: roundId, units: list };
}

/**
 * บันทึกค่าไฟรายหน่วย (รองรับทศนิยม → ปัดขึ้น)
 * @param readings [{ unitId, amount }, ...]
 * @param totalBill ยอดการไฟฟ้าเรียกเก็บจริง
 * @param lostHouse ค่า Lost บ้านพัก
 * @param lostFlat ค่า Lost แฟลต
 */
function submitElectricReadings(sessionId, roundId, readings, totalBill, lostHouse, lostFlat) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.COMMITTEE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('ELECTRIC_READINGS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var sum = 0;
  for (var i = 0; i < readings.length; i++) {
    var amt = Math.ceil(Number(readings[i].amount) || 0);
    sum += amt;
    sheet.appendRow([roundId, readings[i].unitId, amt, new Date(), amt, s.userId]);
  }
  var total = Number(totalBill) || 0;
  var warn = Math.abs(sum - total) > 0.01 ? 'ผลรวมรายหน่วยไม่เท่ากับยอดการไฟฟ้า กรุณาตรวจสอบ' : null;
  auditLog('electric_reading', s.userId, { roundId: roundId, totalBill: total, lostHouse: lostHouse, lostFlat: lostFlat });
  var roundInfo = getRoundMonthYear(roundId);
  notifyElectricRecorded({ month: roundInfo.month, year: roundInfo.year });
  return { success: true, message: warn || 'บันทึกเรียบร้อย', warning: warn };
}
