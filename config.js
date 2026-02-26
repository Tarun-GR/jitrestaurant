// MongoDB connection. Override with MONGODB_URI in .env if needed.
const DEFAULT_URI = 'mongodb+srv://inventory_db:inventory123@inventory.5iclbvc.mongodb.net/jitrestaurant?retryWrites=true&w=majority&appName=inventory';
let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;
// If Render/env URI has no database path we get "test" DB — force jitrestaurant
const hasNoDb = MONGODB_URI.includes('.mongodb.net') && !MONGODB_URI.match(/\.mongodb\.net\/[a-zA-Z0-9_-]+/);
if (hasNoDb) {
  MONGODB_URI = MONGODB_URI.replace(/\.mongodb\.net(\/)?(\?|$)/, '.mongodb.net/jitrestaurant$2');
}
module.exports = {
  MONGODB_URI,
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-fixed-secret-key-123'
};
