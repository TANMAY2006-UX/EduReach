const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, isProfileComplete: user.isProfileComplete },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const sendTokenCookie = (res, user) => {
  const token = generateToken(user);
  res.cookie('edureach_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return token;
};

module.exports = { generateToken, sendTokenCookie };