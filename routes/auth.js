const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { hashPassword, requireAuth, flashToLocals } = require('../middleware/auth');

router.get('/', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

router.get('/login', flashToLocals, (req, res) => {
  if (req.session && req.session.user) return res.redirect('/dashboard');
  res.render('login');
});

router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim();
  const password = (req.body.pswd || '').trim();
  console.log('Login attempt:', email || '(no email)');
  if (!email || !password) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Email and password are required.' }]);
    return res.redirect('/login');
  }
  const hashed = hashPassword(password);
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const user = await db.findUserByEmailAndPassword(email, hashed);
    if (user) {
      console.log('Login success:', user.email);
      req.session.user = { id: user.id, username: user.username, email: user.email, is_admin: false };
      req.session.permanent = true;
      const loginId = await db.logLogin(user.id, user.username, 'user', ip);
      req.session.login_id = loginId;
      await db.logUserActivity(user.id, user.username, 'user', 'Login', 'Login successful', ip);
      req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Welcome back!' }]);
      req.session.save((err) => {
        if (err) {
          console.error('Session save error on login:', err);
          return res.redirect('/login');
        }
        res.redirect(302, '/dashboard');
      });
      return;
    }
    console.log('Login: user not found for', email);
    await db.logUserActivity(null, email, 'user', 'Login Failed', 'Invalid credentials', ip, 'failed');
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Invalid email or password' }]);
    return res.redirect('/login');
  } catch (e) {
    console.error('Login error:', e.message || e);
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'An error occurred during login.' }]);
    return res.redirect('/login');
  }
});

router.get('/restaurant_login', flashToLocals, (req, res) => {
  res.render('restaurant_login');
});

router.post('/admin_login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const ip = req.ip || req.connection.remoteAddress;

  if (username === 'admin' && password === 'admin123') {
    req.session.user = { id: 0, username: 'admin', email: 'admin@jitrestaurant.com', is_admin: true };
    req.session.permanent = true;
    const loginId = await db.logLogin(null, username, 'admin', ip);
    req.session.login_id = loginId;
    await db.logUserActivity(null, username, 'admin', 'Login', 'Admin login successful', ip);
    req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Welcome back, Admin!' }]);
    req.session.save((err) => {
      if (err) return res.redirect('/restaurant_login');
      res.redirect('/admin_landing');
    });
    return;
  }
  await db.logUserActivity(null, username, 'admin', 'Login Failed', 'Invalid admin credentials', ip, 'failed');
  req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Invalid admin credentials' }]);
  return res.redirect('/restaurant_login');
});

router.post('/staff_login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const ip = req.ip || req.connection.remoteAddress;

  if (username === 'staff' && password === 'staff123') {
    req.session.user = { id: 1, username: 'staff', email: 'staff@jitrestaurant.com', is_admin: false };
    req.session.permanent = true;
    const loginId = await db.logLogin(1, username, 'staff', ip);
    req.session.login_id = loginId;
    await db.logUserActivity(1, username, 'staff', 'Login', 'Staff login successful', ip);
    req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Welcome back!' }]);
    req.session.save((err) => {
      if (err) return res.redirect('/restaurant_login');
      res.redirect('/staff_landing');
    });
    return;
  }
  await db.logUserActivity(null, username, 'staff', 'Login Failed', 'Invalid staff credentials', ip, 'failed');
  req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Invalid staff credentials' }]);
  return res.redirect('/restaurant_login');
});

router.post('/signup', async (req, res) => {
  const username = (req.body.txt || '').trim();
  const email = (req.body.email || '').trim();
  const phone = (req.body.broj || '').trim();
  const password = req.body.pswd || '';

  if (!username || !email || !phone || !password) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'All fields are required.' }]);
    return res.redirect('/login');
  }
  if (password.length < 6) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Password must be at least 6 characters long.' }]);
    return res.redirect('/login');
  }
  if (!email.includes('@') || !email.includes('.')) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Please enter a valid email address.' }]);
    return res.redirect('/login');
  }
  if (!/^\d{10}$/.test(phone)) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Please enter a valid 10-digit phone number.' }]);
    return res.redirect('/login');
  }

  const hashed = hashPassword(password);
  console.log('Signup attempt:', email);
  try {
    const existing = await db.findExistingUser(username, email);
    if (existing) {
      console.log('Signup: username or email already exists');
      const msg = existing.username === username ? 'Username already exists.' : 'Email already registered.';
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: msg }]);
      return res.redirect('/login');
    }
    await db.createUser(username, email, phone, hashed);
    console.log('Signup success:', email);
    req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Signup successful! Please log in.' }]);
    req.session.save((err) => {
      if (err) return res.redirect('/login');
      res.redirect('/login');
    });
    return;
  } catch (e) {
    console.error('Signup error:', e.message || e, e.code ? '(code ' + e.code + ')' : '');
    if (e.code === 11000) {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Username or email already exists.' }]);
    } else {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: e.message || 'An error occurred.' }]);
    }
    return res.redirect('/login');
  }
});

router.get('/logout', requireAuth, async (req, res) => {
  const user = req.session.user;
  const loginId = req.session.login_id;
  if (loginId) await db.logLogout(loginId);
  await db.logUserActivity(user.id, user.username, 'user', 'Logout', 'User logged out successfully', req.ip);
  const referrer = req.get('Referrer') || '';
  req.session.destroy(() => {
    if (referrer.includes('staff_landing') || referrer.includes('admin_landing')) return res.redirect('/restaurant_login');
    res.redirect('/login');
  });
});

module.exports = router;
