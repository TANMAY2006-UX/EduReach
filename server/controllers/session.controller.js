const Session      = require('../models/Session.model');
const TutorProfile = require('../models/TutorProfile.model');

// ──────────────────────────────────────────────────────────────
// POST /api/sessions/request
// Fix: One active trial per tutor per student (not lifetime block).
// Students CAN book trials with multiple different tutors.
// ──────────────────────────────────────────────────────────────
exports.requestSession = async (req, res) => {
  try {
    const { tutorProfileId, subject, scheduledAt, mode, notes, type } = req.body;

    if (!tutorProfileId || !subject || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Tutor, subject, and scheduled time are required' });
    }

    // Validate scheduledAt is a real future date
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid session date/time provided.' });
    }
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Session must be scheduled in the future.' });
    }

    const tutorProfile = await TutorProfile.findById(tutorProfileId);
    if (!tutorProfile || !tutorProfile.isActive) {
      return res.status(404).json({ success: false, message: 'Tutor not found or inactive' });
    }

    // ── CRITICAL FIX: tutorProfile.user must exist and be a valid ObjectId ──
    // Without this check, Session.create() throws a ValidationError because
    // the `tutor` field is required:true, causing the generic 500 catch block.
    if (!tutorProfile.user) {
      console.error(`[SESSION] TutorProfile ${tutorProfileId} has no linked User — data integrity issue`);
      return res.status(500).json({
        success: false,
        message: 'This tutor account has a configuration issue. Please contact support.',
      });
    }

    const sessionType = type === 'regular' ? 'regular' : 'trial';

    // Safety: trials must be online
    const sessionMode = sessionType === 'trial' ? 'online' : (mode || 'online');

    if (sessionType === 'trial') {
      // Only block if there's already an ACTIVE (pending/accepted) trial with THIS tutor
      const activeTrial = await Session.findOne({
        student:      req.user._id,
        tutorProfile: tutorProfileId,
        type:         'trial',
        status:       { $in: ['pending', 'accepted'] },
      });
      if (activeTrial) {
        return res.status(409).json({
          success: false,
          code:    'DUPLICATE_TRIAL',
          message: `You already have an active trial with ${tutorProfile.name}. Check your dashboard for its status.`,
        });
      }
    }

    const amount = sessionType === 'regular' ? (tutorProfile.hourlyRate || 0) : 0;

    const session = await Session.create({
      student:      req.user._id,
      tutor:        tutorProfile.user,
      tutorProfile: tutorProfileId,
      type:         sessionType,
      subject,
      scheduledAt:  scheduledDate,
      mode:         sessionMode,
      notes:        notes || '',
      amount,
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error('[SESSION] requestSession error:', err.message, err.stack);
    // Surface Mongoose validation errors clearly instead of hiding them
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: 'Failed to request session. Please try again.' });
  }
};

