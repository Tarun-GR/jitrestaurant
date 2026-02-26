// MongoDB connection. Override with MONGODB_URI in .env if needed.
const DEFAULT_URI = 'mongodb+srv://inventory_db:inventory123@inventory.5iclbvc.mongodb.net/inventory_db?retryWrites=true&w=majority&appName=inventory';
let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;
// If Render/env URI has no database path (e.g. ...mongodb.net?...) we get "test" DB — force inventory_db
if (MONGODB_URI.includes('.mongodb.net') && !MONGODB_URI.match(/\.mongodb\.net\/[^/?]+/)) {
  MONGODB_URI = MONGODB_URI.replace(/\.mongodb\.net(?=\?|$)/, '.mongodb.net/inventory_db');
}
module.exports = {
  MONGODB_URI,
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-fixed-secret-key-123'
};
