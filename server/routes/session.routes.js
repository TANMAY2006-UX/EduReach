const express = require('express');
const router  = express.Router();

const {
  requestSession,
  getStudentSessions,
  getTutorSessions,
  respondToSession,
  updateMeetingLink,
  rescheduleSession,
  joinSession,
  completeSession,
  reviewSession,
  cancelSession,
  expireStaleRequests,
} = require('../controllers/session.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

router.use(protect);

// Student
router.post('/request',          requireRole('student'), requestSession);
router.get('/student',           requireRole('student'), getStudentSessions);
router.post('/:id/review',       requireRole('student'), reviewSession);

// Tutor
router.get('/tutor',             requireRole('tutor'),   getTutorSessions);
router.patch('/:id/respond',     requireRole('tutor'),   respondToSession);
router.patch('/:id/link',        requireRole('tutor'),   updateMeetingLink);
router.patch('/:id/reschedule',  requireRole('tutor'),   rescheduleSession);
router.patch('/:id/complete',    requireRole('tutor'),   completeSession);

// Both — join session (records timestamp)
router.post('/:id/join', joinSession);

// Both — cancel
router.patch('/:id/cancel', cancelSession);

// System / admin — expire stale requests
router.post('/admin/expire-stale', expireStaleRequests);

module.exports = router;