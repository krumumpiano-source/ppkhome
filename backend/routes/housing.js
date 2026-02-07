const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getCurrentBillingRound,
  getRoundMonthYear,
  getWaterChargeForRound,
  getElectricChargeForRound,
  getCommonFeeForUnit,
  getPaymentForRoundAndUnit,
  getBillingDateForRound,
  getDueDateForRound,
  daysBetween,
  auditLog,
  getSysConfig,
  hashPassword,
  CONFIG
} = require('../services/logic');
const db = require('../services/db');
const drive = require('../services/drive');

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function isApplicationOwner(app, user) {
  if (!app || !user) return false;
  if (app.userId && app.userId === user.userId) return true;
  const appEmail = normalizeEmail(app.email);
  const userEmail = normalizeEmail(user.email);
  return !!appEmail && appEmail === userEmail;
}

function getApplicationSortKey(app) {
  const submitted = Date.parse(app.submittedAt || '');
  if (!isNaN(submitted)) return submitted;
  const fallback = parseInt(String(app.applicationId || '').replace(/\D/g, ''), 10);
  return isNaN(fallback) ? 0 : fallback;
}

router.get('/billing/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  if ((req.session.role === CONFIG.ROLES.RESIDENT || req.session.role === CONFIG.ROLES.COMMITTEE) && req.session.unitId !== unitId) {
    return res.json({ success: false, message: 'ไม่มีสิทธิ์ดูหน่วยนี้' });
  }
  const round = await getCurrentBillingRound();
  if (!round) {
    return res.json({ success: true, round: null, items: [], total: 0, status: 'not_open' });
  }
  const water = await getWaterChargeForRound(round.id, unitId);
  const electric = await getElectricChargeForRound(round.id, unitId);
  const commonFee = await getCommonFeeForUnit(unitId);
  const total = (water || 0) + (electric || 0) + (commonFee || 0);
  const payment = await getPaymentForRoundAndUnit(round.id, unitId);
  const status = payment ? (payment.verified ? 'paid' : 'pending_check') : 'unpaid';
  res.json({
    success: true,
    round,
    items: [
      { type: 'water', amount: water },
      { type: 'electric', amount: electric },
      { type: 'common', amount: commonFee }
    ],
    total,
    status,
    payment
  });
});

router.get('/payment-status', requireAuth, async (req, res) => {
  const unitId = req.session.unitId;
  if (!unitId) {
    return res.json({ success: true, items: [], message: null });
  }
  if (req.session.role !== CONFIG.ROLES.RESIDENT && req.session.role !== CONFIG.ROLES.COMMITTEE) {
    if ([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN, CONFIG.ROLES.ACCOUNTING].includes(req.session.role)) {
      return res.json({ success: false, message: 'API นี้สำหรับผู้พักอาศัยเท่านั้น' });
    }
    return res.json({ success: true, items: [] });
  }
  if (req.session.role === CONFIG.ROLES.COMMITTEE && req.session.unitId !== unitId) {
    return res.json({ success: true, items: [] });
  }
  const rounds = await db.getCollection('BILLING_ROUNDS');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = [];
  for (const round of rounds) {
    const roundId = round.roundId;
    const billingDate = await getBillingDateForRound(roundId);
    const dueDate = await getDueDateForRound(roundId);
    if (!billingDate || !dueDate) continue;
    const payment = await getPaymentForRoundAndUnit(roundId, unitId);
    const paymentDate = payment ? new Date(payment.date) : null;
    let paymentStatus = 'UNPAID';
    let lateDays = 0;
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
      roundId,
      round_month: round.month,
      round_year: round.year,
      billing_date: billingDate.toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      payment_date: paymentDate ? paymentDate.toISOString().slice(0, 10) : null,
      payment_status: paymentStatus,
      late_days: lateDays
    });
  }
  items.sort((a, b) => {
    const da = a.due_date || '';
    const db = b.due_date || '';
    return db.localeCompare(da);
  });
  res.json({ success: true, items });
});

