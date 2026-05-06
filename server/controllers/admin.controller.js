/**
 * EduReach — Admin Controller
 *
 * Handles admin verification operations.
 *
 * Privacy rules:
 *   - Admin CAN see aadhaar URL (explicitly selected).
 *   - Approval syncs TutorProfile.isVerified = true.
 *   - Rejection stores a note the user sees in their dashboard.
 */

const User         = require('../models/User.model');
const TutorProfile = require('../models/TutorProfile.model');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/verifications
// Query: ?status=pending|approved|rejected|all (default: pending)
// Returns users with documents submitted, including aadhaar URL for admin.
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingVerifications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const allowed = ['pending', 'approved', 'rejected', 'all'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(', ')}.`,
      });
    }

    const query = { verificationStatus: { $ne: 'unsubmitted' } };
    if (status !== 'all') query.verificationStatus = status;

    // Admin explicitly selects aadhaar (+documents.aadhaar)
    const users = await User.find(query)
      .select('name email role verificationStatus verificationNote createdAt documents.degree documents.certifications documents.aadhaar documents.schoolId documents.registrationProof')
      .sort({ updatedAt: -1 })
      .lean();

    // Shape — keep all doc fields for admin, including aadhaar
    const shaped = users.map(u => ({
      _id:                u._id,
      name:               u.name,
      email:              u.email,
      role:               u.role,
      verificationStatus: u.verificationStatus,
      verificationNote:   u.verificationNote || '',
      createdAt:          u.createdAt,
      documents:          u.documents || {},
    }));

    return res.json({ success: true, users: shaped });
  } catch (err) {
    console.error('[ADMIN] getPendingVerifications error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch verifications.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/verify/:userId
// Body: { action: 'approve' | 'reject', note?: string }
//
// Approve:  verificationStatus = 'approved' + TutorProfile.isVerified = true
// Reject:   verificationStatus = 'rejected' + verificationNote = note
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, note } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action must be "approve" or "reject".',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (action === 'approve') {
      user.verificationStatus = 'approved';
      user.verificationNote   = '';

      // Sync TutorProfile.isVerified for tutors
      if (user.role === 'tutor') {
        await TutorProfile.findOneAndUpdate(
          { user: userId },
          { $set: { isVerified: true } }
        );
      }
    } else {
      user.verificationStatus = 'rejected';
      user.verificationNote   = note ? String(note).trim().slice(0, 300) : '';
    }

    await user.save();

    return res.json({
      success: true,
      message: action === 'approve'
        ? 'User approved and marked as verified.'
        : 'User marked as rejected.',
      verificationStatus: user.verificationStatus,
    });
  } catch (err) {
    console.error('[ADMIN] verifyUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update verification.' });
  }
};
