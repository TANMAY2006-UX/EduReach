const express = require('express');
const router  = express.Router();

const {
  getTutors,
  getTutorById,
  getNearbyTutors,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/tutor.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

// Public
router.get('/',        getTutors);       // GET /api/tutors
router.get('/nearby',  getNearbyTutors); // GET /api/tutors/nearby
router.get('/:id',     getTutorById);    // GET /api/tutors/:id

// Tutor-only
router.get('/me/profile',  protect, requireRole('tutor'), getMyProfile);
router.patch('/me/profile', protect, requireRole('tutor'), updateMyProfile);

module.exports = router;