router.post('/payment', requireAuth, async (req, res) => {
  const { roundId, unitId, amount, slipDataUrl, note } = req.body;
  if (req.session.unitId !== unitId && req.session.role !== CONFIG.ROLES.ADMIN && req.session.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return res.json({ success: false, message: 'ไม่มีสิทธิ์ส่งการชำระสำหรับหน่วยนี้' });
  }
  if (!amount || Number(amount) <= 0) {
    return res.json({ success: false, message: 'กรุณากรอกจำนวนเงิน' });
  }
  if (!slipDataUrl) {
    return res.json({ success: false, message: 'กรุณาแนบสลิป' });
  }
  let finalSlipUrl = slipDataUrl;
  if (slipDataUrl.indexOf('data:image/') === 0) {
    try {
      finalSlipUrl = await drive.uploadPaymentSlip(slipDataUrl, roundId, unitId, req.session.userId);
    } catch (e) {
      return res.json({ success: false, message: 'ไม่สามารถอัปโหลดสลิปได้: ' + e.message });
    }
  }
  const payment = {
    roundId,
    unitId,
    amount: Number(amount),
    date: new Date().toISOString(),
    userId: req.session.userId,
    verified: false,
    note: note || '',
    slipDataUrl: finalSlipUrl
  };
  await db.addToCollection('PAYMENTS', payment);
  await auditLog('payment_submit', req.session.userId, { roundId, unitId, amount, slipUploaded: true });
  const roundInfo = await getRoundMonthYear(roundId);
  res.json({ success: true, message: 'ส่งหลักฐานเรียบร้อย รอการตรวจสอบ' });
});

router.get('/payment-history/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const limit = parseInt(req.query.limit) || 24;
  if (req.session.unitId !== unitId && ![CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN, CONFIG.ROLES.ACCOUNTING].includes(req.session.role)) {
    return res.json({ success: false, message: 'ไม่มีสิทธิ์' });
  }
  const payments = await db.getCollection('PAYMENTS');
  const filtered = db.filterCollection(payments, p => p.unitId === unitId);
  const rows = filtered.slice(-limit).reverse().map(p => ({
    roundId: p.roundId,
    unitId: p.unitId,
    amount: p.amount,
    date: p.date,
    verified: p.verified
  }));
  res.json({ success: true, rows });
});

router.get('/water-form/:unitId', requireAuth, requireRole(CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { unitId } = req.params;
  const readings = await db.getCollection('WATER_READINGS');
  let prevReading = null;
  let prevDate = null;
  for (let i = readings.length - 1; i >= 0; i--) {
    if (readings[i].unitId === unitId) {
      prevReading = Number(readings[i].currentReading);
      prevDate = readings[i].date;
      break;
    }
  }
  const rate = await getSysConfig('waterRate') || CONFIG.DEFAULT_WATER_RATE;
  res.json({
    success: true,
    unitId,
    prevReading,
    prevDate,
    ratePerUnit: Number(rate)
  });
});

router.post('/water-reading', requireAuth, requireRole(CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { roundId, unitId, currentReading, note } = req.body;
  const readings = await db.getCollection('WATER_READINGS');
  let prevReading = null;
  for (let i = readings.length - 1; i >= 0; i--) {
    if (readings[i].unitId === unitId) {
      prevReading = Number(readings[i].currentReading);
      break;
    }
  }
  const curr = Number(currentReading);
  if (isNaN(curr)) {
    return res.json({ success: false, message: 'กรุณากรอกเลขมิเตอร์ให้ถูกต้อง' });
  }
  if (prevReading !== null && curr < prevReading) {
    return res.json({ success: false, message: 'เลขมิเตอร์ล่าสุดต้องไม่น้อยกว่าเลขครั้งก่อน' });
  }
  const unitsUsed = prevReading === null ? curr : (curr - prevReading);
  if (unitsUsed < 0) {
    return res.json({ success: false, message: 'หน่วยที่ใช้ติดลบไม่ได้' });
  }
  const rate = await getSysConfig('waterRate') || CONFIG.DEFAULT_WATER_RATE;
  const amount = unitsUsed * Number(rate);
  const reading = {
    roundId,
    unitId,
    prevReading,
    prevDate: prevReading !== null ? new Date().toISOString() : null,
    currentReading: curr,
    amount,
    note: note || '',
    date: new Date().toISOString()
  };
  await db.addToCollection('WATER_READINGS', reading);
  await auditLog('water_reading', req.session.userId, { roundId, unitId, current: curr });
  res.json({ success: true, message: 'บันทึกเรียบร้อย', units: unitsUsed, amount });
});

