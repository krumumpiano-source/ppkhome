const express = require('express');
const router = express.Router();
const { hashPassword, createSession, getSession, deleteSession, auditLog, CONFIG } = require('../services/logic');
const db = require('../services/db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }
  const users = await db.getCollection('USERS');
  const emailTrim = String(email).toLowerCase().trim();
  const user = db.findInCollection(users, u => String(u.email).toLowerCase().trim() === emailTrim);
  if (!user) {
    await auditLog('login_fail', null, { email: emailTrim });
    return res.json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }
  if (user.status === 'suspended' || user.status === 'rejected') {
    return res.json({ success: false, message: 'บัญชีนี้ถูกระงับหรือไม่ได้รับการอนุมัติ' });
  }
  if (!user.passwordHash) {
    return res.json({ success: false, message: 'บัญชียังไม่ได้ตั้งรหัสผ่าน' });
  }
  const hash = hashPassword(password);
  if (hash !== user.passwordHash) {
    await auditLog('login_fail', null, { email: emailTrim });
    return res.json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }
  const session = createSession(user.userId, user.role, user.unitId);
  await auditLog('login', user.userId, { role: user.role });
  res.json({
    success: true,
    sessionId: session.id,
    userId: user.userId,
    role: user.role,
    unitId: user.unitId || null,
    mustChangePassword: user.mustChangePassword || false,
    message: user.mustChangePassword ? 'กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน' : 'เข้าสู่ระบบสำเร็จ'
  });
});

router.post('/logout', async (req, res) => {
  const sessionId = req.body.sessionId || req.headers['x-session-id'];
  if (sessionId) {
    const session = getSession(sessionId);
    if (session) await auditLog('logout', session.userId, {});
    deleteSession(sessionId);
  }
  res.json({ success: true });
});

router.get('/session', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  const session = getSession(sessionId);
  res.json({ success: true, session });
});

router.post('/change-password', async (req, res) => {
  const { sessionId, oldPassword, newPassword } = req.body;
  const session = getSession(sessionId);
  if (!session) {
    return res.json({ success: false, message: 'กรุณาเข้าสู่ระบบใหม่' });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.json({ success: false, message: 'รหัสผ่านต้องไม่น้อยกว่า 8 ตัว และมีทั้งตัวเล็ก ตัวใหญ่ ตัวเลข และอักขระพิเศษ' });
  }
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === session.userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  if (hashPassword(oldPassword) !== user.passwordHash) {
    return res.json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
  }
  user.passwordHash = hashPassword(newPassword);
  user.mustChangePassword = false;
  await db.updateInCollection('USERS', u => u.userId === session.userId, () => user);
  await auditLog('change_password', session.userId, {});
  res.json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' });
});

router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  const users = await db.getCollection('USERS');
  const emailTrim = String(email).toLowerCase().trim();
  const user = db.findInCollection(users, u => String(u.email).toLowerCase().trim() === emailTrim);
  if (user) {
    const token = require('uuid').v4();
    db.setResetToken(token, {
      userId: user.userId,
      expires: Date.now() + 3600000
    });
    auditLog('password_reset_request', user.userId, {});
  }
  res.json({ success: true, message: 'ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์ไปที่อีเมล' });
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const resetData = db.getResetToken(token);
  if (!resetData) {
    return res.json({ success: false, message: 'ลิงก์หมดอายุหรือไม่ถูกต้อง' });
  }
  if (resetData.expires < Date.now()) {
    db.deleteResetToken(token);
    return res.json({ success: false, message: 'ลิงก์หมดอายุ' });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.json({ success: false, message: 'รหัสผ่านต้องไม่น้อยกว่า 8 ตัว' });
  }
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === resetData.userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  user.passwordHash = hashPassword(newPassword);
  user.mustChangePassword = false;
  await db.updateInCollection('USERS', u => u.userId === resetData.userId, () => user);
  db.deleteResetToken(token);
  auditLog('password_reset_done', user.userId, {});
  res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่เรียบร้อย' });
});

router.post('/register-request', async (req, res) => {
  const { fullName, email, phone } = req.body;
  if (!email || !fullName) {
    return res.json({ success: false, message: 'กรุณากรอกชื่อและอีเมลให้ครบ' });
  }
  const requests = await db.getCollection('REGISTRATION_REQUESTS');
  const emailTrim = String(email).toLowerCase().trim();
  const existing = db.findInCollection(requests, r => String(r.email).toLowerCase().trim() === emailTrim);
  if (existing) {
    return res.json({ success: false, message: 'อีเมลนี้เคยส่งคำขอลงทะเบียนแล้ว รอการตรวจสอบหรือติดต่อผู้ดูแลระบบ' });
  }
  const request = {
    requestId: 'req_' + Date.now(),
    fullName: fullName || '',
    email: email || '',
    phone: phone || '',
    status: 'pending',
    requestedAt: new Date().toISOString()
  };
  await db.addToCollection('REGISTRATION_REQUESTS', request);
  res.json({ success: true, message: 'ส่งคำขอลงทะเบียนเรียบร้อย เจ้าหน้าที่จะตรวจสอบและแจ้งผลทางอีเมล' });
});

module.exports = router;
