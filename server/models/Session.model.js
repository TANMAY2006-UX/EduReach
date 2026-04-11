const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  // ── Participants ─────────────────────────────────────────────
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  tutor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  tutorProfile:  { type: mongoose.Schema.Types.ObjectId, ref: 'TutorProfile', required: true },

  // ── Session info ─────────────────────────────────────────────
  type:          { type: String, enum: ['trial', 'regular'], default: 'trial' },
  subject:       { type: String, required: true },
  scheduledAt:   { type: Date, required: true },
  durationMins:  { type: Number, default: 60 },
  mode:          { type: String, enum: ['online', 'offline'], default: 'online' },
  notes:         { type: String, default: '' }, // student's message to tutor

  // ── Status flow ──────────────────────────────────────────────
  // pending → accepted → completed / cancelled
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },

  // ── Cancellation ────────────────────────────────────────────
  cancelledBy:     { type: String, enum: ['student','tutor','system'], default: null },
  cancellationNote: { type: String, default: '' },
  cancelledAt:     { type: Date, default: null },

  // ── After session ────────────────────────────────────────────
  studentRating:   { type: Number, min: 1, max: 5, default: null },
  studentReview:   { type: String, default: '' },
  tutorNotes:      { type: String, default: '' }, // tutor's private notes
  isReviewed:      { type: Boolean, default: false },

  // ── Pricing ─────────────────────────────────────────────────
  amount:          { type: Number, default: 0 }, // 0 for trial
  isPaid:          { type: Boolean, default: false },

}, { timestamps: true });

// Indexes for fast lookups
SessionSchema.index({ student: 1, status: 1, scheduledAt: -1 });
SessionSchema.index({ tutor: 1, status: 1, scheduledAt: -1 });
SessionSchema.index({ tutorProfile: 1, status: 1 });
SessionSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Session', SessionSchema);