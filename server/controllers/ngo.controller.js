/**
 * EduReach — NGO Controller
 * Handles all operations for NGO admins managing their beneficiary cohort.
 *
 * "Last activity" is defined as the most recent updatedAt timestamp across
 * any session (regardless of status) that the beneficiary is part of.
 * If no sessions exist, it falls back to the user's own createdAt.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User.model');
const Session = require('../models/Session.model');
const Empanelment = require('../models/Empanelment.model');
const TutorProfile = require('../models/TutorProfile.model');


// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a URL-safe random password.
 * e.g. "aK7mX2wQ"
 */
function generatePassword(length = 10) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
}

/**
 * Given an array of beneficiary user IDs, returns a map of:
 *   { userId → lastActivityDate }
 *
 * "Last activity" = most recent session.updatedAt for that student.
 * Falls through to null if no sessions exist.
 */
async function getLastActivityMap(beneficiaryIds) {
  if (!beneficiaryIds.length) return {};

  const pipeline = [
    {
      $match: {
        student: { $in: beneficiaryIds },
      },
    },
    {
      $group: {
        _id: '$student',
        lastActivity: { $max: '$updatedAt' },
        // Also count sessions by status for efficiency
        totalSessions: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
      },
    },
  ];

  const results = await Session.aggregate(pipeline);
  const map = {};
  for (const r of results) {
    map[r._id.toString()] = {
      lastActivity: r.lastActivity,
      totalSessions: r.totalSessions,
      completed: r.completed,
      pending: r.pending,
      accepted: r.accepted,
      cancelled: r.cancelled,
      rejected: r.rejected,
    };
  }
  return map;
}

// ── POST /api/ngo/beneficiary ─────────────────────────────────────────────────
/**
 * Creates a new Student user under this NGO's umbrella.
 * Returns the created user + the one-time plaintext password.
 * The password is shown once in the UI — NGO shares it with the student.
 */
exports.createBeneficiary = async (req, res) => {
  try {
    const { name, phone, grade, subjects, area } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Beneficiary name is required.' });
    }

    // Auto-generate a unique email under this NGO's namespace
    // Format: <slug>.<random>@beneficiary.edureach.internal
    // This is an internal address — the student never actually uses email to log in via the app (NGO manages them).
    const slug = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    const rand = crypto.randomBytes(3).toString('hex');
    const email = `${slug}.${rand}@beneficiary.edureach.internal`;

    // Safety: extremely unlikely collision but guard anyway
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Could not create account. Please try again.' });
    }

    const plainPassword = generatePassword(10);

    const beneficiary = await User.create({
      name: name.trim(),
      email,
      password: plainPassword,  // pre-save hook will hash this
      authProvider: 'local',
      role: 'student',
      isProfileComplete: true,
      phone: phone || null,
      grade: grade || null,
      subjects: Array.isArray(subjects) ? subjects : [],
      location: {
        city: null,
        area: area || null,
      },
      ngoParent: req.user._id,
    });

    res.status(201).json({
      success: true,
      beneficiary: {
        _id: beneficiary._id,
        name: beneficiary.name,
        email: beneficiary.email,
        phone: beneficiary.phone,
        grade: beneficiary.grade,
        subjects: beneficiary.subjects,
        location: beneficiary.location,
        createdAt: beneficiary.createdAt,
      },
      // Returned ONCE — NGO must copy and share with student
      temporaryPassword: plainPassword,
    });
  } catch (err) {
    console.error('[NGO] createBeneficiary error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A beneficiary with that name already exists. Try adding a middle name or initial.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create beneficiary. Please try again.' });
  }
};

// ── GET /api/ngo/beneficiaries ───────────────────────────────────────────────
/**
 * Returns paginated list of all beneficiaries under this NGO,
 * enriched with session stats and last activity date.
 *
 * Query params:
 *   page    (default 1)
 *   limit   (default 15, max 50)
 *   search  (fuzzy name match)
 *   subject (filter by subject)
 *   status  (filter by activity: active/inactive)
 */
