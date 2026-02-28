const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

// Fail fast if DB is unreachable (avoid long buffering/hangs)
mongoose.set('bufferCommands', false);

// --- Schemas (match your SQL structure for compatibility) ---
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone_number: String,
  password: String
}, { timestamps: true });

const DishSchema = new mongoose.Schema({
  Name: String,
  Price: Number,
  Category: { type: String, default: '' }
});
DishSchema.virtual('Dish_ID').get(function() { return this._id; });
DishSchema.set('toJSON', { virtuals: true });
DishSchema.set('toObject', { virtuals: true });

const InventoryItemSchema = new mongoose.Schema({
  Name: String,
  Quantity: Number,
  Unit: String,
  Reorder_Level: Number
});

const InventoryBatchSchema = new mongoose.Schema({
  Item_ID: mongoose.Schema.Types.ObjectId,
  Quantity: Number,
  Expiry_Date: Date
});

const SupplierSchema = new mongoose.Schema({
  Name: String,
  Contact_Info: String,
  Items_Supplied: String
});

const CustomerSchema = new mongoose.Schema({
  Name: String,
  Phone_Number: String,
  Email: String
});

const OrderSchema = new mongoose.Schema({
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  Customer_Name: String,
  Order_Date: { type: Date, default: Date.now },
  Total_Amount: Number,
  Status: { type: String, default: 'Pending' }
});

const OrderDetailSchema = new mongoose.Schema({
  Order_ID: mongoose.Schema.Types.ObjectId,
  Item_ID: mongoose.Schema.Types.ObjectId,
  Item_Name: String,
  Quantity: Number,
  Unit_Price: Number,
  Subtotal: Number
});

const CustomerOrderSchema = new mongoose.Schema({
  Customer_ID: mongoose.Schema.Types.ObjectId,
  Order_Date: { type: Date, default: Date.now },
  Total_Amount: Number,
  Status_ID: Number
});

const SalesSchema = new mongoose.Schema({
  Dish_ID: mongoose.Schema.Types.ObjectId,
  Sale_Date: Date,
  Quantity_Sold: Number
});

const ConcludedSalesSchema = new mongoose.Schema({
  Sale_Date: { type: Date, required: true },
  Total_Amount: Number,
  Order_Count: Number,
  Orders: [{ Order_ID: mongoose.Schema.Types.ObjectId, Amount: Number }]
});
ConcludedSalesSchema.index({ Sale_Date: 1 }, { unique: true });

const LoginHistorySchema = new mongoose.Schema({
  User_ID: mongoose.Schema.Types.Mixed,
  Username: String,
  Role: String,
  IP_Address: String,
  Login_Status: String,
  Login_Time: { type: Date, default: Date.now },
  Logout_Time: Date,
  Session_Duration: Number
});

const UserActivityLogSchema = new mongoose.Schema({
  User_ID: mongoose.Schema.Types.Mixed,
  Username: String,
  Role: String,
  Action: String,
  Action_Details: String,
  IP_Address: String,
  Status: String,
  Timestamp: { type: Date, default: Date.now }
});

const DishIngredientSchema = new mongoose.Schema({
  Dish_ID: mongoose.Schema.Types.ObjectId,
  Item_ID: mongoose.Schema.Types.ObjectId,
  Quantity: Number
});

const StaffSchema = new mongoose.Schema({
  Username: { type: String, required: true, trim: true },
  Password: { type: String, required: true }
});
StaffSchema.index({ Username: 1 }, { unique: true });

