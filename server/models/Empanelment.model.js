/**
 * EduReach — Empanelment Model
 *
 * An "empanelment" records that an NGO has vetted and trusted a marketplace
 * tutor. It is a soft relationship — the tutor retains full autonomy over
 * their profile, rates, and session acceptance.
 *
 * Key design choices:
 *   - Compound unique index prevents double-empanelling the same tutor.
 *   - `status: 'removed'` keeps audit history rather than hard-deleting.
 *   - Querying active empanelments: { ngo, status: 'active' }
 */

const mongoose = require('mongoose');

const EmpanelmentSchema = new mongoose.Schema({
  // The NGO user who empanelled this tutor
  ngo: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // The TutorProfile that was empanelled (links to both User and profile data)
  tutorProfile: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'TutorProfile',
    required: true,
  },

  // 'active'  — currently in the NGO's trusted pool
  // 'removed' — previously empanelled, then removed (kept for history)
  status: {
    type:    String,
    enum:    ['active', 'removed'],
    default: 'active',
  },

  // Convenience alias — when the empanelment was first created.
  // Same as createdAt but explicitly named for readability in queries.
  addedAt: {
    type:    Date,
    default: Date.now,
  },

  // Optional: NGO's private notes about why this tutor was chosen.
  // Not exposed to the tutor. Future UI may surface this.
  notes: {
    type:    String,
    default: '',
    trim:    true,
    maxlength: 500,
  },

}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary lookup: all active tutors for a given NGO
EmpanelmentSchema.index({ ngo: 1, status: 1 });

// Uniqueness: one empanelment record per (ngo, tutorProfile) pair.
// Prevents double-inserts. Re-empanelling uses status update, not new doc.
EmpanelmentSchema.index({ ngo: 1, tutorProfile: 1 }, { unique: true });

module.exports = mongoose.model('Empanelment', EmpanelmentSchema);
