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

  // ── Verification system ────────────────────────────────────────
  // Status transitions: unsubmitted → pending → approved | rejected
  // Triggers: any document upload → 'pending'. Admin action → 'approved'/'rejected'.
  verificationStatus: {
    type:    String,
    enum:    ['unsubmitted', 'pending', 'approved', 'rejected'],
    default: 'unsubmitted',
  },

  // Populated by admin on rejection — shown to the user in their dashboard.
  verificationNote: {
    type:     String,
    default:  '',
    trim:     true,
    maxlength: 300,
  },

  // ── Documents (role-specific) ──────────────────────────────────
  // Cloudinary secure_url values. aadhaar is select:false — NEVER returned
  // in public or user-facing API responses. Admin explicitly selects it.
  documents: {
    // Tutor
    degree:            { type: String, default: null },
    certifications:    { type: [String], default: [] },
    aadhaar:           { type: String, default: null, select: false }, // NEVER expose
    // Student (B2C only)
    schoolId:          { type: String, default: null },
    // NGO
    registrationProof: { type: String, default: null },
  },

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

  // ── NGO-managed beneficiary fields ─────────────────────────
  // ngoParent: set when an NGO admin creates a student account.
  // Enables: User.find({ ngoParent: ngoId }) → all beneficiaries.
  // Null for self-registered students (no data migration needed).
  ngoParent: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',
    default: null,
    index:   true,   // fast cohort lookup
  },

  // assignedTutor: future-ready — NGO recommends a specific tutor
  // to a beneficiary. No UI surfaces this yet.
  assignedTutor: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'TutorProfile',
    default: null,
  },

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