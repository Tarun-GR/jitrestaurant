const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth, flashToLocals } = require('../middleware/auth');

router.get('/dashboard', requireAuth, flashToLocals, async (req, res) => {
  try {
    const [dishes, inventory, orders, sales] = await Promise.all([
      db.fetchAllDishes(),
      db.fetchInventory(),
      db.fetchOrders(),
      db.fetchSales()
    ]);
    res.render('dashboard', {
      user: req.session.user,
      dishes: dishes || [],
      inventory: inventory || [],
      orders: orders || [],
      sales: sales || [],
      error: null
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    res.render('dashboard', { user: req.session.user, error: e.message });
  }
});

router.post('/contact', requireAuth, flashToLocals, (req, res) => {
  req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: "Thank you! We'll get back to you soon." }]);
  res.redirect('/dashboard');
});

router.get('/menu', requireAuth, flashToLocals, async (req, res) => {
  try {
    const [dishes, ingredients] = await Promise.all([db.fetchAllDishes(), db.fetchIngredients()]);
    res.render('menu', { user: req.session.user, dishes: dishes || [], ingredients: ingredients || [], error: null });
  } catch (e) {
    res.render('menu', { user: req.session.user, error: e.message });
  }
});

router.get('/inventory', requireAuth, flashToLocals, async (req, res) => {
  try {
    const [inventory, batches, suppliers] = await Promise.all([
      db.fetchInventory(),
      db.fetchBatches(),
      db.fetchSuppliers()
    ]);
    res.render('inventory', {
      user: req.session.user,
      inventory: inventory || [],
      batches: batches || [],
      suppliers: suppliers || [],
      error: null
    });
  } catch (e) {
    res.render('inventory', { user: req.session.user, error: e.message });
  }
});

router.get('/orders', requireAuth, flashToLocals, async (req, res) => {
  try {
    const [orders, sales] = await Promise.all([db.fetchOrders(), db.fetchSales()]);
    res.render('orders', { user: req.session.user, orders: orders || [], sales: sales || [], error: null });
  } catch (e) {
    res.render('orders', { user: req.session.user, error: e.message });
  }
});

router.get('/partners', requireAuth, flashToLocals, (req, res) => res.render('partners'));
router.get('/subscription', requireAuth, flashToLocals, (req, res) => res.render('subscription'));

router.get('/checkout', requireAuth, flashToLocals, (req, res) => {
  const cart = req.session.cart;
  if (!cart || !cart.length) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Your cart is empty' }]);
    return res.redirect('/menu');
  }
  const total_amount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.render('checkout', { cart_items: cart, total_amount });
});

router.post('/process_checkout', requireAuth, async (req, res) => {
  const cart = req.session.cart;
  if (!cart || !cart.length) {
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Your cart is empty' }]);
    return res.redirect('/menu');
  }
  const { name, email, phone, address } = req.body;
  try {
    await db.createCustomerAndOrder(name, phone, email, cart);
    req.session.cart = [];
    req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Order placed successfully!' }]);
    return res.redirect('/dashboard');
  } catch (e) {
    console.error('Checkout error:', e);
    req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'An error occurred while processing your order' }]);
    return res.redirect('/checkout');
  }
});

module.exports = router;