router.get('/electric-form/:roundId', requireAuth, requireRole(CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), (req, res) => {
  const { roundId } = req.params;
  const { getUnitIds } = require('../services/logic');
  const units = getUnitIds();
  const list = [];
  units.house.forEach(id => list.push({ unitId: id, type: 'house' }));
  units.flat.forEach(id => list.push({ unitId: id, type: 'flat' }));
  res.json({ success: true, roundId, units: list });
});

router.post('/electric-reading', requireAuth, requireRole(CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { roundId, readings, totalBill, lostHouse, lostFlat } = req.body;
  let sum = 0;
  for (const reading of readings) {
    const amt = Math.ceil(Number(reading.amount) || 0);
    sum += amt;
    await db.addToCollection('ELECTRIC_READINGS', {
      roundId,
      unitId: reading.unitId,
      amount: amt,
      date: new Date().toISOString(),
      total: amt,
      userId: req.session.userId
    });
  }
  const total = Number(totalBill) || 0;
  const warn = Math.abs(sum - total) > 0.01 ? 'ผลรวมรายหน่วยไม่เท่ากับยอดการไฟฟ้า กรุณาตรวจสอบ' : null;
  await auditLog('electric_reading', req.session.userId, { roundId, totalBill: total, lostHouse, lostFlat });
  res.json({ success: true, message: warn || 'บันทึกเรียบร้อย', warning: warn });
});

router.post('/repair-request', requireAuth, async (req, res) => {
  const { unitId, type, note } = req.body;
  if (req.session.unitId !== unitId && ![CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN].includes(req.session.role)) {
    return res.json({ success: false, message: 'ไม่มีสิทธิ์แจ้งซ่อมสำหรับหน่วยนี้' });
  }
  const typeLabel = type === 'ปรับปรุง' ? 'ปรับปรุง' : (type === 'ต่อเติม' ? 'ต่อเติม' : 'แจ้งซ่อม');
  const request = {
    requestId: 'rep_' + Date.now(),
    unitId,
    type: typeLabel,
    note: note || '',
    status: 'pending',
    requestedAt: new Date().toISOString()
  };
  await db.addToCollection('REPAIR_REQUESTS', request);
  await auditLog('repair_request', req.session.userId, { unitId, type: typeLabel });
  res.json({ success: true, message: 'ส่งคำร้องแจ้งซ่อมเรียบร้อย' });
});

