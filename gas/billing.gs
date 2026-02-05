/**
 * billing.gs — ยอดเรียกเก็บ การชำระเงิน (เงินรับฝาก ไม่ใช่รายได้)
 * สถานะการชำระ: PAID_ON_TIME | PAID_LATE | UNPAID (เฉพาะ Resident ดูของตนเองเท่านั้น)
 */

/** วันหยุด (ไม่นับเป็นวันทำการ) — อ่านจาก SysConfig key holidayDates คั่นด้วย comma รูป yyyy-MM-dd */
function getHolidayDates() {
  var raw = getSysConfig('holidayDates');
  if (!raw) return [];
  var out = [];
  var parts = String(raw).split(',');
  for (var i = 0; i < parts.length; i++) {
    var s = parts[i].trim();
    if (!s) continue;
    var d = new Date(s);
    if (!isNaN(d.getTime())) out.push(d.getTime());
  }
  return out;
}

/** บวกจำนวนวันทำการ (ไม่นับเสาร์-อาทิตย์ และวันหยุดที่ Admin ตั้งค่า) */
function addBusinessDays(startDate, n) {
  var d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  var holidays = getHolidayDates();
  var count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    var day = d.getDay();
    var isWeekend = (day === 0 || day === 6);
    var t = d.getTime();
    var isHoliday = false;
    for (var h = 0; h < holidays.length; h++) {
      var hd = new Date(holidays[h]);
      hd.setHours(0, 0, 0, 0);
      if (hd.getTime() === t) { isHoliday = true; break; }
    }
    if (!isWeekend && !isHoliday) count++;
  }
  return d;
}

/** วันที่แจ้งยอดของรอบ — ถ้าชีตมีคอลัมน์ billingDate ใช้ค่านั้น ไม่เช่นนั้นใช้วันที่ 1 ของเดือนนั้น */
function getBillingDateForRound(roundId) {
  var sheet = getSheet('BILLING_ROUNDS');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === roundId) {
      if (data[i][4] != null && data[i][4] !== '') {
        var d = new Date(data[i][4]);
        return isNaN(d.getTime()) ? null : d;
      }
      var month = parseInt(data[i][1], 10) || 1;
      var year = parseInt(data[i][2], 10) || new Date().getFullYear();
      return new Date(year, month - 1, 1);
    }
  }
  return null;
}

/** วันครบกำหนดชำระ (ภายใน 3 วันทำการหลังแจ้งยอด) */
function getDueDateForRound(roundId) {
  var billing = getBillingDateForRound(roundId);
  if (!billing) return null;
  return addBusinessDays(billing, 3);
}

/** จำนวนวัน (ตามปฏิทิน) ระหว่างสองวัน (สำหรับแสดง late_days) */
function daysBetween(fromDate, toDate) {
  var a = new Date(fromDate);
  var b = new Date(toDate);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)));
}

/**
 * รายการสถานะการชำระของตนเองเท่านั้น (Resident View — PDPA)
 * คืนค่า: billing_date, due_date, payment_date, payment_status, late_days, round_month, round_year
 * ห้ามดึงข้อมูลของหน่วยอื่น
 */
function getMyPaymentStatusList(sessionId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  var unitId = s.unitId;
  if (!unitId) return { success: true, items: [], message: null };
  if (s.role !== CONFIG.ROLES.RESIDENT && s.role !== CONFIG.ROLES.COMMITTEE) {
    if (s.role === CONFIG.ROLES.ADMIN || s.role === CONFIG.ROLES.DEPUTY_ADMIN || s.role === CONFIG.ROLES.ACCOUNTING) {
      return { success: false, message: 'API นี้สำหรับผู้พักอาศัยเท่านั้น' };
    }
    return { success: true, items: [] };
  }
  if (s.role === CONFIG.ROLES.COMMITTEE && s.unitId !== unitId) return { success: true, items: [] };
  var roundsSheet = getSheet('BILLING_ROUNDS');
  if (!roundsSheet) return { success: true, items: [] };
  var roundsData = roundsSheet.getDataRange().getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var items = [];
  for (var r = 1; r < roundsData.length; r++) {
    var roundId = roundsData[r][0];
    var roundMonth = roundsData[r][1];
    var roundYear = roundsData[r][2];
    var billingDate = getBillingDateForRound(roundId);
    var dueDate = getDueDateForRound(roundId);
    if (!billingDate || !dueDate) continue;
    var payment = getPaymentForRoundAndUnit(roundId, unitId);
    var paymentDate = payment ? new Date(payment.date) : null;
    var paymentStatus = 'UNPAID';
    var lateDays = 0;
    if (paymentDate) {
      paymentDate.setHours(0, 0, 0, 0);
      if (paymentDate.getTime() <= dueDate.getTime()) {
        paymentStatus = 'PAID_ON_TIME';
      } else {
        paymentStatus = 'PAID_LATE';
        lateDays = daysBetween(dueDate, paymentDate);
      }
    }
    items.push({
      roundId: roundId,
      round_month: roundMonth,
      round_year: roundYear,
      billing_date: billingDate.toISOString ? billingDate.toISOString().slice(0, 10) : '',
      due_date: dueDate.toISOString ? dueDate.toISOString().slice(0, 10) : '',
      payment_date: paymentDate ? (paymentDate.toISOString ? paymentDate.toISOString().slice(0, 10) : '') : null,
      payment_status: paymentStatus,
      late_days: lateDays
    });
  }
  items.sort(function (a, b) {
    var da = a.due_date || '';
    var db = b.due_date || '';
    return db.localeCompare(da);
  });
  return { success: true, items: items };
}

