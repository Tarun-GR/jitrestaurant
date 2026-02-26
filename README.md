# JIT Restaurant Management System

Node.js/Express server with EJS templates and **MongoDB**.

## Structure

- **`server.js`** – Express app, session, static files, routers
- **`config.js`** – MongoDB URI and session secret (env: `MONGODB_URI`, `SESSION_SECRET`)
- **`db/database.js`** – MongoDB (Mongoose) connection and DB helpers
- **`middleware/auth.js`** – `requireAuth`, `requireAdmin`, `requireStaff`, flash, `hashPassword`
- **`routes/auth.js`** – `/`, `/login`, `/restaurant_login`, `/admin_login`, `/staff_login`, `/signup`, `/logout`
- **`routes/admin.js`** – `/admin_landing`
- **`routes/staff.js`** – `/staff_landing`
- **`routes/pages.js`** – `/dashboard`, `/menu`, `/inventory`, `/orders`, `/partners`, `/subscription`, `/checkout`, `/process_checkout`, `/contact`
- **`routes/api.js`** – `/chatbot`, `/create_order`, `/add_to_cart`, `/update_order_status`, `/create_batch`, `/create_item`, `/create_supplier`
- **`views/`** – EJS templates
- **`static/`** – CSS, images

## Deploy

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step deployment (Render, Railway, or VPS).

## Run locally

1. **Connect to MongoDB**  
   See **[MONGODB-SETUP.md](MONGODB-SETUP.md)** for step-by-step setup with MongoDB Atlas (free online database).  
   Set `MONGODB_URI` in a `.env` file or in `config.js`.

2. **Install and start**
   ```bash
   npm install
   npm start
   ```
   Server runs at **http://localhost:5000** (or `PORT` env).

## Where data is stored (MongoDB)

All data is stored in your **MongoDB Atlas** database (database name: `jitrestaurant`):

| Data | Collection |
|------|------------|
| **Signup / customer accounts** | `users` (username, email, phone, hashed password) |
| **Login history** | `loginhistory` (who logged in, when, IP) |
| **Activity log** | `useractivitylogs` (login, logout, failed attempts) |
| **Orders, dishes, inventory, etc.** | Created when you use the app (e.g. `orders`, `dishes`, `inventoryitems`) |

You can view and edit data in Atlas: **Database** → your cluster → **Browse Collections** → `jitrestaurant`.

## Backend

To use a different backend (e.g. another API or DB):

- **`db/database.js`** – Replace with your data layer or API client.
- **`routes/*.js`** – Keep the same URLs and response shapes; point handlers to your backend.