router.post('/application', requireAuth, requireRole(CONFIG.ROLES.APPLICANT), async (req, res) => {
  const { fullName, email, phone, reason } = req.body;
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === req.session.userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const emailFinal = normalizeEmail(email) || normalizeEmail(user.email);
  if (!emailFinal) {
    return res.json({ success: false, message: 'ไม่พบอีเมลผู้ใช้' });
  }
  const application = {
    applicationId: 'app_' + Date.now(),
    userId: user.userId,
    fullName: fullName || user.fullName || '',
    email: emailFinal,
    phone: phone || user.phone || '',
    reason: reason || '',
    status: 'pending',
    submittedAt: new Date().toISOString()
  };
  await db.addToCollection('APPLICATIONS', application);
  const queue = await db.getCollection('QUEUE');
  const nextOrder = queue.length;
  await db.addToCollection('QUEUE', {
    applicationId: application.applicationId,
    userId: user.userId,
    order: nextOrder,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiry: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  res.json({ success: true, applicationId: application.applicationId, message: 'ยื่นคำร้องเรียบร้อย' });
});

router.get('/queue-status', requireAuth, requireRole(CONFIG.ROLES.APPLICANT), async (req, res) => {
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === req.session.userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const applications = await db.getCollection('APPLICATIONS');
  const mine = applications.filter(app => isApplicationOwner(app, user));
  if (mine.length === 0) {
    return res.json({ success: true, status: 'not_found', application: null });
  }
  mine.sort((a, b) => getApplicationSortKey(b) - getApplicationSortKey(a));
  const application = mine[0];
  const queue = await db.getCollection('QUEUE');
  const item = db.findInCollection(queue, q => q.applicationId === application.applicationId);
  if (!item) {
    return res.json({ success: true, status: 'not_found', application: { applicationId: application.applicationId } });
  }
  let ahead = 0;
  for (const q of queue) {
    if (q.order < item.order && q.status === 'in_queue') ahead++;
  }
  const expired = item.expiry && new Date(item.expiry) < new Date();
  res.json({
    success: true,
    application: {
      applicationId: application.applicationId,
      fullName: application.fullName || '',
      email: application.email || '',
      phone: application.phone || '',
      status: application.status || '',
      submittedAt: application.submittedAt || null
    },
    position: item.order + 1,
    ahead,
    status: expired ? 'expired' : item.status,
    expiry: item.expiry
  });
});

router.get('/queue-status/:applicationId', requireAuth, async (req, res) => {
  const { applicationId } = req.params;
  if (!applicationId) {
    return res.json({ success: true, position: null, ahead: null, status: 'not_found' });
  }
  if (req.session.role === CONFIG.ROLES.APPLICANT) {
    const users = await db.getCollection('USERS');
    const user = db.findInCollection(users, u => u.userId === req.session.userId);
    if (!user) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    const applications = await db.getCollection('APPLICATIONS');
    const application = db.findInCollection(applications, app => app.applicationId === applicationId);
    if (!isApplicationOwner(application, user)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
  } else if (![CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN].includes(req.session.role)) {
    return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
  }
  const queue = await db.getCollection('QUEUE');
  const item = db.findInCollection(queue, q => q.applicationId === applicationId);
  if (!item) {
    return res.json({ success: true, position: null, ahead: null, status: 'not_found' });
  }
  let ahead = 0;
  for (const q of queue) {
    if (q.order < item.order && q.status === 'in_queue') ahead++;
  }
  const expired = item.expiry && new Date(item.expiry) < new Date();
  res.json({
    success: true,
    position: item.order + 1,
    ahead,
    status: expired ? 'expired' : item.status,
    expiry: item.expiry
  });
});

router.get('/applications-queue', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const applications = await db.getCollection('APPLICATIONS');
  const queue = await db.getCollection('QUEUE');
  const map = {};
  for (const q of queue) {
    map[q.applicationId] = { order: q.order, status: q.status, expiry: q.expiry };
  }
  const items = applications.map(app => ({
    applicationId: app.applicationId,
    fullName: app.fullName || '',
    email: app.email || '',
    phone: app.phone || '',
    reason: app.reason || '',
    status: (map[app.applicationId] && map[app.applicationId].status) || app.status,
    order: map[app.applicationId] ? map[app.applicationId].order : null,
    expiry: map[app.applicationId] ? map[app.applicationId].expiry : null,
    submittedAt: app.submittedAt || null
  }));
  items.sort((a, b) => (a.order || 999) - (b.order || 999));
  res.json({ success: true, items });
});

router.post('/reorder-queue', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { applicationIds } = req.body;
  const queue = await db.getCollection('QUEUE');
  for (let i = 0; i < applicationIds.length; i++) {
    const item = db.findInCollection(queue, q => q.applicationId === applicationIds[i]);
    if (item) {
      item.order = i;
      await db.updateInCollection('QUEUE', q => q.applicationId === applicationIds[i], () => item);
    }
  }
  await auditLog('queue_reorder', req.session.userId, {});
  res.json({ success: true, message: 'จัดลำดับคิวเรียบร้อย' });
});

router.post('/application-approve', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { applicationId, unitId, note } = req.body;
  
  if (!applicationId) {
    return res.json({ success: false, message: 'กรุณาระบุ applicationId' });
  }
  
  // ดึงข้อมูล application
  const applications = await db.getCollection('APPLICATIONS');
  const application = db.findInCollection(applications, app => app.applicationId === applicationId);
  
  if (!application) {
    return res.json({ success: false, message: 'ไม่พบคำร้องนี้' });
  }
  
  if (application.status === 'approved') {
    return res.json({ success: false, message: 'คำร้องนี้ได้รับการอนุมัติแล้ว' });
  }
  
  if (application.status === 'rejected') {
    return res.json({ success: false, message: 'คำร้องนี้ถูกปฏิเสธแล้ว' });
  }
  
  // อัปเดตสถานะ application
  application.status = 'approved';
  application.approvedAt = new Date().toISOString();
  application.approvedBy = req.session.userId;
  application.unitId = unitId || null;
  application.approvalNote = note || '';
  await db.updateInCollection('APPLICATIONS', app => app.applicationId === applicationId, () => application);
  
  // อัปเดตสถานะ queue
  const queue = await db.getCollection('QUEUE');
  const queueItem = db.findInCollection(queue, q => q.applicationId === applicationId);
  if (queueItem) {
    queueItem.status = 'processed';
    await db.updateInCollection('QUEUE', q => q.applicationId === applicationId, () => queueItem);
  }
  
  // ถ้ามี unitId ให้อัปเดต user และ unit
  if (unitId) {
    // ตรวจสอบว่า unit ว่างหรือไม่
    const units = await db.getCollection('UNITS');
    const unit = db.findInCollection(units, u => u.unitId === unitId);
    if (!unit) {
      return res.json({ success: false, message: 'ไม่พบหน่วยที่ระบุ' });
    }
    
    // ตรวจสอบว่า unit ถูกใช้แล้วหรือไม่
    const users = await db.getCollection('USERS');
    const existingUser = db.findInCollection(users, u => u.unitId === unitId && u.status === 'active');
    if (existingUser) {
      return res.json({ success: false, message: 'หน่วยนี้ถูกใช้แล้ว กรุณาเลือกหน่วยอื่น' });
    }
    
    // อัปเดต unit status
    unit.status = 'occupied';
    await db.updateInCollection('UNITS', u => u.unitId === unitId, () => unit);
    
    // อัปเดตหรือสร้าง user
    const appEmail = normalizeEmail(application.email);
    let user = application.userId
      ? db.findInCollection(users, u => u.userId === application.userId)
      : null;
    if (!user && appEmail) {
      user = db.findInCollection(users, u => normalizeEmail(u.email) === appEmail);
    }
    if (user) {
      user.unitId = unitId;
      user.status = 'active';
      user.role = CONFIG.ROLES.RESIDENT;
      await db.updateInCollection('USERS', u => u.userId === user.userId, () => user);
    } else {
      // สร้าง user ใหม่ (ถ้ายังไม่มี)
      const { v4: uuidv4 } = require('uuid');
      const newUser = {
        userId: 'user_' + uuidv4(),
        email: appEmail || application.email,
        passwordHash: hashPassword('TempPassword123!'), // รหัสผ่านชั่วคราว ต้องเปลี่ยนตอน login ครั้งแรก
        fullName: application.fullName,
        phone: application.phone || '',
        role: CONFIG.ROLES.RESIDENT,
        unitId: unitId,
        status: 'active',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.addToCollection('USERS', newUser);
    }
  }
  
  await auditLog('application_approve', req.session.userId, { applicationId, unitId, note });
  res.json({ success: true, message: 'อนุมัติคำร้องเรียบร้อย' });
});

router.post('/application-reject', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { applicationId, reason } = req.body;
  
  if (!applicationId) {
    return res.json({ success: false, message: 'กรุณาระบุ applicationId' });
  }
  
  // ดึงข้อมูล application
  const applications = await db.getCollection('APPLICATIONS');
  const application = db.findInCollection(applications, app => app.applicationId === applicationId);
  
  if (!application) {
    return res.json({ success: false, message: 'ไม่พบคำร้องนี้' });
  }
  
  if (application.status === 'approved') {
    return res.json({ success: false, message: 'คำร้องนี้ได้รับการอนุมัติแล้ว ไม่สามารถปฏิเสธได้' });
  }
  
  if (application.status === 'rejected') {
    return res.json({ success: false, message: 'คำร้องนี้ถูกปฏิเสธแล้ว' });
  }
  
  // อัปเดตสถานะ application
  application.status = 'rejected';
  application.rejectedAt = new Date().toISOString();
  application.rejectedBy = req.session.userId;
  application.rejectionReason = reason || '';
  await db.updateInCollection('APPLICATIONS', app => app.applicationId === applicationId, () => application);
  
  // อัปเดตสถานะ queue
  const queue = await db.getCollection('QUEUE');
  const queueItem = db.findInCollection(queue, q => q.applicationId === applicationId);
  if (queueItem) {
    queueItem.status = 'processed';
    await db.updateInCollection('QUEUE', q => q.applicationId === applicationId, () => queueItem);
  }
  
  await auditLog('application_reject', req.session.userId, { applicationId, reason });
  res.json({ success: true, message: 'ปฏิเสธคำร้องเรียบร้อย' });
});

