const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireStaff, flashToLocals } = require('../middleware/auth');

router.get('/staff_landing', requireStaff, flashToLocals, async (req, res) => {
  try {
    const [customer_orders, dishes, order_details] = await Promise.all([
      db.fetchOrders(),
      db.fetchAllDishes(),
      db.fetchRecentOrders()
    ]);
    res.render('staff_landing', {
      staff_name: req.session.user.username,
      customer_orders: customer_orders || [],
      dishes: dishes || [],
      order_details: order_details || [],
      error: null
    });
  } catch (e) {
    console.error('Staff landing error:', e);
    res.render('staff_landing', {
      staff_name: req.session.user?.username,
      customer_orders: [],
      dishes: [],
      order_details: [],
      error: e.message
    });
  }
});

router.post('/staff/set_cart', requireStaff, express.json(), (req, res) => {
  const items = req.body && req.body.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty', redirect: null });
  }
  req.session.staffCart = items;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Could not save cart', redirect: null });
    res.json({ redirect: '/staff/checkout' });
  });
});

router.get('/staff/checkout', requireStaff, flashToLocals, (req, res) => {
  const cart = req.session.staffCart;
  if (!cart || !cart.length) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Your cart is empty. Add items first.' }]);
    return res.redirect('/staff_landing');
  }
  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  res.render('staff_checkout', {
    staff_name: req.session.user.username,
    cart,
    total,
    messages: res.locals.messages || []
  });
});

module.exports = router;
