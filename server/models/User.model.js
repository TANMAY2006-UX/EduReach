const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false }, // null for Google users
  googleId: { type: String, default: null },
  avatar: { type: String, default: null },
  role: {
    type: String,
    enum: ['student', 'tutor', 'ngo', 'admin'],
    default: null // null until onboarding is complete
  },
  isProfileComplete: { type: Boolean, default: false },
  phone: { type: String, default: null },
  location: {
    city: { type: String, default: null },
    area: { type: String, default: null }
  },
  isVerified: { type: Boolean, default: false }, // for tutors: admin-verified
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true
  }
}, { timestamps: true });

// Hash password before save (only for local auth)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);