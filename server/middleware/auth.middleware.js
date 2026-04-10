const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User.model');

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || user.authProvider !== 'local') {
        return done(null, false, { message: 'Invalid credentials' });
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // Check if email already exists with local auth
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Link Google to existing account
          user.googleId = profile.id;
          user.avatar = user.avatar || profile.photos[0].value;
          await user.save();
        } else {
          // Brand new user via Google
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0].value,
            authProvider: 'google',
            isProfileComplete: false,
            role: null
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));