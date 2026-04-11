const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // ── Core identity ──────────────────────────────────────────
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },   // null for Google users
  googleId: { type: String, default: null },
  avatar:   { type: String, default: null },

  // ── Auth ───────────────────────────────────────────────────
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true
  },

  // ── Role & profile status ──────────────────────────────────
  role: {
    type: String,
    enum: ['student', 'tutor', 'ngo', 'admin'],
    default: null   // null until onboarding complete
  },
  isProfileComplete: { type: Boolean, default: false },
  isVerified:        { type: Boolean, default: false },  // tutor: admin-verified credential

  // ── Contact ────────────────────────────────────────────────
  phone: { type: String, default: null },

  // ── Location ───────────────────────────────────────────────
  location: {
    city: { type: String, default: null },
    area: { type: String, default: null },
  },

  // ── Academic / teaching profile ────────────────────────────
  subjects:       { type: [String], default: [] },
  grade:          { type: String, default: null },    // student: their class level
  board:          { type: String, default: null },    // student: CBSE / ICSE / SSC etc.
  experience:     { type: String, default: null },    // tutor: years of experience
  qualification:  { type: String, default: null },    // tutor: highest degree / NGO: org name
  bio:            { type: String, default: null },    // tutor: about section

}, { timestamps: true });

// ── Pre-save: hash password (local auth only) ──────────────
// Hash password before save (only for local auth)
UserSchema.pre('save', async function () {
  // Notice we removed 'next' from the parameters and the returns!
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance method: compare password ─────────────────────
UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);