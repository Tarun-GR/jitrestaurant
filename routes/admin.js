const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin, flashToLocals } = require('../middleware/auth');

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

module.exports = router;