// Models
const User = mongoose.model('User', UserSchema);
const Staff = mongoose.model('Staff', StaffSchema);
const Dish = mongoose.model('Dish', DishSchema);
const InventoryItem = mongoose.model('InventoryItem', InventoryItemSchema);
const InventoryBatch = mongoose.model('InventoryBatch', InventoryBatchSchema);
const Supplier = mongoose.model('Supplier', SupplierSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Order = mongoose.model('Order', OrderSchema);
const OrderDetail = mongoose.model('OrderDetail', OrderDetailSchema);
const CustomerOrder = mongoose.model('CustomerOrder', CustomerOrderSchema);
const Sales = mongoose.model('Sales', SalesSchema);
const ConcludedSales = mongoose.model('ConcludedSales', ConcludedSalesSchema);
const LoginHistory = mongoose.model('LoginHistory', LoginHistorySchema);
const UserActivityLog = mongoose.model('UserActivityLog', UserActivityLogSchema);
const DishIngredient = mongoose.model('DishIngredient', DishIngredientSchema);

let isConnected = false;

async function connect() {
  if (isConnected) return mongoose.connection;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      autoSelectFamily: false,
      family: 4,
      dbName: 'jitrestaurant'  // force this database regardless of URI path
    });
    isConnected = true;
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (e) {
    console.error('MongoDB connection error:', e.message);
    return null;
  }
}

async function getConnection() {
  const conn = await connect();
  return conn;
}

function toPlain(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  if (o._id) {
    o.id = o._id.toString();
    o.Order_ID = o.Order_ID || o._id?.toString();
    o.Item_ID = o.Item_ID || o._id?.toString();
    o.Dish_ID = o.Dish_ID || o._id?.toString();
    o.Customer_ID = o.Customer_ID || o._id?.toString();
    o.Batch_ID = o.Batch_ID || o._id?.toString();
    o.Supplier_ID = o.Supplier_ID || o._id?.toString();
    o.Sale_ID = o.Sale_ID || o._id?.toString();
  }
  return o;
}

function mapDish(doc) {
  const o = toPlain(doc);
  if (o) {
    o.ID = o._id?.toString();
    o.Dish_ID = o._id?.toString();
  }
  return o;
}

async function fetchAllDishes() {
  await connect();
  const docs = await Dish.find().lean();
  return (docs || []).map(d => ({ ID: d._id.toString(), Name: d.Name, Price: d.Price, Category: d.Category || '' }));
}

async function seedDishesIfEmpty() {
  await connect();
  const count = await Dish.countDocuments();
  if (count > 0) return;
  const defaultDishes = [
    { Name: 'Butter Chicken', Price: 299, Category: 'Main Course' },
    { Name: 'Paneer Tikka', Price: 249, Category: 'Starter' },
    { Name: 'Garlic Naan', Price: 59, Category: 'Bread' },
    { Name: 'Veg Biryani', Price: 199, Category: 'Main Course' },
    { Name: 'Masala Dosa', Price: 89, Category: 'Breakfast' }
  ];
  await Dish.insertMany(defaultDishes);
  console.log('Seeded 5 default dishes for staff ordering.');
}

async function fetchIngredients() {
  await connect();
  const list = await DishIngredient.find().populate('Dish_ID', 'Name').populate('Item_ID', 'Name').lean();
  return (list || []).map(d => ({
    Dish_Name: d.Dish_ID?.Name,
    Ingredient_Name: d.Item_ID?.Name,
    Quantity: d.Quantity
  }));
}

async function fetchInventory() {
  await connect();
  const docs = await InventoryItem.find().sort({ Name: 1 }).lean();
  return (docs || []).map(d => ({
    Item_ID: d._id?.toString(),
    Name: d.Name,
    Quantity: d.Quantity,
    Unit: d.Unit,
    Reorder_Level: d.Reorder_Level
  }));
}

async function fetchBatches() {
  await connect();
  const docs = await InventoryBatch.find().populate('Item_ID', 'Name').sort({ Expiry_Date: 1 }).lean();
  return (docs || []).map(d => ({
    Batch_ID: d._id?.toString(),
    Item_Name: d.Item_ID?.Name,
    Quantity: d.Quantity,
    Expiry_Date: d.Expiry_Date
  }));
}

async function fetchSuppliers() {
  await connect();
  const docs = await Supplier.find().lean();
  return (docs || []).map(d => ({
    Supplier_ID: d._id?.toString(),
    Name: d.Name,
    Contact_Info: d.Contact_Info,
    Items_Supplied: d.Items_Supplied || ''
  }));
}

async function fetchCustomers() {
  await connect();
  const docs = await Customer.find().lean();
  return (docs || []).map(d => ({ ID: d._id?.toString(), Name: d.Name, Phone_Number: d.Phone_Number, Email: d.Email }));
}

