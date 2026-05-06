/**
 * EduReach — Cloudinary Configuration
 *
 * Initialises the Cloudinary SDK using environment variables.
 * Import this module wherever Cloudinary's API is needed.
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
