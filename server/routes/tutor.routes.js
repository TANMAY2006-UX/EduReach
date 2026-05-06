const express = require('express');
const router  = express.Router();

const {
  getTutors,
  getTutorById,
  getNearbyTutors,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/tutor.controller');

const {
  getNgoRequests,
  respondToNgoRequest,
  getTutorAssignments,
} = require('../controllers/collab.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

// ── Public: list / search ──────────────────────────────────────────────────
router.get('/',       getTutors);       // GET /api/tutors
router.get('/nearby', getNearbyTutors); // GET /api/tutors/nearby

// ── Tutor-only: profile ────────────────────────────────────────────────────
router.get('/me/profile',   protect, requireRole('tutor'), getMyProfile);
router.patch('/me/profile', protect, requireRole('tutor'), updateMyProfile);

// ── Collaboration system (tutor-side) ─────────────────────────────────────
// NOTE: All static named routes MUST appear before /:id to prevent Express
// matching them as a dynamic parameter.
//
// GET    /api/tutors/ngo-requests               — incoming NGO requests
//        ?status=pending|accepted|declined|all
// PATCH  /api/tutors/ngo-requests/:id/respond   — accept or decline
//        Body: { action: 'accept'|'decline', note?: string }
// GET    /api/tutors/assignments                — active group assignments
router.get('/ngo-requests',               protect, requireRole('tutor'), getNgoRequests);
router.patch('/ngo-requests/:id/respond', protect, requireRole('tutor'), respondToNgoRequest);
router.get('/assignments',                protect, requireRole('tutor'), getTutorAssignments);

// ── Public: single tutor by ID ─────────────────────────────────────────────
// MUST remain LAST — /:id is a wildcard that catches all routes above it if placed earlier
router.get('/:id', getTutorById);       // GET /api/tutors/:id

module.exports = router;