const express = require('express');
const router  = express.Router();

const {
  register,
  login,
  googleAuth,
  googleCallback,
  completeOnboarding,
  getMe,
  logout,
} = require('../controllers/auth.controller');  // ← plural: controllers

const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login',    login);

// Google OAuth
router.get('/google',          googleAuth);
router.get('/google/callback', googleCallback);

// Protected routes (require valid JWT cookie)
router.post('/onboarding', protect, completeOnboarding);
router.get('/me',          protect, getMe);
router.post('/logout',     protect, logout);

module.exports = router;