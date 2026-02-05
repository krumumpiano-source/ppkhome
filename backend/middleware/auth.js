const { getSession } = require('../services/logic');

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

module.exports = {
  requireAuth,
  requireRole
};
