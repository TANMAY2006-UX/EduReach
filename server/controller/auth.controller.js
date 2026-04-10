const passport = require('passport');
const User = require('../models/User.model');
const { sendTokenCookie } = require('../utils/jwt.utils');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, authProvider: 'local' });
    sendTokenCookie(res, user);
    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isProfileComplete: user.isProfileComplete, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) return res.status(401).json({ success: false, message: info?.message || 'Login failed' });
    sendTokenCookie(res, user);
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isProfileComplete: user.isProfileComplete, avatar: user.avatar }
    });
  })(req, res, next);
};

// GET /api/auth/google
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

// GET /api/auth/google/callback
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` },
    (err, user) => {
      if (err || !user) return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
      sendTokenCookie(res, user);
      // Redirect based on profile completion
      if (!user.isProfileComplete) {
        return res.redirect(`${process.env.CLIENT_URL}/onboarding`);
      }
      return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    })(req, res, next);
};

// POST /api/auth/onboarding  (complete profile after first login)
exports.completeOnboarding = async (req, res) => {
  try {
    const { role, phone, city, area } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, {
      role, phone,
      location: { city, area },
      isProfileComplete: true
    }, { new: true });
    sendTokenCookie(res, user); // re-issue token with role now set
    res.json({ success: true, user: { id: user._id, name: user.name, role: user.role, isProfileComplete: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  res.json({ success: true, user: req.user });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('edureach_token');
  res.json({ success: true, message: 'Logged out' });
};