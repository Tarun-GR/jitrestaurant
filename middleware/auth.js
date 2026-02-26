const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Please log in to access this page.' }]);
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) return next();
  req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Please login as admin to access this page.' }]);
  return res.redirect('/restaurant_login');
}

function requireStaff(req, res, next) {
  if (req.session && req.session.user && !req.session.user.is_admin) return next();
  req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Please login as staff to access this page.' }]);
  return res.redirect('/restaurant_login');
}

// Move flash messages to res.locals and clear session flash (call before render)
function flashToLocals(req, res, next) {
  res.locals.messages = req.session.flash || [];
  req.session.flash = [];
  next();
}

module.exports = {
  hashPassword,
  requireAuth,
  requireAdmin,
  requireStaff,
  flashToLocals
};
