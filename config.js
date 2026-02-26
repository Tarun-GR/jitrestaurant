// MongoDB connection. Override with MONGODB_URI in .env if needed.
module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://inventory_db:inventory123@inventory.5iclbvc.mongodb.net/jitrestaurant?retryWrites=true&w=majority&appName=inventory',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-fixed-secret-key-123'
};
