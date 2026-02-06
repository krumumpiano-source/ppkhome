const express = require('express');
const router = express.Router();
const { requireAuth, requireMenuPermission } = require('../middleware/auth');
const { auditLog } = require('../services/logic');
const db = require('../services/db');
const {
  MENU_REGISTRY,
  getEffectiveMenuPermissions,
  setUserMenuPermissions,
  clearUserOverrides
} = require('../services/permissions');

router.get('/menus', requireAuth, (req, res) => {
  res.json({ success: true, menus: MENU_REGISTRY });
});

router.get('/me', requireAuth, async (req, res) => {
  const permissions = await getEffectiveMenuPermissions(req.session.userId, req.session.role);
  res.json({
    success: true,
    allowedMenus: permissions.allowedMenuIds,
    menuRegistry: MENU_REGISTRY,
    rolePreset: permissions.roleKey
  });
});

router.get('/user/:userId', requireAuth, requireMenuPermission('MENU_ADMIN_SETTINGS'), async (req, res) => {
  const { userId } = req.params;
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const permissions = await getEffectiveMenuPermissions(userId, user.role);
  const menus = MENU_REGISTRY.map(menu => {
    const overridden = Object.prototype.hasOwnProperty.call(permissions.overrides, menu.id);
    return {
      id: menu.id,
      labelKey: menu.labelKey,
      href: menu.href,
      defaultAllowed: !!permissions.defaultPermissions[menu.id],
      allowed: !!permissions.effectivePermissions[menu.id],
      overridden
    };
  });
  res.json({
    success: true,
    user: {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName || '',
      role: user.role || '',
      status: user.status || ''
    },
    rolePreset: permissions.roleKey,
    menus
  });
});

router.post('/user/:userId', requireAuth, requireMenuPermission('MENU_ADMIN_SETTINGS'), async (req, res) => {
  const { userId } = req.params;
  const { permissions } = req.body || {};
  if (!permissions || typeof permissions !== 'object') {
    return res.json({ success: false, message: 'กรุณาระบุ permissions ให้ถูกต้อง' });
  }
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const result = await setUserMenuPermissions(userId, user.role, permissions, req.session.userId);
  if (result.changes.length > 0) {
    await auditLog('permission_update', req.session.userId, {
      targetUserId: userId,
      changes: result.changes
    });
  }
  res.json({
    success: true,
    changes: result.changes,
    rolePreset: result.roleKey
  });
});

router.post('/user/:userId/reset', requireAuth, requireMenuPermission('MENU_ADMIN_SETTINGS'), async (req, res) => {
  const { userId } = req.params;
  const users = await db.getCollection('USERS');
  const user = db.findInCollection(users, u => u.userId === userId);
  if (!user) {
    return res.json({ success: false, message: 'ไม่พบผู้ใช้' });
  }
  const removed = await clearUserOverrides(userId);
  await auditLog('permission_reset', req.session.userId, {
    targetUserId: userId,
    removed
  });
  res.json({ success: true, removed });
});

router.get('/audit', requireAuth, requireMenuPermission('MENU_ADMIN_SETTINGS'), async (req, res) => {
  const { targetUserId, limit = 50 } = req.query;
  const logs = await db.getCollection('AUDIT_LOG');
  const rows = [];
  for (let i = logs.length - 1; i >= 0 && rows.length < Number(limit); i--) {
    const log = logs[i];
    if (log.action !== 'permission_update' && log.action !== 'permission_reset') continue;
    let detail = {};
    if (log.detail) {
      try {
        detail = JSON.parse(log.detail);
      } catch (e) {
        detail = { raw: log.detail };
      }
    }
    if (targetUserId && detail.targetUserId !== targetUserId) continue;
    rows.push({
      when: log.timestamp,
      actorUserId: log.userId,
      action: log.action,
      detail
    });
  }
  res.json({ success: true, rows });
});

module.exports = router;
