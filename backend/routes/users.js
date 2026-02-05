const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog, CONFIG } = require('../services/logic');
const db = require('../services/db');

router.get('/profile', requireAuth, async (req, res) => {
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === req.session.userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const profile = {
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    unitId: user.unitId,
    status: user.status
  };
  res.json({ success: true, profile });
});

router.post('/profile', requireAuth, async (req, res) => {
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === req.session.userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const { fullName, phone, householdMembers, email } = req.body;
  const allowed = ['fullName', 'phone', 'householdMembers'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      user[key] = req.body[key];
    }
  }
  if (email) {
    user.email = email;
    await auditLog('profile_update', req.session.userId, { field: 'email' });
  }
  await db.updateInCollection('USERS', u => u.userId === req.session.userId, () => user);
  await auditLog('profile_update', req.session.userId, {});
  res.json({ success: true, message: 'บันทึกเรียบร้อย' });
});

router.get('/list', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const users = await db.getCollection('USERS');
  const userList = users.map(u => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  res.json({ success: true, users: userList });
});

router.post('/set-status-or-role', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { targetUserId, actionType, value } = req.body;
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === targetUserId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  if (actionType === 'status') {
    user.status = value;
    await auditLog('user_status', req.session.userId, { target: targetUserId, value });
  }
  if (actionType === 'role') {
    user.role = value;
    await auditLog('user_role', req.session.userId, { target: targetUserId, value });
  }
  await db.updateInCollection('USERS', u => u.userId === targetUserId, () => user);
  res.json({ success: true, message: 'บันทึกเรียบร้อย' });
});

router.post('/move-out', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { targetUserId, reason } = req.body;
  
  if (!targetUserId) {
    return res.json({ success: false, message: 'กรุณาระบุ targetUserId' });
  }
  
  // ดึงข้อมูล user
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === targetUserId);
  
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  
  // ตรวจสอบว่าเป็น admin หรือไม่ (ห้ามลบ admin)
  if (user.role === CONFIG.ROLES.ADMIN) {
    return res.json({ success: false, message: 'ไม่สามารถย้ายออกผู้ดูแลระบบได้' });
  }
  
  // ตรวจสอบว่าย้ายออกแล้วหรือยัง
  if (user.status === 'moved_out') {
    return res.json({ success: false, message: 'ผู้ใช้รายนี้ย้ายออกแล้ว' });
  }
  
  const oldUnitId = user.unitId;
  
  // อัปเดตสถานะ user
  user.status = 'moved_out';
  user.movedOutAt = new Date().toISOString();
  user.movedOutBy = req.session.userId;
  user.movedOutReason = reason || '';
  user.previousUnitId = oldUnitId; // เก็บ unitId เดิมไว้
  user.unitId = null; // ล้าง unitId
  
  await db.updateInCollection('USERS', u => u.userId === targetUserId, () => user);
  
  // อัปเดตสถานะ unit เป็น vacant (ถ้ามี unitId)
  if (oldUnitId) {
    const units = await db.getCollection('UNITS');
    const unit = db.findInCollection(units, u => u.unitId === oldUnitId);
    if (unit) {
      unit.status = 'vacant';
      await db.updateInCollection('UNITS', u => u.unitId === oldUnitId, () => unit);
    }
  }
  
  await auditLog('user_move_out', req.session.userId, { 
    target: targetUserId, 
    previousUnitId: oldUnitId,
    reason: reason || '' 
  });
  
  res.json({ 
    success: true, 
    message: 'ย้ายออกเรียบร้อย (ข้อมูลยังเก็บไว้ย้อนหลัง)',
    previousUnitId: oldUnitId
  });
});

module.exports = router;
