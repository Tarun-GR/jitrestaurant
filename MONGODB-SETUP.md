# Connect to online MongoDB (from scratch)

This app uses **MongoDB** instead of local SQL. Use **MongoDB Atlas** (free cloud database) to get an online connection.

---

## Step 1: Create a MongoDB Atlas account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Try Free**.
3. Sign up with Google/Email and complete registration.

---

## Step 2: Create a cluster

1. After login, click **Build a Database**.
2. Choose **M0 FREE** (shared) and click **Create**.
3. Pick a cloud provider and region (e.g. **AWS** / **N. Virginia**). Click **Create Cluster**.
4. Wait until the cluster status is **Available**.

---

## Step 3: Create a database user

1. In the left sidebar, go to **Database Access** → **Add New Database User**.
2. Choose **Password** authentication.
3. Set a **Username** (e.g. `jituser`) and **Password** (e.g. a strong password). Save the password somewhere safe.
4. Under **Database User Privileges**, leave **Read and write to any database**.
5. Click **Add User**.

---

## Step 4: Allow network access (IP whitelist)

1. In the left sidebar, go to **Network Access** → **Add IP Address**.
2. For development you can click **Allow Access from Anywhere** (adds `0.0.0.0/0`).  
   For production, add only your server’s IP.
3. Click **Confirm**.

---

## Step 5: Get the connection string

1. Go back to **Database** in the left sidebar.
2. On your cluster, click **Connect**.
3. Choose **Connect your application**.
4. Copy the connection string. It looks like:
   ```text
   mongodb+srv://jituser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the database user password you created (no angle brackets).
6. Optional: add your database name before the `?`:
   ```text
   mongodb+srv://jituser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/jitrestaurant?retryWrites=true&w=majority
   ```
   If you don’t add it, the app will use the default DB name from the code.

---

## Step 6: Set the connection string in your project

**Option A – Environment variable (recommended)**

Create a `.env` file in the project root (same folder as `server.js`):

```env
MONGODB_URI=mongodb+srv://jituser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/jitrestaurant?retryWrites=true&w=majority
```

Install dotenv and load it in the app:

```bash
npm install dotenv
```

At the **very top** of `server.js` (before other requires), add:

```js
require('dotenv').config();
```

**Option B – Edit config.js**

Open `config.js` and set:

```js
MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://jituser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/jitrestaurant?retryWrites=true&w=majority',
```

Never commit real passwords to Git. Use `.env` and add `.env` to `.gitignore`.

---

## Step 7: Run the app

```bash
npm install
npm start
```

You should see **MongoDB connected** in the console. Open **http://localhost:5000**.

Collections (e.g. `users`, `dishes`, `orders`) are created automatically when you sign up, add dishes, or place orders.

---

## Optional: Seed sample data

The app creates collections on first use. To add sample dishes/inventory, you can:

1. Use the app (sign up, login, then use Admin/Staff or the menu).
2. Or add documents manually in Atlas: **Database** → your cluster → **Browse Collections** → **Create Database** (e.g. `jitrestaurant`) → **Create Collection** (e.g. `dishes`) and insert JSON documents.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| **MongoServerSelectionError** / connection timeout | Check **Network Access** in Atlas: add `0.0.0.0/0` for testing. |
| **Authentication failed** | Confirm username/password in the URI; no `<` or `>` in the password. If the password has special characters, URL-encode them. |
| **Cannot find module 'mongoose'** | Run `npm install`. |
| **Collections empty** | Normal at first. Sign up a user, then use the app to create orders/dishes; collections will appear in Atlas. |

Your SQL data lives in your local MySQL. MongoDB starts empty. You can later write a one-off script to export from MySQL and import into MongoDB if you need to migrate old data.
