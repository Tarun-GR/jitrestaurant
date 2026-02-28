const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const CHATBOT_RESPONSES = {
  menu: "Our menu features a variety of dishes including vegetarian, vegan, and gluten-free options. Ask for today's specials or any dish details!",
  specials: "Today's specials are Butter Chicken, Paneer Tikka, and Garlic Naan. Would you like to know more?",
  ingredients: "You can view ingredients for any dish by asking, e.g., 'What are the ingredients in Veg Biryani?'",
  recommend: "I recommend our Chef's Special: Masala Dosa with Coconut Chutney!",
  dish: "Ask about any dish for details, price, or ingredients.",
  inventory: "You can check current stock, add new items, or get low stock alerts. Ask 'What's low in stock?' or 'Add new batch'.",
  stock: "To check stock levels, go to the Inventory section. Low stock items are highlighted for your convenience.",
  supplier: "To add a new supplier, go to the Inventory page and click 'New Supplier'. You can also view supplier contact info here.",
  batch: "Add a new inventory batch from the Inventory Batches section. Enter item, quantity, and expiry date.",
  order: "To place an order, add items to your cart and proceed to checkout. You can track order status in the Orders section.",
  'order status': "Order statuses include: Pending, Preparing, Ready, Served, and Cancelled. Ask for a specific order's status by order ID.",
  'cancel order': "To cancel an order, go to Orders, select the order, and click 'Cancel'.",
  'track order': "Track your order in the Orders section. You'll see real-time status updates.",
  'recent orders': "View recent orders in the Orders section. You can also see order details and status.",
  sales: "View daily, weekly, or monthly sales analytics in the Sales section. Ask for 'today's sales' or 'top selling dishes'.",
  analytics: "Sales analytics include revenue, bestsellers, and trends. Go to the Sales section for details.",
  revenue: "Revenue reports are available in the Sales section. You can filter by date or dish.",
  staff: "Staff can log in, view schedules, and manage orders. Admins can add or remove staff from the Admin panel.",
  'staff login': "Staff can log in from the Restaurant Login page using their credentials.",
  'staff schedule': "Staff schedules are managed by the admin. Contact your manager for details.",
  customer: "Customers can place orders, give feedback, and join our loyalty program. Ask about 'customer rewards' or 'feedback'.",
  feedback: "We value customer feedback! Use the Contact section or ask staff for a feedback form.",
  loyalty: "Our loyalty program rewards frequent customers. Ask about your points or rewards at checkout.",
  admin: "Admins can manage users, view reports, and adjust system settings. For help, type 'admin help'.",
  'user management': "Admins can add, edit, or remove users from the Admin panel.",
  settings: "System settings are available to admins in the Admin panel.",
  report: "Generate sales, inventory, and staff reports from the Admin panel.",
  hours: "We are open from 10am to 11pm, 7 days a week.",
  timings: "Our restaurant operates daily from 10am to 11pm.",
  address: "We are located at #42, Whitefield Tech Park, Bangalore.",
  location: "Find us at #42, Whitefield Tech Park, ITPL Main Road, Bangalore.",
  contact: "Contact us at contact@jitrestaurant.com or +91 80 4567 8900.",
  phone: "You can reach us at +91 80 4567 8900.",
  email: "Email us at contact@jitrestaurant.com for any queries.",
  events: "We host special events and offers. Check our website or ask for upcoming events!",
  policy: "For our restaurant policies, please ask about a specific topic (e.g., refund, reservation, etc.).",
  'login problem': "If you're having trouble logging in, try resetting your password or contact support.",
  'order error': "If you encounter an order error, please refresh the page or contact admin.",
  payment: "For payment issues, ensure your details are correct or contact support.",
  support: "For any issues, contact our support team at support@jitrestaurant.com.",
  help: "I can help you with menu, orders, inventory, sales, staff, and more. Just type your question!",
  features: "Key features: Menu management, Inventory, Orders, Sales analytics, Staff management, Customer feedback, and AI assistant.",
  chatbot: "I'm your AI assistant! Ask me anything about the restaurant system.",
  'what can you do': "I can answer questions about menu, orders, inventory, sales, staff, admin, and more!"
};