// GET /api/sessions/student
exports.getStudentSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { student: req.user._id };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .sort({ scheduledAt: -1 })
      .populate('tutorProfile', 'name avatar subjects area city rating isVerified hourlyRate')
      .populate('tutor', 'name phone')
      .lean();

    const now = new Date();
    const result = sessions.map(s => ({
      ...s,
      isExpired: s.status === 'pending' && s.autoExpireAt && new Date(s.autoExpireAt) < now,
    }));

    res.json({ success: true, sessions: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/sessions/tutor
exports.getTutorSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { tutor: req.user._id };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .sort({ scheduledAt: -1 })
      .populate('student', 'name avatar email phone subjects grade board')
      .lean();

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/sessions/:id/respond
exports.respondToSession = async (req, res) => {
  try {
    const { action, meetingLink } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or reject' });
    }

    const session = await Session.findOne({ _id: req.params.id, tutor: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Session is no longer pending' });
    }

    session.status = action === 'accept' ? 'accepted' : 'rejected';
    if (action === 'accept' && meetingLink) session.meetingLink = meetingLink;
    await session.save();
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/sessions/:id/link  — FIX: simple URL validation, no crash
exports.updateMeetingLink = async (req, res) => {
  try {
    const { meetingLink } = req.body;
    if (!meetingLink || typeof meetingLink !== 'string') {
      return res.status(400).json({ success: false, message: 'Meeting link is required' });
    }

    const trimmed = meetingLink.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid link starting with https://' });
    }

    const session = await Session.findOne({ _id: req.params.id, tutor: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Can only add a link to accepted sessions' });
    }

    session.meetingLink = trimmed;
    await session.save();
    res.json({ success: true, session });
  } catch (err) {
    console.error('[SESSION] updateMeetingLink error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/sessions/:id/reschedule  — FIX: no next(), simple save
exports.rescheduleSession = async (req, res) => {
  try {
    const { newScheduledAt, note } = req.body;
    if (!newScheduledAt) {
      return res.status(400).json({ success: false, message: 'New scheduled time is required' });
    }

    const dt = new Date(newScheduledAt);
    if (isNaN(dt.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date/time provided' });
    }

    const session = await Session.findOne({ _id: req.params.id, tutor: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Can only reschedule accepted sessions' });
    }

    session.scheduledAt     = dt;
    session.rescheduledAt   = new Date();
    session.rescheduledNote = note || '';
    await session.save();

    res.json({ success: true, session });
  } catch (err) {
    console.error('[SESSION] rescheduleSession error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sessions/:id/join
exports.joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Session is not confirmed yet' });
    }
    if (!session.meetingLink) {
      return res.status(400).json({ success: false, message: 'Tutor has not added the meeting link yet' });
    }

    const isStudent = session.student.toString() === req.user._id.toString();
    const isTutor   = session.tutor.toString()   === req.user._id.toString();
    if (!isStudent && !isTutor) return res.status(403).json({ success: false, message: 'Not authorised' });

    if (isStudent && !session.studentJoinedAt) session.studentJoinedAt = new Date();
    if (isTutor   && !session.tutorJoinedAt)   session.tutorJoinedAt   = new Date();
    await session.save();

    res.json({ success: true, meetingLink: session.meetingLink, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/sessions/:id/complete
exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutor: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted sessions can be completed' });
    }

    // ── FIX: For online sessions, student must have joined via EduReach first ──
    // Offline sessions are exempt — there is no "Join Class" flow for in-person.
    if (session.mode === 'online' && !session.studentJoinedAt) {
      return res.status(400).json({
        success: false,
        code:    'STUDENT_NOT_JOINED',
        message: 'The student has not joined via EduReach yet. Ask them to click "Join Class" on their dashboard before you mark the session as done.',
      });
    }

    session.status     = 'completed';
    session.tutorNotes = req.body.tutorNotes || '';
    await session.save();

    // ── FIX: Check if this student is new to this tutor before incrementing totalStudents ──
    const priorCompletedSession = await Session.findOne({
      tutor:        req.user._id,
      student:      session.student,
      tutorProfile: session.tutorProfile,
      status:       'completed',
      _id:          { $ne: session._id }, // exclude the one we just completed
    });

    const statsUpdate = { $inc: { totalSessions: 1 } };
    if (!priorCompletedSession) {
      statsUpdate.$inc.totalStudents = 1;
    }

    await TutorProfile.findByIdAndUpdate(session.tutorProfile, statsUpdate);

    res.json({ success: true, session });
  } catch (err) {
    console.error('[SESSION] completeSession error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sessions/:id/review
exports.reviewSession = async (req, res) => {
  try {
    const { rating, comment, privateFeedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const session = await Session.findOne({ _id: req.params.id, student: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed sessions' });
    }
    if (session.isReviewed) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this session' });
    }

    session.studentRating   = rating;
    session.studentReview   = comment || '';
    session.privateFeedback = privateFeedback || '';
    session.isReviewed      = true;
    await session.save();

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

    res.json({ success: true, message: 'Review submitted. Thank you!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/sessions/:id/cancel
exports.cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const isStudent = session.student.toString() === req.user._id.toString();
    const isTutor   = session.tutor.toString()   === req.user._id.toString();
    if (!isStudent && !isTutor) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    if (!['pending', 'accepted'].includes(session.status)) {
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

// POST /api/sessions/admin/expire-stale
exports.expireStaleRequests = async (req, res) => {
  try {
    const now = new Date();
    const result = await Session.updateMany(
      { status: 'pending', autoExpireAt: { $lt: now } },
      {
        $set: {
          status:           'cancelled',
          cancelledBy:      'system',
          cancellationNote: 'Auto-cancelled: tutor did not respond within 48 hours.',
          cancelledAt:      now,
        }
      }
    );
    res.json({ success: true, expired: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};