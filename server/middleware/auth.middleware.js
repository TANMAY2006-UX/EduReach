const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect middleware — verifies JWT from HttpOnly cookie
const protect = async (req, res, next) => {
  const token = req.cookies?.edureach_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Role guard — use after protect
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient role' });
  }
  next();
};

module.exports = { protect, requireRole };