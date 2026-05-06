/**
 * EduReach — CollabRequest Model
 *
 * Records a formal collaboration request sent by an NGO to a tutor.
 *
 * Design decisions:
 *   - Requires prior empanelment: NGO must have saved the tutor first.
 *   - Status is a soft state machine — no hard deletes for audit history.
 *   - `expiresAt` + sparse TTL index auto-clears stale pending requests.
 *   - Compound unique index prevents duplicate active requests.
 *   - Privacy: no student names/contacts stored here. Only grade + count.
 *
 * Status flow:
 *   pending  → accepted  (tutor responds)
 *   pending  → declined  (tutor responds)
 *   pending  → cancelled (NGO withdraws before tutor responds)
 *   pending  → [auto-expired by MongoDB TTL after expiresAt]
 *   declined → pending   (NGO re-sends after cooldown, creates a NEW doc)
 */

const mongoose = require('mongoose');

const CollabRequestSchema = new mongoose.Schema({

  // ── Parties ──────────────────────────────────────────────────────
  ngo: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // TutorProfile _id — primary reference for profile data
  tutorProfile: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'TutorProfile',
    required: true,
  },

  // User _id of the tutor — denormalised for fast tutor-side queries
  // (avoids a join through TutorProfile on every tutor dashboard load)
  tutor: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // ── Status ───────────────────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
  },

  // ── Request context (required so tutor can make an informed decision) ──
  subjects: {
    type:     [String],
    required: true,
    validate: {
      validator: v => Array.isArray(v) && v.length >= 1,
      message:   'At least one subject is required.',
    },
  },

  targetGrade: {
    type:     String,
    required: true,
    trim:     true,
    maxlength: 60,
  },

  // Estimated engagement — e.g. "3 sessions/week", "Weekday evenings"
  frequency: {
    type:      String,
    default:   '',
    trim:      true,
    maxlength: 100,
  },

  // Beneficiary count — lets tutor know class size without exposing identities
  studentCount: {
    type:    Number,
    default: 0,
    min:     0,
  },

  // NGO's pitch message to the tutor
  message: {
    type:      String,
    default:   '',
    trim:      true,
    maxlength: 500,
  },

  // ── Tutor response ───────────────────────────────────────────────
  tutorNote: {
    type:      String,
    default:   '',
    trim:      true,
    maxlength: 300,
  },

  respondedAt: {
    type:    Date,
    default: null,
  },

  // ── Contact exchange flag ────────────────────────────────────────
  // Set true when request is accepted — frontend uses this to show
  // NGO/tutor contact details to the respective other party.
  contactShared: {
    type:    Boolean,
    default: false,
  },

  // ── Expiry ───────────────────────────────────────────────────────
  // Pending requests auto-expire after 14 days via MongoDB TTL index.
  // Set to null for accepted/declined/cancelled (TTL index is sparse).
  expiresAt: {
    type:    Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────

// NGO dashboard: all requests for this NGO, sorted by recency
CollabRequestSchema.index({ ngo: 1, status: 1, createdAt: -1 });

// Tutor dashboard: incoming requests for this tutor
CollabRequestSchema.index({ tutor: 1, status: 1, createdAt: -1 });

// Prevent duplicate active requests: one pending/accepted per (ngo, tutorProfile) pair.
// Declined/cancelled requests are allowed to co-exist for history.
CollabRequestSchema.index(
  { ngo: 1, tutorProfile: 1, status: 1 },
  { unique: false } // uniqueness enforced at application layer — more flexible
);

// Sparse TTL: only documents with a non-null expiresAt are eligible for auto-deletion.
// Set expiresAt = null after accepting/declining to preserve history.
CollabRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('CollabRequest', CollabRequestSchema);
