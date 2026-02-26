require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { SESSION_SECRET, MONGODB_URI } = require('./config');
const { flashToLocals } = require('./middleware/auth');
const db = require('./db/database');

const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const staffRouter = require('./routes/staff');
const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Required when behind a reverse proxy (Render, etc.) so redirects and cookies use correct URL
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const staticPath = path.join(__dirname, 'static');
app.use('/static', express.static(staticPath));
  
let sessionStore;
try {
  if (MONGODB_URI) {
    sessionStore = MongoStore.create({ mongoUrl: MONGODB_URI });
  }
} catch (e) {
  console.error('Failed to initialize MongoDB session store:', e && e.message ? e.message : e);
  sessionStore = undefined;
}

app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production',
  store: sessionStore,
  cookie: {
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(flashToLocals);

app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.static = (filename) => '/static/' + String(filename).replace(/^\/+/, '');
  next();
});

app.use(authRouter);
app.use(adminRouter);
app.use(staffRouter);
app.use(pagesRouter);
app.use(apiRouter);

app.listen(PORT, () => {
  console.log(`JIT Restaurant server running on port ${PORT}`);
});

db.connect().catch((err) => {
  console.error('Failed to connect to MongoDB:', err && err.message ? err.message : err);
  console.log('Continuing without DB connection (DB operations may fail until MongoDB is reachable).');
});