async function fetchOrders() {
  await connect();
  const docs = await Order.find().sort({ Order_Date: -1 }).lean();
  return (docs || []).map(d => ({
    Order_ID: d._id?.toString(),
    Customer_Name: d.Customer_Name || 'N/A',
    Order_Date: d.Order_Date,
    Total_Amount: d.Total_Amount,
    Status: d.Status || 'Pending'
  }));
}

async function fetchSales() {
  await connect();
  const docs = await Sales.find().populate('Dish_ID', 'Name Price').sort({ Sale_Date: -1 }).lean();
  return (docs || []).map(d => ({
    Sale_ID: d._id?.toString(),
    Item_Name: d.Dish_ID?.Name,
    Sale_Date: d.Sale_Date,
    Quantity_Sold: d.Quantity_Sold,
    Revenue: (d.Dish_ID?.Price || 0) * (d.Quantity_Sold || 0)
  }));
}

function getStartOfTodayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function getEndOfTodayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

async function fetchTodaysOrdersForConclusion() {
  await connect();
  const start = getStartOfTodayUTC();
  const end = getEndOfTodayUTC();
  const docs = await Order.find({
    Order_Date: { $gte: start, $lte: end }
  }).sort({ Order_Date: 1 }).lean();
  return (docs || []).map(d => ({
    Order_ID: d._id?.toString(),
    Customer_Name: d.Customer_Name || 'N/A',
    Order_Date: d.Order_Date,
    Total_Amount: d.Total_Amount != null ? Number(d.Total_Amount) : 0
  }));
}

async function fetchConcludedSales() {
  await connect();
  const docs = await ConcludedSales.find().sort({ Sale_Date: -1 }).lean();
  return (docs || []).map(d => ({
    Id: d._id?.toString(),
    Sale_Date: d.Sale_Date,
    Order_Count: d.Order_Count || 0,
    Total_Amount: d.Total_Amount != null ? Number(d.Total_Amount) : 0
  }));
}

async function isTodayAlreadyConcluded() {
  await connect();
  const start = getStartOfTodayUTC();
  const existing = await ConcludedSales.findOne({ Sale_Date: start }).lean();
  return !!existing;
}

async function concludeTodaysSales(ordersWithAmounts) {
  await connect();
  const start = getStartOfTodayUTC();
  const existing = await ConcludedSales.findOne({ Sale_Date: start });
  if (existing) return { ok: false, error: 'Today has already been concluded.' };
  const total = (ordersWithAmounts || []).reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const orderIds = (ordersWithAmounts || []).map(o => o.orderId).filter(Boolean);
  const orderDocs = await Order.find({ _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } }).lean();
  const ordersForDoc = orderDocs.map(o => ({
    Order_ID: o._id,
    Amount: Number(o.Total_Amount) || 0
  }));
  await ConcludedSales.create({
    Sale_Date: start,
    Total_Amount: total,
    Order_Count: ordersForDoc.length,
    Orders: ordersForDoc
  });
  const dishQuantities = {};
  for (const oid of orderIds) {
    try {
      const details = await OrderDetail.find({ Order_ID: new mongoose.Types.ObjectId(oid) }).lean();
      for (const od of details) {
        const dishId = od.Item_ID && od.Item_ID.toString();
        if (!dishId) continue;
        dishQuantities[dishId] = (dishQuantities[dishId] || 0) + (Number(od.Quantity) || 0);
      }
    } catch (_) {}
  }
  for (const [dishId, qty] of Object.entries(dishQuantities)) {
    const dishObjId = new mongoose.Types.ObjectId(dishId);
    await Sales.findOneAndUpdate(
      { Dish_ID: dishObjId, Sale_Date: start },
      { $setOnInsert: { Dish_ID: dishObjId, Sale_Date: start }, $inc: { Quantity_Sold: qty } },
      { upsert: true, new: true }
    );
  }
  return { ok: true };
}

async function fetchLoginHistory() {
  await connect();
  const docs = await LoginHistory.find().sort({ Login_Time: -1 }).limit(50).lean();
  return (docs || []).map(d => ({ username: d.Username, login_datetime: d.Login_Time }));
}

