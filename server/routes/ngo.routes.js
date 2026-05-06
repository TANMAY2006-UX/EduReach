const express = require('express');
const router  = express.Router();

const {
  // ── Existing ─────────────────────────────────────────────────────────────
  createBeneficiary,
  getBeneficiaries,
  getNgoStats,
  getNgoSessions,
  exportCsv,
  // ── Empanelment system ───────────────────────────────────────────────────
  empanelTutor,
  getEmpanelledTutors,
  removeEmpanelment,
  // ── NGO-initiated booking (legacy — kept for backward compat) ────────────
  bookSession,
  // ── NGO feedback / evaluation ────────────────────────────────────────────
  addNgoFeedback,
  // ── Collaboration system ─────────────────────────────────────────────────
  sendCollabRequest,
  getCollabRequests,
  cancelCollabRequest,
  createAssignment,
  getAssignments,
  endAssignment,
} = require('../controllers/ngo.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

// All NGO routes require authentication + NGO (or admin) role
router.use(protect);
router.use(requireRole('ngo', 'admin'));

// ── Beneficiary management ────────────────────────────────────────────────────
// POST   /api/ngo/beneficiary       — create a new beneficiary student
// GET    /api/ngo/beneficiaries     — list all beneficiaries (paginated)
router.post('/beneficiary',  createBeneficiary);
router.get('/beneficiaries', getBeneficiaries);

// ── Analytics ─────────────────────────────────────────────────────────────────
// GET    /api/ngo/stats             — KPI aggregate data for dashboard header
router.get('/stats', getNgoStats);

// ── Session feed ──────────────────────────────────────────────────────────────
// GET    /api/ngo/sessions          — all sessions across cohort (paginated)
router.get('/sessions', getNgoSessions);

// ── Export ────────────────────────────────────────────────────────────────────
// GET    /api/ngo/export            — CSV download
router.get('/export', exportCsv);

// ── Empanelment system ────────────────────────────────────────────────────────
// POST   /api/ngo/empanel/:tutorProfileId   — add tutor to trusted pool
// GET    /api/ngo/empanelled-tutors          — list active empanelled tutors
// DELETE /api/ngo/empanel/:tutorProfileId   — remove tutor from trusted pool
router.post('/empanel/:tutorProfileId',   empanelTutor);
router.get('/empanelled-tutors',          getEmpanelledTutors);
router.delete('/empanel/:tutorProfileId', removeEmpanelment);

// ── Legacy: NGO-initiated booking (not used in new flow) ──────────────────────
// Kept for backward compatibility. New flow uses collab-request + assignment.
router.post('/book-session', bookSession);

// ── Legacy: NGO session feedback ─────────────────────────────────────────────
router.patch('/sessions/:id/feedback', addNgoFeedback);

// ── Collaboration system ──────────────────────────────────────────────────────
// POST   /api/ngo/collab-request          — send collaboration request to a tutor
// GET    /api/ngo/collab-requests         — list NGO's requests (?status=)
// DELETE /api/ngo/collab-request/:id      — cancel a pending request
router.post('/collab-request',       sendCollabRequest);
router.get('/collab-requests',       getCollabRequests);
router.delete('/collab-request/:id', cancelCollabRequest);

// ── Assignments ───────────────────────────────────────────────────────────────
// POST   /api/ngo/assignment              — create assignment (from accepted request)
// GET    /api/ngo/assignments             — list NGO's assignments (?status=)
// PATCH  /api/ngo/assignment/:id/end      — end an active assignment
router.post('/assignment',           createAssignment);
router.get('/assignments',           getAssignments);
router.patch('/assignment/:id/end',  endAssignment);

module.exports = router;
