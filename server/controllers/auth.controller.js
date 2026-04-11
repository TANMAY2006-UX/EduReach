const passport = require('passport');
const User = require('../models/User.model');
const { sendTokenCookie } = require('../utils/jwt.utils');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, authProvider: 'local' });
    sendTokenCookie(res, user);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('[AUTH] register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// POST /api/auth/login
exports.login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, message: info?.message || 'Invalid email or password' });
    }
    sendTokenCookie(res, user);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        avatar: user.avatar
      }
    });
  })(req, res, next);
};

// GET /api/auth/google  — handled by passport in route
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

// GET /api/auth/google/callback
exports.googleCallback = (req, res, next) => {
  passport.authenticate(
    'google',
    {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
    },
    (err, user) => {
      if (err || !user) {
        console.error('[AUTH] Google OAuth error:', err?.message);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }
      sendTokenCookie(res, user);
      if (!user.isProfileComplete) {
        return res.redirect(`${process.env.CLIENT_URL}/onboarding`);
      }
      return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
  )(req, res, next);
};

// POST /api/auth/onboarding  — saves ALL onboarding fields
exports.completeOnboarding = async (req, res) => {
  try {
    const {
      role,
      phone,
      subjects,
      grade,
      board,
      experience,
      qualification,
      bio,
      location,
    } = req.body;

    // Validate required fields
    if (!role)  return res.status(400).json({ success: false, message: 'Role is required' });
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!location?.city || !location?.area) {
      return res.status(400).json({ success: false, message: 'City and area are required' });
    }

    const updateData = {
      role,
      phone,
      subjects:          subjects || [],
      grade:             grade || null,
      board:             board || null,
      experience:        experience || null,
      qualification:     qualification || null,
      bio:               bio || null,
      location: {
        city: location.city,
        area: location.area,
      },
      isProfileComplete: true,
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    // Re-issue JWT with updated role and isProfileComplete
    sendTokenCookie(res, user);

    res.json({
      success: true,
      user: {
        id:                user._id,
        name:              user.name,
        email:             user.email,
        role:              user.role,
        isProfileComplete: user.isProfileComplete,
        avatar:            user.avatar,
      }
    });
  } catch (err) {
    console.error('[AUTH] onboarding error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save profile. Please try again.' });
  }
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  res.json({ success: true, user: req.user });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('edureach_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};