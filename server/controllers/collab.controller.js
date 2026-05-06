/**
 * EduReach — Collaboration Controller (Tutor-side)
 *
 * Handles tutor actions on NGO collaboration requests.
 * Strict privacy rules enforced:
 *   - Tutor NEVER sees beneficiary IDs, names, phones, or emails.
 *   - Tutor sees: NGO org name, city, grade, subjects, student count, message.
 *   - After acceptance: NGO contact info is returned so coordination
 *     happens outside the platform (phone/WhatsApp, not in-app).
 */

const CollabRequest = require('../models/CollabRequest.model');
const Assignment    = require('../models/Assignment.model');
const User          = require('../models/User.model');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tutors/ngo-requests
// Query: ?status=pending|accepted|declined|all (default: all)
//
// Returns incoming CollabRequests for this tutor.
// NGO contact details are ONLY included for accepted requests.
// ─────────────────────────────────────────────────────────────────────────────
exports.getNgoRequests = async (req, res) => {
  try {
    const tutorUserId = req.user._id;
    const status      = req.query.status || 'all';

    const query = { tutor: tutorUserId };
    if (status !== 'all') {
      const allowed = ['pending', 'accepted', 'declined', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${allowed.join(', ')}.`,
        });
      }
      query.status = status;
    }

    const requests = await CollabRequest
      .find(query)
      .populate('ngo', 'name qualification location phone email')
      .sort({ createdAt: -1 })
      .lean();

    // ── Privacy: strip NGO contact for non-accepted requests ──────
    const sanitised = requests.map(r => {
      const ngo = r.ngo
        ? {
            name:        r.ngo.name,
            orgName:     r.ngo.qualification || r.ngo.name, // qualification = org name for NGOs
            city:        r.ngo.location?.city || null,
            // Contact only shared after acceptance
            phone:       r.status === 'accepted' ? r.ngo.phone : null,
            email:       r.status === 'accepted' ? r.ngo.email : null,
          }
        : null;

      return {
        _id:          r._id,
        status:       r.status,
        subjects:     r.subjects,
        targetGrade:  r.targetGrade,
        frequency:    r.frequency,
        studentCount: r.studentCount,
        message:      r.message,
        tutorNote:    r.tutorNote,
        respondedAt:  r.respondedAt,
        expiresAt:    r.expiresAt,
        createdAt:    r.createdAt,
        ngo,
      };
    });

    res.json({ success: true, requests: sanitised });
  } catch (err) {
    console.error('[COLLAB] getNgoRequests error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load NGO requests.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tutors/ngo-requests/:id/respond
// Body: { action: 'accept' | 'decline', note?: string }
//
// Tutor responds to a pending CollabRequest.
// On accept: contactShared = true, expiresAt = null (keeps record).
// On decline: expiresAt = null (keeps record for NGO to see response).
// ─────────────────────────────────────────────────────────────────────────────
exports.respondToNgoRequest = async (req, res) => {
  try {
    const tutorUserId = req.user._id;
    const requestId   = req.params.id;
    const { action, note } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action must be "accept" or "decline".',
      });
    }

    const request = await CollabRequest.findOne({
      _id:    requestId,
      tutor:  tutorUserId,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found.',
      });
    }

    // ── Apply response ────────────────────────────────────────────
    request.status       = action === 'accept' ? 'accepted' : 'declined';
    request.tutorNote    = note ? String(note).trim() : '';
    request.respondedAt  = new Date();
    request.expiresAt    = null; // preserve record — stop TTL from deleting it
    request.contactShared = action === 'accept';

    await request.save();

    // ── Build response payload ────────────────────────────────────
    // On acceptance: return NGO contact info so coordination can start
    let ngoContact = null;
    if (action === 'accept') {
      const ngo = await User.findById(request.ngo)
        .select('name qualification location phone email')
        .lean();

      if (ngo) {
        ngoContact = {
          name:    ngo.name,
          orgName: ngo.qualification || ngo.name,
          city:    ngo.location?.city || null,
          phone:   ngo.phone   || null,
          email:   ngo.email   || null,
        };
      }
    }

    res.json({
      success:    true,
      message:    action === 'accept'
        ? 'Collaboration accepted! Contact details are shared below.'
        : 'Request declined.',
      status:     request.status,
      ngoContact: ngoContact,
    });
  } catch (err) {
    console.error('[COLLAB] respondToNgoRequest error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process response.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tutors/assignments
// Returns active assignments for this tutor (group-level view, no student PII).
// ─────────────────────────────────────────────────────────────────────────────
exports.getTutorAssignments = async (req, res) => {
  try {
    const tutorUserId = req.user._id;

    // beneficiaryIds is select:false — will NOT be returned here
    const assignments = await Assignment
      .find({ tutor: tutorUserId, status: 'active' })
      .populate('ngo', 'name qualification location phone email')
      .sort({ createdAt: -1 })
      .lean();

    // Shape for tutor view: only non-PII fields + NGO contact (collaboration accepted)
    const sanitised = assignments.map(a => ({
      _id:          a._id,
      grade:        a.grade,
      subjects:     a.subjects,
      studentCount: a.studentCount,  // count only — no names/contacts
      status:       a.status,
      createdAt:    a.createdAt,
      ngo: a.ngo ? {
        name:    a.ngo.name,
        orgName: a.ngo.qualification || a.ngo.name,
        city:    a.ngo.location?.city || null,
        phone:   a.ngo.phone  || null,
        email:   a.ngo.email  || null,
      } : null,
    }));

    res.json({ success: true, assignments: sanitised });
  } catch (err) {
    console.error('[COLLAB] getTutorAssignments error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load assignments.' });
  }
};
