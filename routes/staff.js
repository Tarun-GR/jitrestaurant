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

module.exports = router;
