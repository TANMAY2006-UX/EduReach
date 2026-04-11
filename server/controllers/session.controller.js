const Session      = require('../models/Session.model');
const TutorProfile = require('../models/TutorProfile.model');

// ──────────────────────────────────────────────────────────────
// POST /api/sessions/request
// Student requests a trial with a tutor.
// ──────────────────────────────────────────────────────────────
exports.requestSession = async (req, res) => {
  try {
    const { tutorProfileId, subject, scheduledAt, mode, notes } = req.body;

    if (!tutorProfileId || !subject || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Tutor, subject, and scheduled time are required' });
    }

    const tutorProfile = await TutorProfile.findById(tutorProfileId);
    if (!tutorProfile || !tutorProfile.isActive) {
      return res.status(404).json({ success: false, message: 'Tutor not found or inactive' });
    }

    // Prevent duplicate pending trial requests
    const duplicate = await Session.findOne({
      student: req.user._id,
      tutorProfile: tutorProfileId,
      type: 'trial',
      status: 'pending',
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'You already have a pending trial request with this tutor' });
    }

    const session = await Session.create({
      student:      req.user._id,
      tutor:        tutorProfile.user,
      tutorProfile: tutorProfileId,
      type:         'trial',
      subject,
      scheduledAt:  new Date(scheduledAt),
      mode:         mode || 'online',
      notes:        notes || '',
      amount:       0, // trial always free
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error('[SESSION] requestSession error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to request session' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/sessions/student
// Returns all sessions for the logged-in student.
// ──────────────────────────────────────────────────────────────
exports.getStudentSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { student: req.user._id };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .sort({ scheduledAt: -1 })
      .populate('tutorProfile', 'name avatar subjects area city rating isVerified')
      .lean();

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/sessions/tutor
// Returns all sessions for the logged-in tutor.
// ──────────────────────────────────────────────────────────────
exports.getTutorSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { tutor: req.user._id };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .sort({ scheduledAt: -1 })
      .populate('student', 'name avatar email phone')
      .lean();

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id/respond
// Tutor accepts or rejects a trial request.
// ──────────────────────────────────────────────────────────────
exports.respondToSession = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or reject' });
    }

    const session = await Session.findOne({ _id: req.params.id, tutor: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Session is no longer pending' });
    }

    session.status = action === 'accept' ? 'accepted' : 'rejected';
    await session.save();

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id/complete
// Tutor marks a session as completed.
// ──────────────────────────────────────────────────────────────
exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutor: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted sessions can be completed' });
    }

    session.status = 'completed';
    session.tutorNotes = req.body.tutorNotes || '';
    await session.save();

    // Increment tutor stats
    await TutorProfile.findByIdAndUpdate(session.tutorProfile, {
      $inc: { totalSessions: 1 },
    });

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/sessions/:id/review
// Student reviews a completed session.
// ──────────────────────────────────────────────────────────────
exports.reviewSession = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const session = await Session.findOne({ _id: req.params.id, student: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed sessions' });
    }
    if (session.isReviewed) {
      return res.status(409).json({ success: false, message: 'Session already reviewed' });
    }

    session.studentRating = rating;
    session.studentReview = comment || '';
    session.isReviewed = true;
    await session.save();

    // Add review to tutor profile and recalculate rating
    const tutorProfile = await TutorProfile.findById(session.tutorProfile);
    if (tutorProfile) {
      tutorProfile.reviews.push({
        student:     req.user._id,
        studentName: req.user.name,
        rating,
        comment:     comment || '',
        session:     session._id,
      });
      tutorProfile.recalcRating();
      await tutorProfile.save();
    }

    res.json({ success: true, message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id/cancel
// Student or tutor cancels a pending/accepted session.
// ──────────────────────────────────────────────────────────────
exports.cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    // Must be participant
    const isStudent = session.student.toString() === req.user._id.toString();
    const isTutor   = session.tutor.toString()   === req.user._id.toString();
    if (!isStudent && !isTutor) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    if (!['pending','accepted'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed or already cancelled session' });
    }

    session.status           = 'cancelled';
    session.cancelledBy      = isStudent ? 'student' : 'tutor';
    session.cancellationNote = req.body.reason || '';
    session.cancelledAt      = new Date();
    await session.save();

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};