router.get('/water-report/:roundId', requireAuth, requireRole(CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN, CONFIG.ROLES.EXECUTIVE), async (req, res) => {
  const { roundId } = req.params;
  
  // ดึงข้อมูล water readings สำหรับ round นี้
  const readings = await db.getCollection('WATER_READINGS');
  const roundReadings = readings.filter(r => r.roundId === roundId);
  
  // ดึงข้อมูล users
  const users = await db.getCollection('USERS');
  
  // ดึงข้อมูล payments
  const payments = await db.getCollection('PAYMENTS');
  
  // ดึงข้อมูล billing round
  const rounds = await db.getCollection('BILLING_ROUNDS');
  const round = rounds.find(r => r.roundId === roundId);
  
  // ดึงข้อมูล admin (หัวหน้างาน)
  const admins = users.filter(u => 
    (u.role === CONFIG.ROLES.ADMIN || u.role === CONFIG.ROLES.DEPUTY_ADMIN) && 
    u.status === 'active'
  );
  
  // ดึงข้อมูลผู้บันทึก (คนที่บันทึกค่าน้ำ - committee หรือ admin)
  const recorder = users.find(u => u.userId === req.session.userId);
  
  // สร้างรายการรายงาน
  const reportItems = [];
  let totalAmount = 0;
  let totalUnits = 0;
  
  // เรียงตาม unitId
  roundReadings.sort((a, b) => {
    const aNum = parseInt(a.unitId.replace('F', '')) || 0;
    const bNum = parseInt(b.unitId.replace('F', '')) || 0;
    if (a.unitId.startsWith('F') && !b.unitId.startsWith('F')) return 1;
    if (!a.unitId.startsWith('F') && b.unitId.startsWith('F')) return -1;
    return aNum - bNum;
  });
  
  for (const reading of roundReadings) {
    const unitUser = users.find(u => u.unitId === reading.unitId && u.status === 'active');
    const payment = payments.find(p => p.roundId === roundId && p.unitId === reading.unitId);
    const unitsUsed = reading.prevReading !== null ? 
      (reading.currentReading - reading.prevReading) : reading.currentReading;
    
    totalAmount += reading.amount || 0;
    totalUnits += unitsUsed;
    
    reportItems.push({
      unitId: reading.unitId,
      residentName: unitUser ? unitUser.fullName : '-',
      prevReading: reading.prevReading !== null ? reading.prevReading : '-',
      currentReading: reading.currentReading,
      unitsUsed: unitsUsed,
      amount: reading.amount || 0,
      paid: payment ? true : false,
      paymentDate: payment ? payment.date : null,
      paymentVerified: payment ? payment.verified : false
    });
  }
  
  // ดึงราคาน้ำต่อหน่วย
  const waterRate = await getSysConfig('waterRate') || CONFIG.DEFAULT_WATER_RATE;
  
  res.json({
    success: true,
    roundId,
    round: round ? {
      month: round.month,
      year: round.year,
      status: round.status
    } : null,
    waterRate: Number(waterRate),
    items: reportItems,
    totalUnits,
    totalAmount,
    recorder: recorder ? {
      name: recorder.fullName,
      role: recorder.role
    } : null,
    supervisor: admins.length > 0 ? {
      name: admins[0].fullName,
      role: admins[0].role
    } : null,
    reportDate: new Date().toISOString()
  });
});

module.exports = router;
