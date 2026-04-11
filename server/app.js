require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const passport     = require('passport');
const connectDB    = require('./config/db');

// Load passport strategies (MUST be before routes)
require('./config/passport');

const app = express();

// ── Connect DB ──────────────────────────────────────────────
connectDB();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,   // allow cookies cross-origin
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'EduReach server is running', timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 EduReach server running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});