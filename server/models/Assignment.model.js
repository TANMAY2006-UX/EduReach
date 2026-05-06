/**
 * EduReach — Assignment Model
 *
 * Records that a tutor has been formally assigned to teach a class/group
 * managed by an NGO. This is a GROUP-level assignment, NOT per-student.
 *
 * Design decisions:
 *   - `beneficiaryIds` is NGO-internal reference only. NEVER exposed to tutors.
 *   - Tutor sees only: grade, subjects, student count, NGO identity.
 *   - One active assignment per (ngo, tutorProfile) pair enforced at app layer.
 *   - `status: 'ended'` preserves history without hard deletes.
 *   - When ended, caller must also clear User.assignedTutor for beneficiaries.
 *
 * Privacy rule (strict):
 *   The `beneficiaryIds` array MUST NOT appear in any tutor-facing API response.
 *   Tutor-side queries select only: grade, subjects, studentCount, ngo info.
 */

const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({

  // ── Parties ──────────────────────────────────────────────────────
  ngo: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },

  tutorProfile: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'TutorProfile',
    required: true,
  },

  // Denormalised User ref for fast tutor-side queries
  tutor: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },

  // The request that initiated this assignment (traceability)
  collabRequest: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CollabRequest',
    required: true,
  },

  // ── Class / group context ─────────────────────────────────────────
  grade: {
    type:     String,
    required: true,
    trim:     true,
    maxlength: 60,
  },

  subjects: {
    type:     [String],
    required: [],
  },

  // Total number of students in this group (count only — no PII)
  studentCount: {
    type:    Number,
    required: true,
    default: 0,
    min:     0,
  },

  // ── NGO-internal only — NEVER sent to tutors ──────────────────────
  // Internal list of which beneficiaries belong to this assignment.
  // Used by NGO to manage their cohort and to update User.assignedTutor.
  beneficiaryIds: {
    type:    [mongoose.Schema.Types.ObjectId],
    ref:     'User',
    default: [],
    select:  false, // excluded from default queries — must be explicitly selected
  },

  // ── Status ────────────────────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['active', 'ended'],
    default: 'active',
  },

  // Reason for ending — for NGO's internal records
  endReason: {
    type:    String,
    default: '',
    trim:    true,
    maxlength: 200,
  },

  endedAt: {
    type:    Date,
    default: null,
  },

  // ── Optional NGO notes (not visible to tutor) ─────────────────────
  notes: {
    type:    String,
    default: '',
    trim:    true,
    maxlength: 500,
    select:  false, // NGO-only field
  },

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────

// NGO assignments list
AssignmentSchema.index({ ngo: 1, status: 1, createdAt: -1 });

// Tutor's active assignments
AssignmentSchema.index({ tutor: 1, status: 1 });

// One active assignment per tutor per NGO (soft constraint — enforced at app layer)
AssignmentSchema.index({ ngo: 1, tutorProfile: 1, status: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
