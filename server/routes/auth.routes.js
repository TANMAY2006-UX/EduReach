const express = require('express');
const router = express.Router();
const { register, login, googleAuth, googleCallback, completeOnboarding, getMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/onboarding', protect, completeOnboarding);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;