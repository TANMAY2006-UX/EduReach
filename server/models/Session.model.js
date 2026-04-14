const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  tutor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  tutorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorProfile', required: true },

  type:         { type: String, enum: ['trial', 'regular'], default: 'trial' },
  subject:      { type: String, required: true },
  scheduledAt:  { type: Date, required: true },
  durationMins: { type: Number, default: 60 },
  mode:         { type: String, enum: ['online', 'offline'], default: 'online' },
  notes:        { type: String, default: '' },

  meetingLink:     { type: String, default: '' },
  studentJoinedAt: { type: Date, default: null },
  tutorJoinedAt:   { type: Date, default: null },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },

  rescheduledAt:   { type: Date, default: null },
  rescheduledNote: { type: String, default: '' },

  cancelledBy:      { type: String, enum: ['student', 'tutor', 'system', null], default: null },
  cancellationNote: { type: String, default: '' },
  cancelledAt:      { type: Date, default: null },

  studentRating:   { type: Number, min: 1, max: 5, default: null },
  studentReview:   { type: String, default: '' },
  privateFeedback: { type: String, default: '' },
  tutorNotes:      { type: String, default: '' },
  isReviewed:      { type: Boolean, default: false },

  amount:  { type: Number, default: 0 },
  isPaid:  { type: Boolean, default: false },

  reminderSent: { type: Boolean, default: false },

  // Auto-expire: 48h after creation if still pending
  autoExpireAt: { type: Date, default: null },

}, { timestamps: true });

// ── FIX: Use function keyword + next parameter correctly ──────
SessionSchema.pre('save', async function () {
  if (this.isNew && this.status === 'pending' && !this.autoExpireAt) {
    const expire = new Date();
    expire.setHours(expire.getHours() + 48);
    this.autoExpireAt = expire;
  } // ← this was missing, caused "next is not a function"
});

SessionSchema.index({ student: 1, status: 1, scheduledAt: -1 });
SessionSchema.index({ tutor: 1, status: 1, scheduledAt: -1 });
SessionSchema.index({ tutorProfile: 1, status: 1 });
SessionSchema.index({ scheduledAt: 1 });
SessionSchema.index({ autoExpireAt: 1, status: 1 });

module.exports = mongoose.model('Session', SessionSchema);