router.post('/chatbot', requireAuth, (req, res) => {
  try {
    const userMessage = (req.body.message || '').toLowerCase();
    let response = null;
    for (const [key, resp] of Object.entries(CHATBOT_RESPONSES)) {
      if (userMessage.includes(key)) {
        response = resp;
        break;
      }
    }
    if (!response) {
      response = "I'm here to help with anything related to our restaurant system: menu, orders, inventory, sales, staff, admin, and more. Please rephrase your question or ask for 'help' to see what I can do!";
    }
    res.json({ response, status: 'success' });
  } catch (e) {
    res.status(500).json({ response: "Sorry, an error occurred. Please try again.", status: 'error' });
  }
});

router.post('/create_order', requireAuth, async (req, res) => {
  try {
    const data = req.body || {};
    let items = data.items;
    const isFormPost = !items && req.session.staffCart && req.session.staffCart.length && (data.customer_name != null || req.body.customer_name);
    if (isFormPost) items = req.session.staffCart;
    if (!items || !Array.isArray(items) || items.length === 0) {
      if (isFormPost) {
        req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Cart is empty.' }]);
        return res.redirect('/staff/checkout');
      }
      return res.json({ success: false, error: 'Invalid order data' });
    }
    const customerName = (data.customer_name || req.body.customer_name || '').trim();
    if (!customerName && isFormPost) {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Customer name is required.' }]);
      return res.redirect('/staff/checkout');
    }
    const total = data.total != null ? Number(data.total) : items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    const orderId = await db.createOrderWithItems(
      customerName || (data.customer_name || ''),
      data.order_date || new Date(),
      total,
      data.status || 'Pending',
      items
    );
    if (!orderId) {
      if (isFormPost) {
        req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: 'Database connection failed.' }]);
        return res.redirect('/staff/checkout');
      }
      return res.json({ success: false, error: 'Database connection failed' });
    }
    if (isFormPost) {
      req.session.staffCart = [];
      req.session.flash = (req.session.flash || []).concat([{ category: 'success', message: 'Order placed successfully!' }]);
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.redirect('/staff_landing');
      });
      return;
    }
    res.json({ success: true, order_id: orderId });
  } catch (e) {
    console.error('create_order error:', e);
    if (req.session.staffCart && req.body && req.body.customer_name != null) {
      req.session.flash = (req.session.flash || []).concat([{ category: 'error', message: e.message || 'Could not place order.' }]);
      return res.redirect('/staff/checkout');
    }
    res.json({ success: false, error: e.message });
  }
});

router.post('/add_to_cart', requireAuth, (req, res) => {
  const dish_id = req.body.dish_id;
  const dish_name = req.body.dish_name;
  const price = parseFloat(req.body.price);
  if (!req.session.cart) req.session.cart = [];
  const existing = req.session.cart.find((item) => String(item.id) === String(dish_id));
  if (existing) existing.quantity += 1;
  else req.session.cart.push({ id: dish_id, name: dish_name, price, quantity: 1 });
  res.json({ success: true, cart_count: req.session.cart.length });
});

router.post('/update_order_status', async (req, res) => {
  const order_id = req.body.order_id;
  const new_status = req.body.new_status;
  if (!order_id || !new_status) return res.status(400).json({ success: false, error: 'Missing data' });
  try {
    const ok = await db.updateOrderStatus(order_id, new_status);
    if (ok) return res.json({ success: true });
    return res.status(400).json({ success: false, error: 'Order not found or invalid status' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/create_batch', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.item_name || data.quantity == null || !data.expiry_date) {
      return res.json({ success: false, error: 'Missing required fields' });
    }
    const ok = await db.createBatch(data.item_name, data.quantity, data.expiry_date);
    if (!ok) return res.json({ success: false, error: 'Item not found' });
    res.json({ success: true, message: 'Batch created successfully' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/create_item', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || data.name == null || data.quantity == null || data.unit == null || data.reorder_level == null) {
      return res.json({ success: false, error: 'Missing required fields' });
    }
    await db.createItem(data.name, data.quantity, data.unit, data.reorder_level);
    res.json({ success: true, message: 'Item created successfully' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/create_supplier', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.name || !data.contact_info || !data.items_supplied) {
      return res.json({ success: false, error: 'Missing required fields' });
    }
    await db.createSupplier(data.name, data.contact_info, data.items_supplied);
    res.json({ success: true, message: 'Supplier created successfully' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

module.exports = router;
