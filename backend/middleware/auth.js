const { getSession } = require('../services/logic');
const { getEffectiveMenuPermissions } = require('../services/permissions');

function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.body.sessionId || req.query.sessionId;
  if (!sessionId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.session = session;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    next();
  };
}

function requireMenuPermission(menuIds, permission) {
  const targetMenuIds = Array.isArray(menuIds) ? menuIds : [menuIds];
  return async (req, res, next) => {
    try {
      if (!req.session) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const perms = await getEffectiveMenuPermissions(req.session.userId, req.session.role);
      const allowed = targetMenuIds.some(menuId => perms.effectivePermissions[menuId]);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
      }
      next();
    } catch (err) {
      console.error('requireMenuPermission error:', err.message);
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบสิทธิ์' });
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireMenuPermission
};
