const mongoose = require('mongoose');

// ── Availability slot schema ───────────────────────────────────
const SlotSchema = new mongoose.Schema({
  day:   { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  start: { type: String, required: true }, // "09:00"
  end:   { type: String, required: true }, // "11:00"
}, { _id: false });

// ── Review schema (embedded) ───────────────────────────────────
const ReviewSchema = new mongoose.Schema({
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  rating:    { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, trim: true, maxlength: 500 },
  session:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
}, { timestamps: true });

// ── Main TutorProfile schema ───────────────────────────────────
const TutorProfileSchema = new mongoose.Schema({
  // Link to User auth document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ── Visible profile info ────────────────────────────────────
  name:          { type: String, required: true, trim: true },
  avatar:        { type: String, default: null },
  bio:           { type: String, trim: true, maxlength: 600, default: '' },
  qualification: { type: String, trim: true, default: '' },
  experience:    { type: String, default: '' },
  subjects:      { type: [String], default: [] },
  grade:         { type: String, default: '' }, // "Class 8–12", "Undergraduate" etc.
  languages:     { type: [String], default: ['Hindi', 'English'] },

  // ── Location ────────────────────────────────────────────────
  // city/area stored as strings for display
  city:  { type: String, default: 'Mumbai' },
  area:  { type: String, default: '' },

  // GeoJSON point for proximity search (longitude first!)
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      default: [72.8777, 19.0760], // Default: Mumbai city center
    },
  },

  // ── Pricing ─────────────────────────────────────────────────
  hourlyRate:   { type: Number, default: 0 },   // ₹ per hour
  trialFree:    { type: Boolean, default: true },
  online:       { type: Boolean, default: true },
  offline:      { type: Boolean, default: true },

  // ── Verification & status ────────────────────────────────────
  isVerified:        { type: Boolean, default: false },
  verificationDocs:  { type: [String], default: [] }, // Cloudinary URLs
  isActive:          { type: Boolean, default: true },

  // ── Ratings (denormalised for fast reads) ───────────────────
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  reviews:      { type: [ReviewSchema], default: [] },

  // ── Availability ────────────────────────────────────────────
  availability: { type: [SlotSchema], default: [] },

  // ── Stats ────────────────────────────────────────────────────
  totalSessions: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },

}, { timestamps: true });

// ── 2dsphere index on geoLocation for $near queries ──────────
TutorProfileSchema.index({ geoLocation: '2dsphere' });

// ── Text index for search by name, bio, subjects ──────────────
TutorProfileSchema.index({
  name:     'text',
  bio:      'text',
  subjects: 'text',
});

// ── Compound index for area + subject filtering ───────────────
TutorProfileSchema.index({ area: 1, subjects: 1, isActive: 1, isVerified: 1 });
TutorProfileSchema.index({ rating: -1, totalReviews: -1 }); // default sort

// ── Static: recalculate average rating after a new review ────
TutorProfileSchema.methods.recalcRating = function () {
  if (!this.reviews.length) {
    this.rating = 0;
    this.totalReviews = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
  this.totalReviews = this.reviews.length;
};

module.exports = mongoose.model('TutorProfile', TutorProfileSchema);