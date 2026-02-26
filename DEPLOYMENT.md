# How to Deploy JIT Restaurant

Your app is a **Node.js + Express** server with **MongoDB Atlas**. Here’s how to put it online.

---

## Before You Deploy

### 1. MongoDB Atlas (you already have this)

- Your app uses: `mongodb+srv://inventory_db:...@inventory.5iclbvc.mongodb.net/jitrestaurant?...`
- In Atlas: **Network Access** → ensure **0.0.0.0/0** (or your host’s IP) is allowed so the deployed server can connect.

### 2. Environment variables (set these on the host)

| Variable | What to set |
|----------|-------------|
| `MONGODB_URI` | Your full MongoDB Atlas URL (same as in `config.js` or `.env`) |
| `SESSION_SECRET` | A long random string (e.g. 32+ characters). **Do not** use the default in production. |
| `PORT` | Usually set automatically by the host (e.g. Render, Railway). Don’t set it unless the host tells you to. |

### 3. Git (recommended)

- Put your project in a **Git repository** (GitHub, GitLab, or Bitbucket).
- Do **not** commit `.env` or any file that contains your MongoDB password or `SESSION_SECRET`. Use the host’s “Environment variables” / “Config vars” instead.

---

## Option 1: Deploy on Render (free tier, good for Node)

1. **Sign up**  
   Go to [https://render.com](https://render.com) and create an account (GitHub login is fine).

2. **Connect your repo**  
   - Dashboard → **New** → **Web Service**.  
   - Connect GitHub/GitLab and select the repo that contains `jitrestaurant` (or the repo root if the app is at the root).

3. **Configure the service**  
   - **Name:** e.g. `jitrestaurant`  
   - **Region:** Pick one close to you.  
   - **Runtime:** **Node**.  
   - **Build Command:** `npm install`  
   - **Start Command:** `npm start`  
   - **Instance type:** **Free** (if available).

4. **Environment variables**  
   In the same screen, under **Environment Variables**, add:

   - **Key:** `MONGODB_URI`  
     **Value:** your full MongoDB connection string (same as you use locally).

   - **Key:** `SESSION_SECRET`  
     **Value:** a long random string (e.g. generate one at [https://randomkeygen.com](https://randomkeygen.com) and use a “Code key” or similar).

5. **Deploy**  
   Click **Create Web Service**. Render will run `npm install` and then `npm start`. When the build finishes, you’ll get a URL like `https://jitrestaurant.onrender.com`.

6. **Use the URL**  
   Open that URL in the browser. Log in, sign up, cart, and checkout will work as long as `MONGODB_URI` is correct and Atlas allows connections from Render (0.0.0.0/0).

**Note:** On the free tier the app may sleep after some idle time; the first open after that can be slow.

---

## Option 2: Deploy on Railway

1. Go to [https://railway.app](https://railway.app) and sign up (e.g. with GitHub).

2. **New project** → **Deploy from GitHub repo** → choose your repo (and branch).

3. Railway will detect Node and run `npm install` and `npm start`. If it doesn’t:
   - Set **Build Command:** `npm install`  
   - **Start Command:** `npm start`

4. **Variables** (in the project → **Variables**):  
   - `MONGODB_URI` = your Atlas URL  
   - `SESSION_SECRET` = long random string  

5. **Settings** → **Generate Domain** to get a public URL like `https://your-app.up.railway.app`.

6. Open that URL to use the deployed site.

---

## Option 3: Deploy on a VPS (e.g. DigitalOcean, Linode, AWS EC2)

You get a Linux server and run Node yourself.

1. **Create a server**  
   - Ubuntu 22.04 (or similar).  
   - Small size (e.g. 1 GB RAM) is enough to start.

2. **SSH in and install Node (e.g. Node 20)**  
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Upload your app**  
   - Clone from Git:  
     `git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git`  
   - Or upload the project folder (e.g. with SCP or SFTP).

4. **Install and run**  
   ```bash
   cd jitrestaurant   # or whatever the folder name is
   npm install
   ```

5. **Set environment variables**  
   Create a `.env` file in the project root (same folder as `server.js`):  
   ```env
   MONGODB_URI=mongodb+srv://inventory_db:inventory123@inventory.5iclbvc.mongodb.net/jitrestaurant?retryWrites=true&w=majority&appName=inventory
   SESSION_SECRET=your-long-random-secret-here
   PORT=5000
   ```  
   Or export them in the shell before starting.

6. **Run in the background (e.g. with PM2)**  
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name jitrestaurant
   pm2 save
   pm2 startup
   ```

7. **Open port and use a domain (optional)**  
   - Open port **5000** (or whatever `PORT` is) in the server firewall.  
   - Point a domain to the server’s IP, and optionally put **Nginx** in front as a reverse proxy and for HTTPS (e.g. with Let’s Encrypt).

---

## Quick checklist

- [ ] Code is in a Git repo (no `.env` or secrets committed).  
- [ ] MongoDB Atlas **Network Access** allows the deploy host (e.g. 0.0.0.0/0 for Render/Railway).  
- [ ] On the host: `MONGODB_URI` and `SESSION_SECRET` are set.  
- [ ] Build command: `npm install` (and start: `npm start`).  
- [ ] You use the URL the host gives you (e.g. `https://your-app.onrender.com`).

---

## If something doesn’t work

- **Can’t log in / session resets:** Check that `SESSION_SECRET` is set and the same for all instances. If you run multiple instances, consider a shared session store (e.g. MongoDB store for `express-session`).  
- **Database connection errors:** Confirm `MONGODB_URI` is correct and Atlas allows the host IP (or 0.0.0.0/0).  
- **Blank or 500 page:** Check the host’s **Logs** for errors (missing env var, crash on start, etc.).

### No frontend (no CSS, unstyled or blank page)

- **Root Directory (Render):** In the Render dashboard → your Web Service → **Settings** → **Root Directory** must be **empty** (or the folder that directly contains `server.js`, `views/`, and `static/`). If you point it to a subfolder that doesn’t have `views` and `static`, the app will start but pages and CSS won’t load.
- **Confirm files are in the repo:** Ensure `views/` and `static/` (and inside it `static/css/`) are committed and pushed. In the repo you should see `views/*.ejs`, `static/css/style.css`, `static/css/dashboard.css`.
- **Test static files:** After deploy, open `https://your-app.onrender.com/static/css/style.css` in the browser. If you get 404, the root directory or repo layout is wrong.

### Redirects not working (e.g. after login)

- The app uses **trust proxy** so redirects work behind Render’s reverse proxy. Redeploy after pulling the latest `server.js`.
- Set **NODE_ENV** = `production` in Render’s **Environment** so session cookies use `secure: true` over HTTPS.
- If you still get redirect issues, check the host’s **Logs** for errors right after you submit login/signup.

If you tell me which option you use (Render, Railway, or VPS), I can give you the exact clicks or commands for that one.
