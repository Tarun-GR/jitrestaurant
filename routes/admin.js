const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin, flashToLocals, hashPassword } = require('../middleware/auth');

router.get('/admin_landing', requireAdmin, flashToLocals, async (req, res) => {
  try {
    const [customer_orders, inventory_batches, inventory_items, sales, suppliers, order_details] = await Promise.all([
      db.fetchOrders(),
      db.fetchBatches(),
      db.fetchInventory(),
      db.fetchSales(),
      db.fetchSuppliers(),
      db.fetchRecentOrders()
    ]);
    res.render('admin_landing', {
      admin_name: req.session.user.username,
      customer_orders,
      inventory_batches,
      inventory_items,
      sales,
      suppliers,
      order_details,
      error: null
    });
  } catch (e) {
    console.error('Admin landing error:', e);
    res.render('admin_landing', {
      admin_name: req.session.user?.username,
      customer_orders: [],
      inventory_batches: [],
      inventory_items: [],
      sales: [],
      suppliers: [],
      order_details: [],
      error: e.message
    });
  }
});

router.post('/admin/add_staff', requireAdmin, express.json(), express.urlencoded({ extended: true }), async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();
  if (!username || !password) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Username and password are required.' }]);
    return res.redirect('/admin_landing');
  }
  if (password.length < 6) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Password must be at least 6 characters.' }]);
    return res.redirect('/admin_landing');
  }
  try {
    const hashed = hashPassword(password);
    const staffId = await db.createStaff(username, hashed);
    if (staffId) {
      req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Staff member "' + username + '" added. They can now log in from Staff Login.' }]);
    } else {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Username already exists. Choose a different username.' }]);
    }
  } catch (e) {
    if (e.code === 11000) {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Username already exists. Choose a different username.' }]);
    } else {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: e.message || 'Failed to add staff.' }]);
    }
  }
  res.redirect('/admin_landing');
});

module.exports = router;
