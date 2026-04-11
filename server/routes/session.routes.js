const express = require('express');
const router  = express.Router();

const {
  requestSession,
  getStudentSessions,
  getTutorSessions,
  respondToSession,
  completeSession,
  reviewSession,
  cancelSession,
} = require('../controllers/session.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

// All session routes require auth
router.use(protect);

// Student routes
router.post('/request',        requireRole('student'), requestSession);
router.get('/student',         requireRole('student'), getStudentSessions);
router.post('/:id/review',     requireRole('student'), reviewSession);

// Tutor routes
router.get('/tutor',           requireRole('tutor'), getTutorSessions);
router.patch('/:id/respond',   requireRole('tutor'), respondToSession);
router.patch('/:id/complete',  requireRole('tutor'), completeSession);

// Both student and tutor
router.patch('/:id/cancel', cancelSession);

module.exports = router;