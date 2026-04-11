require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const passport     = require('passport');
const connectDB    = require('./config/db');

require('./config/passport');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/tutors',   require('./routes/tutor.routes'));
app.use('/api/sessions', require('./routes/session.routes'));

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'EduReach server is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 EduReach server at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});