require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require('./config/db');
require('./config/passport');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'EduReach server running' }));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});