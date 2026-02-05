/**
 * water.gs — บันทึกมิเตอร์น้ำ (คณะกรรมการ)
 */

/**
 * ดึงข้อมูลสำหรับบันทึกน้ำ: เลขก่อนหน้า วันที่ ราคาต่อหน่วย
 */
function getWaterFormData(sessionId, unitId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.COMMITTEE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์บันทึกมิเตอร์น้ำ' };
  }
  var sheet = getSheet('WATER_READINGS');
  var prevReading = null;
  var prevDate = null;
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === unitId) {
        prevReading = Number(data[i][2]);
        prevDate = data[i][3];
        break;
      }
    }
  }
  var rate = getSysConfig('waterRate') || CONFIG.DEFAULT_WATER_RATE;
  return {
    success: true,
    unitId: unitId,
    prevReading: prevReading,
    prevDate: prevDate,
    ratePerUnit: Number(rate)
  };
}

/**
 * บันทึกเลขมิเตอร์ล่าสุด
 * Validation: เลขล่าสุด >= เลขก่อน; ซ้ำเดือนเดียวกันเตือน
 */
function submitWaterReading(sessionId, roundId, unitId, currentReading, note) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.COMMITTEE && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var form = getWaterFormData(sessionId, unitId);
  if (!form.success) return form;
  var curr = Number(currentReading);
  if (isNaN(curr)) return { success: false, message: 'กรุณากรอกเลขมิเตอร์ให้ถูกต้อง' };
  if (form.prevReading !== null && curr < form.prevReading) {
    return { success: false, message: 'เลขมิเตอร์ล่าสุดต้องไม่น้อยกว่าเลขครั้งก่อน' };
  }
  var unitsUsed = (form.prevReading === null) ? curr : (curr - form.prevReading);
  if (unitsUsed < 0) return { success: false, message: 'หน่วยที่ใช้ติดลบไม่ได้' };
  var amount = unitsUsed * form.ratePerUnit;
  var sheet = getSheet('WATER_READINGS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  sheet.appendRow([roundId, unitId, form.prevReading, new Date(), curr, amount, note || '']);
  auditLog('water_reading', s.userId, { roundId: roundId, unitId: unitId, current: curr });
  var unitIds = getUnitIds();
  var totalUnits = unitIds.house.length + unitIds.flat.length;
  var data = sheet.getDataRange().getValues();
  var roundCount = 0;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === roundId) roundCount++;
  }
  if (roundCount >= totalUnits) {
    var roundInfo = getRoundMonthYear(roundId);
    notifyWaterRecorded({ month: roundInfo.month, year: roundInfo.year });
  }
  return { success: true, message: 'บันทึกเรียบร้อย', units: unitsUsed, amount: amount };
}