async function fetchInventoryWithUsage() {
  await connect();
  const docs = await InventoryItem.find().sort({ Name: 1 }).lean();
  return (docs || []).map(d => ({
    Item_ID: d._id?.toString(),
    Name: d.Name,
    Quantity: d.Quantity,
    Unit: d.Unit,
    Reorder_Level: d.Reorder_Level,
    Used_Today: 0
  }));
}

async function fetchRecentOrders() {
  await connect();
  const orders = await Order.find().sort({ Order_Date: -1 }).limit(50).lean();
  const result = [];
  for (const o of orders) {
    const details = await OrderDetail.find({ Order_ID: o._id }).lean();
    for (const od of details) {
      result.push({
        OrderDetail_ID: od._id?.toString(),
        Order_ID: o._id?.toString(),
        Item_Name: od.Item_Name || 'N/A',
        Quantity: od.Quantity,
        Unit_Price: od.Unit_Price,
        Subtotal: od.Subtotal,
        Order_Date: o.Order_Date,
        Status: o.Status || 'Pending'
      });
    }
  }
  return result.slice(0, 50);
}

async function verifyAdminLogin(username, password) {
  return null;
}
async function verifyStaffLogin(username, password) {
  return null;
}

async function logUserActivity(userId, username, role, action, actionDetails, ipAddress, status = 'success') {
  await connect();
  try {
    await UserActivityLog.create({
      User_ID: userId,
      Username: username,
      Role: role,
      Action: action,
      Action_Details: actionDetails,
      IP_Address: ipAddress,
      Status: status
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function logLogin(userId, username, role, ipAddress, status = 'success') {
  await connect();
  try {
    const doc = await LoginHistory.create({
      User_ID: userId,
      Username: username,
      Role: role,
      IP_Address: ipAddress,
      Login_Status: status
    });
    return doc._id?.toString();
  } catch (e) {
    return null;
  }
}

async function logLogout(loginId) {
  await connect();
  try {
    const doc = await LoginHistory.findById(loginId);
    if (!doc) return false;
    doc.Logout_Time = new Date();
    doc.Session_Duration = Math.floor((doc.Logout_Time - doc.Login_Time) / 1000);
    await doc.save();
    return true;
  } catch (e) {
    return false;
  }
}

// --- New methods for routes (replacing raw SQL) ---
async function findUserByEmailAndPassword(email, hashedPassword) {
  await connect();
  const emailTrim = (email || '').toString().trim();
  if (!emailTrim) return null;
  const user = await User.findOne({
    email: new RegExp('^' + emailTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    password: hashedPassword
  }).lean();
  if (!user) return null;
  return { id: user._id.toString(), username: user.username, email: user.email };
}

async function findExistingUser(username, email) {
  await connect();
  const emailTrim = (email || '').toString().trim();
  const userTrim = (username || '').toString().trim();
  if (!emailTrim && !userTrim) return null;
  const conditions = [];
  if (userTrim) conditions.push({ username: new RegExp('^' + userTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
  if (emailTrim) conditions.push({ email: new RegExp('^' + emailTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
  return await User.findOne({ $or: conditions }).lean();
}

async function createUser(username, email, phone, hashedPassword) {
  await connect();
  const emailLower = (email || '').toString().trim().toLowerCase();
  const doc = await User.create({
    username: (username || '').toString().trim(),
    email: emailLower,
    phone_number: (phone || '').toString().trim(),
    password: hashedPassword
  });
  console.log('User created in MongoDB:', emailLower, '(id:', doc._id.toString() + ')');
  return doc._id.toString();
}

async function createCustomer(name, phone, email) {
  await connect();
  const phoneStr = (phone || '').toString().replace(/\D/g, '');
  const phoneFinal = phoneStr.length === 10 ? phoneStr : '';
  const doc = await Customer.create({
    Name: (name || '').toString().trim(),
    Phone_Number: phoneFinal,
    Email: (email || '').toString().trim()
  });
  return doc._id.toString();
}

async function createOrderWithItems(customerName, orderDate, total, status, items, customerId) {
  await connect();
  const orderDoc = {
    Customer_Name: customerName,
    Order_Date: orderDate || new Date(),
    Total_Amount: total,
    Status: status || 'Pending'
  };
  if (customerId) {
    try {
      orderDoc.Customer_ID = new mongoose.Types.ObjectId(customerId);
    } catch (_) {}
  }
  const order = await Order.create(orderDoc);
  for (const item of items) {
    const subtotal = Number(item.price) * Number(item.quantity);
    await OrderDetail.create({
      Order_ID: order._id,
      Item_ID: item.id,
      Item_Name: item.name,
      Quantity: item.quantity,
      Unit_Price: item.price,
      Subtotal: subtotal
    });
  }
  return order._id.toString();
}

async function updateOrderStatus(orderId, newStatus) {
  await connect();
  try {
    const r = await Order.updateOne(
      { _id: new mongoose.Types.ObjectId(orderId) },
      { $set: { Status: newStatus } }
    );
    return r.modifiedCount > 0 || r.matchedCount > 0;
  } catch (e) {
    return false;
  }
}

async function createCustomerAndOrder(name, phone, email, cartItems) {
  await connect();
  await Customer.create({ Name: name, Phone_Number: phone, Email: email });
  const total_amount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = await Order.create({
    Customer_Name: name,
    Total_Amount: total_amount,
    Status: 'Pending'
  });
  for (const item of cartItems) {
    await OrderDetail.create({
      Order_ID: order._id,
      Item_ID: item.id,
      Item_Name: item.name,
      Quantity: item.quantity,
      Unit_Price: item.price,
      Subtotal: item.price * item.quantity
    });
  }
  return { orderId: order._id.toString() };
}

async function createBatch(itemName, quantity, expiryDate) {
  await connect();
  const item = await InventoryItem.findOne({ Name: itemName });
  if (!item) return null;
  await InventoryBatch.create({ Item_ID: item._id, Quantity: quantity, Expiry_Date: expiryDate });
  item.Quantity = (item.Quantity || 0) + quantity;
  await item.save();
  return true;
}

async function createItem(name, quantity, unit, reorderLevel) {
  await connect();
  await InventoryItem.create({ Name: name, Quantity: quantity, Unit: unit, Reorder_Level: reorderLevel });
  return true;
}

async function createSupplier(name, contactInfo, itemsSupplied) {
  await connect();
  await Supplier.create({ Name: name, Contact_Info: contactInfo, Items_Supplied: itemsSupplied });
  return true;
}

async function createStaff(username, hashedPassword) {
  await connect();
  const uname = (username || '').toString().trim();
  if (!uname) return null;
  const existing = await Staff.findOne({ Username: new RegExp('^' + uname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
  if (existing) return null;
  const doc = await Staff.create({ Username: uname, Password: hashedPassword });
  return doc._id.toString();
}

async function findStaffByUsernameAndPassword(username, hashedPassword) {
  await connect();
  const uname = (username || '').toString().trim();
  if (!uname) return null;
  const doc = await Staff.findOne({
    Username: new RegExp('^' + uname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    Password: hashedPassword
  }).lean();
  if (!doc) return null;
  return { id: doc._id.toString(), username: doc.Username };
}

module.exports = {
  connect,
  getConnection,
  seedDishesIfEmpty,
  createCustomer,
  fetchAllDishes,
  fetchIngredients,
  fetchInventory,
  fetchBatches,
  fetchSuppliers,
  fetchCustomers,
  fetchOrders,
  fetchSales,
  fetchTodaysOrdersForConclusion,
  fetchConcludedSales,
  isTodayAlreadyConcluded,
  concludeTodaysSales,
  fetchLoginHistory,
  fetchInventoryWithUsage,
  fetchRecentOrders,
  verifyAdminLogin,
  verifyStaffLogin,
  logUserActivity,
  logLogin,
  logLogout,
  findUserByEmailAndPassword,
  findExistingUser,
  createUser,
  createOrderWithItems,
  updateOrderStatus,
  createCustomerAndOrder,
  createBatch,
  createItem,
  createSupplier,
  createStaff,
  findStaffByUsernameAndPassword
};
