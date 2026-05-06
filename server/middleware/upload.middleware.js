/**
 * EduReach — Upload Middleware
 *
 * Configures multer with CloudinaryStorage for handling file uploads.
 *
 * Design decisions:
 *   - Files go to role+userId scoped Cloudinary folders for clean management.
 *   - Allowed MIME types: JPEG, PNG, WebP, PDF only.
 *   - Max file size: 5 MB.
 *   - `aadhaar` goes to a separate `restricted` sub-folder for admin-only access.
 *   - `certifications` allows up to 5 files (multer array).
 *
 * Role → Allowed document types:
 *   tutor:   degree, certifications, aadhaar
 *   student: schoolId
 *   ngo:     registrationProof
 */

const multer              = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary          = require('../config/cloudinary');

// ── Allowed MIME types ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// ── Role → allowed document types ──────────────────────────────────────────
const ROLE_DOCUMENT_MAP = {
  tutor:   ['degree', 'certifications', 'aadhaar'],
  student: ['schoolId'],
  ngo:     ['registrationProof', 'aadhaar'],
};

/**
 * Returns true if the given role is allowed to upload the given documentType.
 */
const isAllowedDocumentType = (role, documentType) => {
  return ROLE_DOCUMENT_MAP[role]?.includes(documentType) ?? false;
};

/**
 * Builds the Cloudinary folder path based on role, userId, and documentType.
 * Aadhaar documents are placed in a dedicated `restricted` sub-path.
 */
const buildFolder = (role, userId, documentType) => {
  const base = `edureach/${role}s/${userId}`;
  return documentType === 'aadhaar' ? `${base}/restricted` : `${base}/${documentType}`;
};

/**
 * Factory that creates a multer upload instance for a given request.
 * Called inside the controller after role + documentType are resolved.
 */
const createUploadMiddleware = (role, userId, documentType) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:        buildFolder(role, userId, documentType),
      resource_type: 'auto',
      // Use a timestamp-based public_id to avoid collisions on re-upload
      public_id:     () => `${documentType}_${Date.now()}`,
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard cap
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
      }
    },
  });
};

module.exports = {
  createUploadMiddleware,
  isAllowedDocumentType,
  ROLE_DOCUMENT_MAP,
};
