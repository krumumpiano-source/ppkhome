const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditLog, CONFIG, hashPassword, isPasswordComplex, getUnitIds, normalizeUnitId } = require('../services/logic');
const db = require('../services/db');
const { v4: uuidv4 } = require('uuid');

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

router.get('/registration-requests', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const requests = await db.getCollection('REGISTRATION_REQUESTS');
  const list = requests.map(r => ({
    requestId: r.requestId,
    fullName: r.fullName || '',
    email: r.email || '',
    phone: r.phone || '',
    unitId: r.unitId || '',
    status: r.status || 'pending',
    requestedAt: r.requestedAt || null
  }));
  list.sort((a, b) => String(b.requestedAt || '').localeCompare(String(a.requestedAt || '')));
  res.json({ success: true, requests: list });
});

router.post('/registration-approve', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { requestId, unitId, role, initialPassword } = req.body;
  if (!requestId) {
    return res.json({ success: false, message: 'กรุณาระบุ requestId' });
  }
  const requests = await db.getCollection('REGISTRATION_REQUESTS');
  const request = db.findInCollection(requests, r => r.requestId === requestId);
  if (!request) {
    return res.json({ success: false, message: 'ไม่พบคำขอลงทะเบียน' });
  }
  if (request.status && String(request.status).toLowerCase() !== 'pending') {
    return res.json({ success: false, message: 'คำขอนี้ได้รับการดำเนินการแล้ว' });
  }
  const normalizedUnit = normalizeUnitId(unitId || request.unitId);
  const unitIds = getUnitIds();
  const validUnits = unitIds.house.concat(unitIds.flat);
  if (!normalizedUnit || validUnits.indexOf(normalizedUnit) < 0) {
    return res.json({ success: false, message: 'กรุณาระบุเลขที่บ้าน/แฟลตให้ถูกต้อง' });
  }
  const allowedRoles = [
    CONFIG.ROLES.RESIDENT,
    CONFIG.ROLES.COMMITTEE,
    CONFIG.ROLES.ACCOUNTING,
    CONFIG.ROLES.EXECUTIVE
  ];
  const targetRole = allowedRoles.indexOf(role) >= 0 ? role : CONFIG.ROLES.RESIDENT;
  let finalPassword = initialPassword || CONFIG.DEFAULT_TEMP_PASSWORD;
  if (!isPasswordComplex(finalPassword)) {
    return res.json({ success: false, message: 'รหัสผ่านเริ่มต้นต้องมีอย่างน้อย 8 ตัว และมีตัวเล็ก ตัวใหญ่ ตัวเลข และอักขระพิเศษ' });
  }

  const users = await db.getCollection('USERS');
  const emailTrim = String(request.email || '').toLowerCase().trim();
  if (!emailTrim) {
    return res.json({ success: false, message: 'ไม่พบอีเมลในคำขอลงทะเบียน' });
  }
  let user = db.findInCollection(users, u => String(u.email || '').toLowerCase().trim() === emailTrim);
  if (user && String(user.status || '').toLowerCase() === 'active') {
    return res.json({ success: false, message: 'อีเมลนี้มีบัญชีใช้งานอยู่แล้ว' });
  }
  if (user) {
    user.fullName = request.fullName || user.fullName || '';
    user.phone = request.phone || user.phone || '';
    user.unitId = normalizedUnit || user.unitId || '';
    user.role = targetRole || user.role || CONFIG.ROLES.RESIDENT;
    user.status = 'active';
    user.mustChangePassword = true;
    user.passwordHash = hashPassword(finalPassword);
    user.updatedAt = new Date().toISOString();
    await db.updateInCollection('USERS', u => u.userId === user.userId, () => user);
  } else {
    user = {
      userId: 'user_' + uuidv4(),
      email: request.email || '',
      passwordHash: hashPassword(finalPassword),
      fullName: request.fullName || '',
      phone: request.phone || '',
      role: targetRole,
      unitId: normalizedUnit,
      status: 'active',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.addToCollection('USERS', user);
  }

  request.status = 'approved';
  request.approvedAt = new Date().toISOString();
  request.approvedBy = req.session.userId;
  request.approvedUnitId = normalizedUnit;
  request.approvedRole = targetRole;
  await db.updateInCollection('REGISTRATION_REQUESTS', r => r.requestId === requestId, () => request);

  const units = await db.getCollection('UNITS');
  const unit = db.findInCollection(units, u => u.unitId === normalizedUnit);
  if (unit && unit.status !== 'occupied') {
    unit.status = 'occupied';
    await db.updateInCollection('UNITS', u => u.unitId === normalizedUnit, () => unit);
  }

  await auditLog('registration_approve', req.session.userId, { requestId, unitId: normalizedUnit, role: targetRole });
  res.json({ success: true, message: 'อนุมัติคำขอลงทะเบียนเรียบร้อย', initialPassword: finalPassword });
});

router.post('/registration-reject', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { requestId, reason } = req.body;
  if (!requestId) {
    return res.json({ success: false, message: 'กรุณาระบุ requestId' });
  }
  const requests = await db.getCollection('REGISTRATION_REQUESTS');
  const request = db.findInCollection(requests, r => r.requestId === requestId);
  if (!request) {
    return res.json({ success: false, message: 'ไม่พบคำขอลงทะเบียน' });
  }
  if (request.status && String(request.status).toLowerCase() !== 'pending') {
    return res.json({ success: false, message: 'คำขอนี้ได้รับการดำเนินการแล้ว' });
  }
  request.status = 'rejected';
  request.rejectedAt = new Date().toISOString();
  request.rejectedBy = req.session.userId;
  request.rejectionReason = reason || '';
  await db.updateInCollection('REGISTRATION_REQUESTS', r => r.requestId === requestId, () => request);
  await auditLog('registration_reject', req.session.userId, { requestId, reason: reason || '' });
  res.json({ success: true, message: 'ปฏิเสธคำขอลงทะเบียนเรียบร้อย' });
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
  
  // อัปเดตสถานะ unit เป็น vacant เมื่อไม่มีผู้พักอาศัย active แล้ว
  if (oldUnitId) {
    const remaining = users.some(u => u.unitId === oldUnitId && u.status === 'active' && u.userId !== targetUserId);
    if (!remaining) {
      const units = await db.getCollection('UNITS');
      const unit = db.findInCollection(units, u => u.unitId === oldUnitId);
      if (unit) {
        unit.status = 'vacant';
        await db.updateInCollection('UNITS', u => u.unitId === oldUnitId, () => unit);
      }
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
