/**
 * EduReach — Admin Routes
 *
 * All routes require authentication + admin role.
 *
 * GET  /api/admin/verifications            — list users with submitted docs
 *      ?status=pending|approved|rejected|all
 * PATCH /api/admin/verify/:userId          — approve or reject a user
 *       Body: { action: 'approve'|'reject', note?: string }
 */

const express = require('express');
const router  = express.Router();

const {
  getPendingVerifications,
  verifyUser,
} = require('../controllers/admin.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

router.use(protect);
router.use(requireRole('admin'));

router.get('/verifications',      getPendingVerifications);
router.patch('/verify/:userId',   verifyUser);

module.exports = router;