exports.getBeneficiaries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const subject = req.query.subject?.trim();

    // Build base query — all students under this NGO
    const query = { ngoParent: req.user._id, role: 'student' };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (subject) {
      query.subjects = { $in: [new RegExp(subject, 'i')] };
    }

    const [beneficiaries, total] = await Promise.all([
      User.find(query)
        .select('name email phone grade subjects location createdAt assignedTutor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Enrich with session stats + last activity
    const ids = beneficiaries.map(b => b._id);
    const actMap = await getLastActivityMap(ids);

    const enriched = beneficiaries.map(b => {
      const stats = actMap[b._id.toString()] || {
        lastActivity: null,
        totalSessions: 0,
        completed: 0,
        pending: 0,
        accepted: 0,
        cancelled: 0,
        rejected: 0,
      };
      return {
        ...b,
        // "Last activity" = most recent session update, or creation if no sessions
        lastActivity: stats.lastActivity || b.createdAt,
        sessionStats: {
          total: stats.totalSessions,
          completed: stats.completed,
          pending: stats.pending,
          accepted: stats.accepted,
          cancelled: stats.cancelled,
          rejected: stats.rejected,
        },
      };
    });

    res.json({
      success: true,
      beneficiaries: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('[NGO] getBeneficiaries error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load beneficiaries.' });
  }
};

// ── GET /api/ngo/stats ───────────────────────────────────────────────────────
/**
 * Returns top-level KPIs for the NGO dashboard header.
 *
 * KPIs:
 *   totalBeneficiaries   — total students under this NGO
 *   sessionsThisWeek     — accepted + completed sessions with scheduledAt in current week
 *   completionRate       — completed / (completed + cancelled + rejected), as integer %
 *   activeTutors         — count of distinct tutors across completed sessions
 *   pendingSessions      — total sessions awaiting tutor response
 */
exports.getNgoStats = async (req, res) => {
  try {
    // All beneficiary IDs for this NGO
    const beneficiaries = await User.find(
      { ngoParent: req.user._id, role: 'student' },
      { _id: 1 }
    ).lean();
    const beneficiaryIds = beneficiaries.map(b => b._id);

    const totalBeneficiaries = beneficiaryIds.length;

    if (totalBeneficiaries === 0) {
      return res.json({
        success: true,
        stats: {
          totalBeneficiaries: 0,
          sessionsThisWeek: 0,
          completionRate: 0,
          activeTutors: 0,
          pendingSessions: 0,
        },
      });
    }

    // Week boundaries (Monday → Sunday ISO)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Mon
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);                     // next Mon

    const [sessionAgg] = await Session.aggregate([
      {
        $match: { student: { $in: beneficiaryIds } },
      },
      {
        $facet: {
          // Sessions this calendar week
          thisWeek: [
            {
              $match: {
                scheduledAt: { $gte: weekStart, $lt: weekEnd },
                status: { $in: ['accepted', 'completed'] },
              },
            },
            { $count: 'count' },
          ],
          // Completion rate numerator/denominator
          completionStats: [
            {
              $match: {
                status: { $in: ['completed', 'cancelled', 'rejected'] },
              },
            },
            {
              $group: {
                _id: null,
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
          // Distinct tutors with at least one completed session
          activeTutors: [
            { $match: { status: 'completed' } },
            { $group: { _id: '$tutor' } },
            { $count: 'count' },
          ],
          // Pending requests awaiting tutor response
          pending: [
            { $match: { status: 'pending' } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const sessionsThisWeek = sessionAgg?.thisWeek?.[0]?.count || 0;
    const completionStats = sessionAgg?.completionStats?.[0] || { completed: 0, total: 0 };
    const completionRate = completionStats.total > 0
      ? Math.round((completionStats.completed / completionStats.total) * 100)
      : 0;
    const activeTutors = sessionAgg?.activeTutors?.[0]?.count || 0;
    const pendingSessions = sessionAgg?.pending?.[0]?.count || 0;

    res.json({
      success: true,
      stats: {
        totalBeneficiaries,
        sessionsThisWeek,
        completionRate,
        activeTutors,
        pendingSessions,
      },
    });
  } catch (err) {
    console.error('[NGO] getNgoStats error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
};

// ── GET /api/ngo/sessions ────────────────────────────────────────────────────
/**
 * Returns sessions across the entire NGO cohort with pagination.
 *
 * Query params:
 *   filter  upcoming | past | all (default: upcoming)
 *   page    (default 1)
 *   limit   (default 20)
 *   student (ObjectId — filter by specific beneficiary)
 */
exports.getNgoSessions = async (req, res) => {
  try {
    const filter = req.query.filter || 'upcoming';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const studentFilter = req.query.student;

    // Resolve all beneficiary IDs
    const beneficiaries = await User.find(
      { ngoParent: req.user._id, role: 'student' },
      { _id: 1 }
    ).lean();
    const beneficiaryIds = beneficiaries.map(b => b._id);

    if (!beneficiaryIds.length) {
      return res.json({
        success: true,
        sessions: [],
        pagination: { page, limit, total: 0, pages: 0, hasNext: false, hasPrev: false },
      });
    }

    const sessionQuery = {
      student: studentFilter
        ? new mongoose.Types.ObjectId(studentFilter)
        : { $in: beneficiaryIds },
    };

    // Scope to this NGO — if a specific student is requested, verify they belong to this NGO
    if (studentFilter) {
      const isMember = beneficiaryIds.some(id => id.toString() === studentFilter);
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Student does not belong to your organisation.' });
      }
    }

    const now = new Date();
    if (filter === 'upcoming') {
      sessionQuery.status = { $in: ['pending', 'accepted'] };
      sessionQuery.scheduledAt = { $gte: now };
    } else if (filter === 'past') {
      sessionQuery.$or = [
        { status: { $in: ['completed', 'cancelled', 'rejected'] } },
        { status: 'accepted', scheduledAt: { $lt: new Date(now - 4 * 3600 * 1000) } },
      ];
    }
    // filter === 'all' — no additional constraints

    const sortOrder = filter === 'past' ? { scheduledAt: -1 } : { scheduledAt: 1 };

    const [sessions, total] = await Promise.all([
      Session.find(sessionQuery)
        .populate('student', 'name grade subjects location phone')
        .populate('tutorProfile', 'name area city subjects hourlyRate')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Session.countDocuments(sessionQuery),
    ]);

    res.json({
      success: true,
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('[NGO] getNgoSessions error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load sessions.' });
  }
};

// ── GET /api/ngo/export ───────────────────────────────────────────────────────
/**
 * Streams a CSV file of all sessions for NGO reporting.
 * Columns: Student Name, Grade, Subject, Tutor Name, Tutor Area, Scheduled At, Status
 *
 * Uses streaming to avoid memory issues for large cohorts.
 */
exports.exportCsv = async (req, res) => {
  try {
    const beneficiaries = await User.find(
      { ngoParent: req.user._id, role: 'student' },
      { _id: 1 }
    ).lean();
    const beneficiaryIds = beneficiaries.map(b => b._id);

    const sessions = await Session.find({ student: { $in: beneficiaryIds } })
      .populate('student', 'name grade')
      .populate('tutorProfile', 'name area city')
      .sort({ scheduledAt: -1 })
      .lean();

    const orgName = (req.user.qualification || req.user.name || 'NGO').replace(/[^a-zA-Z0-9_]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="EduReach_${orgName}_${dateStr}.csv"`);

    // CSV header row
    res.write('Student Name,Grade,Subject,Tutor Name,Tutor Area,Scheduled Date,Scheduled Time,Status,Session Type,Amount (INR)\r\n');

    for (const s of sessions) {
      const scheduledDate = s.scheduledAt ? new Date(s.scheduledAt) : null;
      const row = [
        `"${(s.student?.name || '').replace(/"/g, '""')}"`,
        `"${(s.student?.grade || '').replace(/"/g, '""')}"`,
        `"${(s.subject || '').replace(/"/g, '""')}"`,
        `"${(s.tutorProfile?.name || '').replace(/"/g, '""')}"`,
        `"${(s.tutorProfile?.area || s.tutorProfile?.city || '').replace(/"/g, '""')}"`,
        scheduledDate ? scheduledDate.toLocaleDateString('en-IN') : '',
        scheduledDate ? scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
        `"${s.status || ''}"`,
        `"${s.type || ''}"`,
        s.amount ?? 0,
      ].join(',');
      res.write(row + '\r\n');
    }

    res.end();
  } catch (err) {
    console.error('[NGO] exportCsv error:', err.message);
    // If headers not sent yet
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate export.' });
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EMPANELMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// ── POST /api/ngo/empanel/:tutorProfileId ────────────────────────────────────
/**
 * Adds a marketplace tutor to the NGO's trusted pool.
 *
 * Idempotent: if a removed record exists, it is reactivated.
 * If already active, returns 409 with a clear message.
 */
exports.empanelTutor = async (req, res) => {
  try {
    const { tutorProfileId } = req.params;

    // Validate tutor exists and is active
    const tutor = await TutorProfile.findById(tutorProfileId)
      .select('name subjects area city isActive user');
    if (!tutor || !tutor.isActive) {
      return res.status(404).json({ success: false, message: 'Tutor not found or inactive.' });
    }
    if (!tutor.user) {
      return res.status(500).json({ success: false, message: 'Tutor account has a configuration issue.' });
    }

    // Upsert: create if not exists, reactivate if removed
    const existing = await Empanelment.findOne({
      ngo: req.user._id,
      tutorProfile: tutorProfileId,
    });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({
          success: false,
          code: 'ALREADY_EMPANELLED',
          message: `${tutor.name} is already in your trusted tutor pool.`,
        });
      }
      // Re-activate a previously removed empanelment
      existing.status = 'active';
      existing.addedAt = new Date();
      await existing.save();
      return res.json({
        success: true,
        message: `${tutor.name} has been re-added to your trusted pool.`,
        empanelment: existing,
      });
    }

    const empanelment = await Empanelment.create({
      ngo: req.user._id,
      tutorProfile: tutorProfileId,
    });

    res.status(201).json({
      success: true,
      message: `${tutor.name} has been added to your trusted tutor pool.`,
      empanelment: {
        _id: empanelment._id,
        tutorProfile: {
          _id: tutor._id,
          name: tutor.name,
          subjects: tutor.subjects,
          area: tutor.area,
          city: tutor.city,
        },
        status: empanelment.status,
        addedAt: empanelment.addedAt,
      },
    });
  } catch (err) {
    console.error('[NGO] empanelTutor error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This tutor is already in your pool.' });
    }
    res.status(500).json({ success: false, message: 'Failed to add tutor. Please try again.' });
  }
};

// ── GET /api/ngo/empanelled-tutors ───────────────────────────────────────────
/**
 * Returns all active empanelled tutors for this NGO.
 * Enriched with: sessions taught to this NGO's beneficiaries (completed count).
 *
 * Query params:
 *   subject (optional filter)
 */
exports.getEmpanelledTutors = async (req, res) => {
  try {
    const subjectFilter = req.query.subject?.trim();

    const query = { ngo: req.user._id, status: 'active' };

    const empanelments = await Empanelment.find(query)
      .populate({
        path: 'tutorProfile',
        select: 'name avatar subjects area city rating totalReviews hourlyRate isVerified isActive',
        match: subjectFilter
          ? { subjects: { $in: [new RegExp(subjectFilter, 'i')] }, isActive: true }
          : { isActive: true },
      })
      .sort({ addedAt: -1 })
      .lean();

    // Filter out any where tutorProfile is null (tutor deactivated after empanelment)
    const active = empanelments.filter(e => e.tutorProfile !== null);

    // Enrich: count sessions this tutor has completed with THIS NGO's beneficiaries
    const beneficiaries = await User.find(
      { ngoParent: req.user._id, role: 'student' },
      { _id: 1 }
    ).lean();
    const beneficiaryIds = beneficiaries.map(b => b._id);

    let sessionCountMap = {};
    if (beneficiaryIds.length > 0) {
      const tutorProfileIds = active.map(e => e.tutorProfile._id);
      const sessionCounts = await Session.aggregate([
        {
          $match: {
            tutorProfile: { $in: tutorProfileIds },
            student: { $in: beneficiaryIds },
            status: 'completed',
          },
        },
        { $group: { _id: '$tutorProfile', count: { $sum: 1 } } },
      ]);
      sessionCountMap = Object.fromEntries(
        sessionCounts.map(s => [s._id.toString(), s.count])
      );
    }

    const enriched = active.map(e => ({
      empanelmentId: e._id,
      addedAt: e.addedAt,
      notes: e.notes,
      tutorProfile: e.tutorProfile,
      sessionsWithNgo: sessionCountMap[e.tutorProfile._id.toString()] || 0,
    }));

    res.json({
      success: true,
      tutors: enriched,
      total: enriched.length,
    });
  } catch (err) {
    console.error('[NGO] getEmpanelledTutors error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load trusted tutors.' });
  }
};

// ── DELETE /api/ngo/empanel/:tutorProfileId ──────────────────────────────────
/**
 * Removes a tutor from the NGO's trusted pool (soft delete).
 * Existing sessions with this tutor are NOT affected.
 */
exports.removeEmpanelment = async (req, res) => {
  try {
    const { tutorProfileId } = req.params;

    const empanelment = await Empanelment.findOne({
      ngo: req.user._id,
      tutorProfile: tutorProfileId,
      status: 'active',
    });

    if (!empanelment) {
      return res.status(404).json({
        success: false,
        message: 'This tutor is not in your trusted pool.',
      });
    }

    empanelment.status = 'removed';
    await empanelment.save();

    res.json({
      success: true,
      message: 'Tutor removed from your trusted pool. Existing sessions are unaffected.',
    });
  } catch (err) {
    console.error('[NGO] removeEmpanelment error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to remove tutor.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NGO-INITIATED BOOKING
// ═══════════════════════════════════════════════════════════════════════════

// ── POST /api/ngo/book-session ───────────────────────────────────────────────
/**
 * NGO books a session on behalf of 1–3 beneficiaries with an empanelled tutor.
 *
 * Multi-student booking:
 *   - A shared `groupId` (new ObjectId) is assigned to all sessions.
 *   - Sessions are created individually — one per student.
 *   - Per-student duplicate-trial checking is enforced independently.
 *   - If some students pass and some fail validation, valid sessions are
 *     still created and partial results are reported back.
 *
 * Body:
 *   beneficiaryIds   [ObjectId]   max 3 — at least 1 required
 *   tutorProfileId   ObjectId     must be empanelled by this NGO
 *   subject          String
 *   scheduledAt      ISO date string (must be in the future)
 *   mode             'online' | 'offline'  (default: 'online')
 *   type             'trial' | 'regular'   (default: 'trial')
 *   notes            String (optional)
 */
exports.bookSession = async (req, res) => {
  try {
    const {
      beneficiaryIds,
      tutorProfileId,
      subject,
      scheduledAt,
      mode,
      type,
      notes,
    } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!beneficiaryIds || !Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one beneficiary is required.' });
    }
    if (beneficiaryIds.length > 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 beneficiaries per booking.' });
    }
    if (!tutorProfileId || !subject || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Tutor, subject, and scheduled time are required.' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid session date/time.' });
    }
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Session must be scheduled in the future.' });
    }

    const sessionType = type === 'regular' ? 'regular' : 'trial';
    const sessionMode = sessionType === 'trial' ? 'online' : (mode || 'online');

    // ── Resolve & validate tutor ────────────────────────────────────────────
    const tutorProfile = await TutorProfile.findById(tutorProfileId)
      .select('name subjects area city isActive user hourlyRate');
    if (!tutorProfile || !tutorProfile.isActive) {
      return res.status(404).json({ success: false, message: 'Tutor not found or inactive.' });
    }
    if (!tutorProfile.user) {
      return res.status(500).json({ success: false, message: 'Tutor account has a configuration issue.' });
    }

    // ── Empanelment check (strict: NGO can only book empanelled tutors) ──────
    const empanelment = await Empanelment.findOne({
      ngo: req.user._id,
      tutorProfile: tutorProfileId,
      status: 'active',
    });
    if (!empanelment) {
      return res.status(403).json({
        success: false,
        code: 'TUTOR_NOT_EMPANELLED',
        message: `${tutorProfile.name} is not in your trusted tutor pool. Add them first.`,
      });
    }

    // ── Resolve & validate all beneficiaries ───────────────────────────────
    const allBeneficiaries = await User.find(
      { ngoParent: req.user._id, role: 'student', _id: { $in: beneficiaryIds } },
      { _id: 1, name: 1 }
    ).lean();

    // Check every requested ID belongs to this NGO
    const foundIds = new Set(allBeneficiaries.map(b => b._id.toString()));
    const invalidIds = beneficiaryIds.filter(id => !foundIds.has(id.toString()));
    if (invalidIds.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'One or more students do not belong to your organisation.',
        invalidIds,
      });
    }

    // ── Session amount ──────────────────────────────────────────────────────
    const amount = sessionType === 'regular' ? (tutorProfile.hourlyRate || 0) : 0;

    // ── NGO context note (appended to tutor-visible notes) ─────────────────
    // Informs the tutor this is an NGO-coordinated session for underprivileged students.
    const orgName = req.user.qualification || req.user.name || 'an NGO';
    const ngoContextNote = [
      `📌 NGO Session — booked by ${orgName}.`,
      'This session supports quality education for underprivileged students.',
      notes ? `\n${notes}` : '',
    ].join(' ').trim();

    // ── Group ID — assigned only when multiple students share a booking ─────
    const groupId = allBeneficiaries.length > 1
      ? new mongoose.Types.ObjectId()
      : null;

    // ── Create sessions per student, with individual duplicate-trial checks ─
    const created = [];
    const skipped = [];

    for (const beneficiary of allBeneficiaries) {
      if (sessionType === 'trial') {
        const activeTrial = await Session.findOne({
          student: beneficiary._id,
          tutorProfile: tutorProfileId,
          type: 'trial',
          status: { $in: ['pending', 'accepted'] },
        });
        if (activeTrial) {
          skipped.push({
            studentId: beneficiary._id,
            studentName: beneficiary.name,
            reason: `${beneficiary.name} already has an active trial with ${tutorProfile.name}.`,
            code: 'DUPLICATE_TRIAL',
          });
          continue;
        }
      }

      const session = await Session.create({
        student: beneficiary._id,
        tutor: tutorProfile.user,
        tutorProfile: tutorProfileId,
        type: sessionType,
        subject,
        scheduledAt: scheduledDate,
        mode: sessionMode,
        notes: ngoContextNote,
        amount,
        bookedBy: 'ngo',
        groupId: groupId,
      });

      created.push({
        sessionId: session._id,
        studentId: beneficiary._id,
        studentName: beneficiary.name,
        status: session.status,
      });
    }

    // ── Response ────────────────────────────────────────────────────────────
    if (created.length === 0) {
      return res.status(409).json({
        success: false,
        code: 'ALL_SKIPPED',
        message: 'No sessions were created. All selected beneficiaries already have active trials with this tutor.',
        skipped,
      });
    }

    const httpStatus = skipped.length > 0 ? 207 : 201; // 207 = Multi-Status (partial success)
    return res.status(httpStatus).json({
      success: true,
      groupId: groupId?.toString() || null,
      sessionType,
      tutor: { _id: tutorProfile._id, name: tutorProfile.name },
      created,
      skipped,
      contextMessage: 'This session supports quality education for underprivileged students.',
    });
  } catch (err) {
    console.error('[NGO] bookSession error:', err.message, err.stack);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: 'Failed to book session. Please try again.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NGO FEEDBACK / EVALUATION
// ═══════════════════════════════════════════════════════════════════════════

// ── PATCH /api/ngo/sessions/:id/feedback ────────────────────────────────────
/**
 * NGO submits an evaluation of a tutor after a trial/regular session.
 *
 * Rules:
 *   - Only the NGO who booked the session (bookedBy: 'ngo') can submit feedback.
 *   - The session must belong to one of this NGO's beneficiaries.
 *   - Session must be completed.
 *   - Feedback can be updated (NGO changes their mind after reflection).
 *   - Does NOT affect the tutor's public rating or student review system.
 *
 * Body:
 *   rating   Number 1–5 (required)
 *   comment  String (optional)
 */
exports.addNgoFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Feedback can only be added to completed sessions.' });
    }
    if (session.bookedBy !== 'ngo') {
      return res.status(403).json({ success: false, message: 'Only NGO-booked sessions can receive NGO feedback.' });
    }

    // Verify this session's student belongs to THIS NGO (data isolation)
    const beneficiary = await User.findOne({
      _id: session.student,
      ngoParent: req.user._id,
      role: 'student',
    }).select('_id').lean();

    if (!beneficiary) {
      return res.status(403).json({ success: false, message: 'This session does not belong to your organisation.' });
    }

    // Update — allows NGO to revise feedback
    session.ngoFeedback = {
      rating: Number(rating),
      comment: (comment || '').trim(),
      submittedAt: new Date(),
    };
    await session.save();

    res.json({
      success: true,
      message: 'Evaluation saved successfully.',
      ngoFeedback: session.ngoFeedback,
    });
  } catch (err) {
    console.error('[NGO] addNgoFeedback error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save evaluation.' });
  }
};


// ════════════════════════════════════════════════════════════════════════════════
// COLLABORATION SYSTEM — Phase 3
// ════════════════════════════════════════════════════════════════════════════════

const CollabRequest = require('../models/CollabRequest.model');
const Assignment = require('../models/Assignment.model');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ngo/collab-request
// Body: { tutorProfileId, subjects[], targetGrade, frequency?, studentCount?, message? }
//
// Gate 1: Tutor must be in NGO's empanelled pool (active empanelment).
// Gate 2: No active (pending/accepted) request already exists for this pair.
// ─────────────────────────────────────────────────────────────────────────────
exports.sendCollabRequest = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const { tutorProfileId, subjects, targetGrade, frequency, studentCount, message } = req.body;

    // ── Validate inputs ──────────────────────────────────────────
    if (!tutorProfileId) {
      return res.status(400).json({ success: false, message: 'tutorProfileId is required.' });
    }
    if (!targetGrade || !String(targetGrade).trim()) {
      return res.status(400).json({ success: false, message: 'targetGrade is required.' });
    }

    // ── Gate 1: Empanelment check ────────────────────────────────
    const empanelment = await Empanelment.findOne({
      ngo: ngoId,
      tutorProfile: tutorProfileId,
      status: 'active',
    }).lean();

    if (!empanelment) {
      return res.status(403).json({
        success: false,
        code: 'NOT_EMPANELLED',
        message: 'You must add this tutor to your pool before sending a collaboration request.',
      });
    }

    // ── Gate 2: Duplicate active request check ───────────────────
    const existingActive = await CollabRequest.findOne({
      ngo: ngoId,
      tutorProfile: tutorProfileId,
      status: { $in: ['pending', 'accepted'] },
    }).lean();

    if (existingActive) {
      return res.status(409).json({
        success: false,
        code: 'REQUEST_ALREADY_EXISTS',
        message: existingActive.status === 'accepted'
          ? 'You already have an active collaboration with this tutor.'
          : 'A pending request already exists for this tutor. Wait for their response or cancel the existing request.',
      });
    }

    // ── Resolve tutor User._id via TutorProfile ──────────────────
    const tutorProfile = await TutorProfile.findById(tutorProfileId).select('user name').lean();
    if (!tutorProfile) {
      return res.status(404).json({ success: false, message: 'Tutor not found.' });
    }

    // ── Gate B: Only verified tutors can receive collab requests ──
    const skipGate = process.env.SKIP_VERIFICATION_GATE === 'true';
    if (!skipGate) {
      const tutorUser = await User.findById(tutorProfile.user)
        .select('verificationStatus')
        .lean();
      if (!tutorUser || tutorUser.verificationStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          code: 'TUTOR_NOT_VERIFIED',
          message: 'This tutor has not been verified yet. You can only collaborate with verified tutors.',
        });
      }
    }

    // ── Create request ───────────────────────────────────────────
    const request = await CollabRequest.create({
      ngo: ngoId,
      tutorProfile: tutorProfileId,
      tutor: tutorProfile.user,
      subjects: Array.isArray(subjects) ? subjects : [], 
      targetGrade: String(targetGrade).trim(),
      frequency: frequency ? String(frequency).trim() : '',
      studentCount: studentCount ? Math.max(0, Number(studentCount)) : 0,
      message: message ? String(message).trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `Collaboration request sent to ${tutorProfile.name}.`,
      request: {
        _id: request._id,
        status: request.status,
        subjects: request.subjects,
        targetGrade: request.targetGrade,
        expiresAt: request.expiresAt,
        createdAt: request.createdAt,
      },
    });
  } catch (err) {
    console.error('[NGO] sendCollabRequest error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send collaboration request.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/collab-requests
// Query: ?status=pending|accepted|declined|cancelled|all (default: all)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCollabRequests = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const { status } = req.query;

    const query = { ngo: ngoId };
    if (status && status !== 'all') {
      const allowed = ['pending', 'accepted', 'declined', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status filter. Allowed: ${allowed.join(', ')}.` });
      }
      query.status = status;
    }

    const requests = await CollabRequest
      .find(query)
      .populate('tutorProfile', 'name area city subjects rating totalReviews isVerified')
      .sort({ createdAt: -1 })
      .lean();

    // For accepted requests, also fetch tutor User contact (phone)
    // NGO deserves tutor contact after acceptance — contact is symmetric
    const acceptedTutorUserIds = requests
      .filter(r => r.status === 'accepted')
      .map(r => r.tutor)
      .filter(Boolean);

    let tutorContactMap = {};
    if (acceptedTutorUserIds.length > 0) {
      const tutorUsers = await User.find({ _id: { $in: acceptedTutorUserIds } })
        .select('_id phone email')
        .lean();
      tutorUsers.forEach(u => {
        tutorContactMap[u._id.toString()] = { phone: u.phone || null, email: u.email || null };
      });
    }

    // Check which accepted requests already have an active assignment
    const acceptedIds = requests
      .filter(r => r.status === 'accepted')
      .map(r => r._id);

    let assignedRequestIds = new Set();
    if (acceptedIds.length > 0) {
      const assignments = await Assignment.find({
        ngo: ngoId,
        collabRequest: { $in: acceptedIds },
        status: 'active',
      }).select('collabRequest').lean();
      assignedRequestIds = new Set(assignments.map(a => a.collabRequest.toString()));
    }

    // Explicitly shape every response object — never spread raw document
    const shaped = requests.map(r => {
      const tutorContact = r.status === 'accepted' && r.tutor
        ? tutorContactMap[r.tutor.toString()] || null
        : null;

      return {
        _id: r._id,
        status: r.status,
        subjects: r.subjects,
        targetGrade: r.targetGrade,
        frequency: r.frequency,
        studentCount: r.studentCount,
        message: r.message,
        tutorNote: r.tutorNote,
        respondedAt: r.respondedAt,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        hasActiveAssignment: assignedRequestIds.has(r._id.toString()),
        // Tutor profile (public fields — always visible so NGO knows who they sent to)
        tutorProfile: r.tutorProfile ? {
          _id: r.tutorProfile._id,
          name: r.tutorProfile.name,
          area: r.tutorProfile.area,
          city: r.tutorProfile.city,
          subjects: r.tutorProfile.subjects,
          rating: r.tutorProfile.rating,
          totalReviews: r.tutorProfile.totalReviews,
          isVerified: r.tutorProfile.isVerified,
        } : null,
        // Tutor contact: only after acceptance (contact exchange gate)
        tutorContact,
      };
    });

    res.json({ success: true, requests: shaped });
  } catch (err) {
    console.error('[NGO] getCollabRequests error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load collaboration requests.' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/ngo/collab-request/:id
// Cancels a pending request. Only the NGO who created it can cancel it.
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelCollabRequest = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const requestId = req.params.id;

    const request = await CollabRequest.findOne({ _id: requestId, ngo: ngoId });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel a request with status: "${request.status}". Only pending requests can be cancelled.`,
      });
    }

    request.status = 'cancelled';
    request.expiresAt = null; // stop TTL from also deleting it
    await request.save();

    res.json({ success: true, message: 'Collaboration request cancelled.' });
  } catch (err) {
    console.error('[NGO] cancelCollabRequest error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to cancel request.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ngo/assignment
// Body: { collabRequestId, grade, subjects[], studentCount, notes? }
//
// Creates a group assignment from an accepted CollabRequest.
// Updates User.assignedTutor for beneficiaries (NGO-internal mapping).
// ─────────────────────────────────────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const { collabRequestId, grade, studentCount, notes } = req.body;

    if (!collabRequestId) {
      return res.status(400).json({ success: false, message: 'collabRequestId is required.' });
    }
    if (!grade || !String(grade).trim()) {
      return res.status(400).json({ success: false, message: 'grade is required.' });
    }

    // ── Verify the collab request ─────────────────────────────────
    const collabRequest = await CollabRequest.findOne({
      _id: collabRequestId,
      ngo: ngoId,
      status: 'accepted',
    }).lean();

    if (!collabRequest) {
      return res.status(404).json({
        success: false,
        message: 'No accepted collaboration request found with that ID.',
      });
    }

    // ── Check for existing active assignment for this pair ────────
    const existingAssignment = await Assignment.findOne({
      ngo: ngoId,
      tutorProfile: collabRequest.tutorProfile,
      status: 'active',
    }).lean();

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        code: 'ASSIGNMENT_ALREADY_EXISTS',
        message: 'An active assignment already exists for this tutor. End the existing assignment before creating a new one.',
      });
    }

    // ── Resolve beneficiary IDs from NGO's cohort ─────────────────
    // We automatically include all of NGO's beneficiaries as the pool.
    // studentCount is used for display; beneficiaryIds for internal mapping.
    const beneficiaries = await User.find({ ngoParent: ngoId })
      .select('_id')
      .lean();
    const beneficiaryIds = beneficiaries.map(b => b._id);

    const displayCount = studentCount
      ? Math.max(0, Number(studentCount))
      : beneficiaryIds.length;

    // ── Create assignment ─────────────────────────────────────────
    const assignment = await Assignment.create({
      ngo: ngoId,
      tutorProfile: collabRequest.tutorProfile,
      tutor: collabRequest.tutor,
      collabRequest: collabRequestId,
      grade: String(grade).trim(),
      subjects: collabRequest.subjects || [],
      studentCount: displayCount,
      beneficiaryIds: beneficiaryIds,
      notes: notes ? String(notes).trim() : '',
    });

    // ── Update User.assignedTutor for all beneficiaries ───────────
    if (beneficiaryIds.length > 0) {
      await User.updateMany(
        { _id: { $in: beneficiaryIds } },
        { $set: { assignedTutor: collabRequest.tutorProfile } }
      );
    }

    // Return without beneficiaryIds (internal field)
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      assignment: {
        _id: assignment._id,
        grade: assignment.grade,
        subjects: assignment.subjects,
        studentCount: assignment.studentCount,
        status: assignment.status,
        createdAt: assignment.createdAt,
      },
    });
  } catch (err) {
    console.error('[NGO] createAssignment error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create assignment.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/assignments
// Query: ?status=active|ended|all (default: active)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const status = req.query.status || 'active';

    const query = { ngo: ngoId };
    if (status !== 'all') {
      const allowed = ['active', 'ended'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter. Allowed: active, ended, all.' });
      }
      query.status = status;
    }

    // +notes: NGO should see their own private notes on their own assignments
    // beneficiaryIds remains select:false — not fetched here
    const assignments = await Assignment
      .find(query)
      .select('+notes')
      .populate('tutorProfile', 'name area city subjects rating isVerified')
      .sort({ createdAt: -1 })
      .lean();

    // Explicitly shape — no raw spread, no accidental field leak
    const shaped = assignments.map(a => ({
      _id: a._id,
      grade: a.grade,
      subjects: a.subjects,
      studentCount: a.studentCount,
      status: a.status,
      notes: a.notes || '',   // NGO's private notes — safe here
      endReason: a.endReason || '',
      endedAt: a.endedAt,
      createdAt: a.createdAt,
      tutorProfile: a.tutorProfile ? {
        _id: a.tutorProfile._id,
        name: a.tutorProfile.name,
        area: a.tutorProfile.area,
        city: a.tutorProfile.city,
        subjects: a.tutorProfile.subjects,
        rating: a.tutorProfile.rating,
        isVerified: a.tutorProfile.isVerified,
      } : null,
    }));

    res.json({ success: true, assignments: shaped });
  } catch (err) {
    console.error('[NGO] getAssignments error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load assignments.' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ngo/assignment/:id/end
// Body: { reason? }
// Ends an active assignment and clears assignedTutor on beneficiaries.
// ─────────────────────────────────────────────────────────────────────────────
exports.endAssignment = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const assignmentId = req.params.id;
    const { reason } = req.body;

    // Select beneficiaryIds explicitly (it's select:false by default)
    const assignment = await Assignment
      .findOne({ _id: assignmentId, ngo: ngoId, status: 'active' })
      .select('+beneficiaryIds');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Active assignment not found.' });
    }

    // ── Clear assignedTutor for all affected beneficiaries ────────
    if (assignment.beneficiaryIds?.length > 0) {
      await User.updateMany(
        {
          _id: { $in: assignment.beneficiaryIds },
          assignedTutor: assignment.tutorProfile,
        },
        { $set: { assignedTutor: null } }
      );
    }

    assignment.status = 'ended';
    assignment.endReason = reason ? String(reason).trim() : '';
    assignment.endedAt = new Date();
    await assignment.save();

    res.json({ success: true, message: 'Assignment ended successfully.' });
  } catch (err) {
    console.error('[NGO] endAssignment error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to end assignment.' });
  }
};