/**
 * ดึงยอดเรียกเก็บของหน่วยสำหรับรอบปัจจุบัน (Resident/Committee ดูได้เฉพาะหน่วยตนเอง)
 */
function getBillingForUnit(sessionId, unitId) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role === CONFIG.ROLES.RESIDENT || s.role === CONFIG.ROLES.COMMITTEE) {
    if (s.unitId !== unitId) return { success: false, message: 'ไม่มีสิทธิ์ดูหน่วยนี้' };
  }
  var round = getCurrentBillingRound();
  if (!round) return { success: true, round: null, items: [], total: 0, status: 'not_open' };
  var water = getWaterChargeForRound(round.id, unitId);
  var electric = getElectricChargeForRound(round.id, unitId);
  var commonFee = getCommonFeeForUnit(unitId);
  var total = (water || 0) + (electric || 0) + (commonFee || 0);
  var payment = getPaymentForRoundAndUnit(round.id, unitId);
  var status = payment ? (payment.verified ? 'paid' : 'pending_check') : 'unpaid';
  return {
    success: true,
    round: round,
    items: [
      { type: 'water', amount: water },
      { type: 'electric', amount: electric },
      { type: 'common', amount: commonFee }
    ],
    total: total,
    status: status,
    payment: payment
  };
}

function getCurrentBillingRound() {
  var sheet = getSheet('BILLING_ROUNDS');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][3] !== 'open') continue;
    return { id: data[i][0], month: data[i][1], year: data[i][2], status: data[i][3] };
  }
  return null;
}

/** ดึงเดือน/ปีของรอบบัญชี (สำหรับแจ้งเตือน) */
function getRoundMonthYear(roundId) {
  var sheet = getSheet('BILLING_ROUNDS');
  if (!sheet) return { month: '', year: '' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === roundId) return { month: data[i][1] || '', year: data[i][2] || '' };
  }
  return { month: '', year: '' };
}

function getWaterChargeForRound(roundId, unitId) {
  var sheet = getSheet('WATER_READINGS');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === roundId && data[i][1] === unitId) return Number(data[i][5]) || 0;
  }
  return 0;
}

function getElectricChargeForRound(roundId, unitId) {
  var sheet = getSheet('ELECTRIC_READINGS');
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === roundId && data[i][1] === unitId) return Number(data[i][4]) || 0;
  }
  return 0;
}

function getCommonFeeForUnit(unitId) {
  var fee = getSysConfig('commonFee');
  return Number(fee) || 0;
}

function getPaymentForRoundAndUnit(roundId, unitId) {
  var sheet = getSheet('PAYMENTS');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === roundId && data[i][1] === unitId) {
      return { amount: data[i][2], date: data[i][3], verified: data[i][5] === true || data[i][5] === 'TRUE' };
    }
  }
  return null;
}

/**
 * ส่งหลักฐานการชำระ (Resident)
 */
function submitPayment(sessionId, roundId, unitId, amount, slipDataUrl, note) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.unitId !== unitId && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์ส่งการชำระสำหรับหน่วยนี้' };
  }
  if (!amount || Number(amount) <= 0) return { success: false, message: 'กรุณากรอกจำนวนเงิน' };
  if (!slipDataUrl) return { success: false, message: 'กรุณาแนบสลิป' };
  
  // ถ้า slipDataUrl เป็น Base64 ให้อัปโหลดไปยัง Google Drive
  var finalSlipUrl = slipDataUrl;
  if (slipDataUrl.indexOf('data:image/') === 0) {
    try {
      finalSlipUrl = uploadPaymentSlip(slipDataUrl, roundId, unitId, s.userId);
    } catch (e) {
      return { success: false, message: 'ไม่สามารถอัปโหลดสลิปได้: ' + e.message };
    }
  }
  
  var sheet = getSheet('PAYMENTS');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  sheet.appendRow([roundId, unitId, Number(amount), new Date(), s.userId, false, note || '', finalSlipUrl]);
  auditLog('payment_submit', s.userId, { roundId: roundId, unitId: unitId, amount: amount, slipUploaded: true });
  var roundInfo = getRoundMonthYear(roundId);
  notifyPaymentSubmitted({ houseNo: unitId, month: roundInfo.month, year: roundInfo.year });
  return { success: true, message: 'ส่งหลักฐานเรียบร้อย รอการตรวจสอบ' };
}

/**
 * ประวัติการชำระของหน่วย (Resident ดูได้เฉพาะหน่วยตนเอง)
 */
function getPaymentHistory(sessionId, unitId, limit) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.unitId !== unitId && s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN && s.role !== CONFIG.ROLES.ACCOUNTING) {
    return { success: false, message: 'ไม่มีสิทธิ์' };
  }
  var sheet = getSheet('PAYMENTS');
  if (!sheet) return { success: true, rows: [] };
  var data = sheet.getDataRange().getValues();
  var rows = [];
  var max = limit || 24;
  for (var i = data.length - 1; i >= 1 && rows.length < max; i--) {
    if (data[i][1] !== unitId) continue;
    rows.push({
      roundId: data[i][0],
      unitId: data[i][1],
      amount: data[i][2],
      date: data[i][3],
      verified: data[i][5]
    });
  }
  return { success: true, rows: rows };
}
