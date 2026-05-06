/**
 * EduReach — Upload Controller
 *
 * POST /api/upload/document
 *   Uploads a file to Cloudinary and saves the secure_url to User.documents.
 *   Sets verificationStatus = 'pending' after any upload.
 *
 * GET /api/upload/my-documents
 *   Returns the current user's document URLs and verification status.
 *   aadhaar URL is NEVER returned here (select: false + explicit exclusion).
 *
 * Access control:
 *   - Role gate: only allowed documentTypes per role accepted.
 *   - SKIP_VERIFICATION_GATE env flag bypasses gates for dev mode.
 */

const User = require('../models/User.model');
const {
  createUploadMiddleware,
  isAllowedDocumentType,
} = require('../middleware/upload.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload/document
// Body: multipart/form-data { file, documentType }
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadDocument = (req, res) => {
  const { documentType } = req.query; // passed as ?documentType=degree
  const role             = req.user.role;
  const userId           = req.user._id.toString();

  // ── Role + documentType validation ───────────────────────────────────────
  if (!documentType) {
    return res.status(400).json({ success: false, message: 'documentType query param is required.' });
  }

  if (!isAllowedDocumentType(role, documentType)) {
    return res.status(403).json({
      success: false,
      message: `Role "${role}" is not allowed to upload document type "${documentType}".`,
    });
  }

  // ── Build multer instance for this upload ─────────────────────────────────
  const isMulti = documentType === 'certifications';
  const upload  = createUploadMiddleware(role, userId, documentType);
  const multerFn = isMulti
    ? upload.array('file', 5)   // up to 5 certifications
    : upload.single('file');

  multerFn(req, res, async (err) => {
    if (err) {
      const status = err.message?.includes('Invalid file type') ||
                     err.message?.includes('File too large') ? 400 : 500;
      return res.status(status).json({ success: false, message: err.message });
    }

    const files = isMulti ? req.files : (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file received.' });
    }

    try {
      const urls = files.map(f => f.path); // Cloudinary secure_url stored in f.path

      // ── Persist to User.documents ─────────────────────────────────────────
      let updateOp;
      if (isMulti) {
        // Push new URLs into the certifications array (up to 5 total)
        const user = await User.findById(userId).select('documents.certifications').lean();
        const existing = user?.documents?.certifications || [];
        const combined = [...existing, ...urls].slice(-5); // keep latest 5
        updateOp = { $set: { 'documents.certifications': combined, verificationStatus: 'pending' } };
      } else {
        updateOp = { $set: { [`documents.${documentType}`]: urls[0], verificationStatus: 'pending' } };
      }

      await User.findByIdAndUpdate(userId, updateOp);

      return res.status(200).json({
        success: true,
        message: 'Document uploaded. Verification is pending.',
        documentType,
        urls: isMulti ? urls : undefined,
        url:  isMulti ? undefined : urls[0],
        verificationStatus: 'pending',
      });

    } catch (dbErr) {
      console.error('[UPLOAD] DB save error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Upload succeeded but failed to save record.' });
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/upload/my-documents
// Returns current document URLs and verification status.
// aadhaar is NEVER included in this response.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Explicitly select documents fields EXCEPT aadhaar (which is select:false)
    // We build the projection manually to be explicit.
    const user = await User.findById(userId)
      .select('verificationStatus verificationNote documents.degree documents.certifications documents.schoolId documents.registrationProof')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      verificationStatus: user.verificationStatus,
      verificationNote:   user.verificationNote || '',
      documents: {
        degree:             user.documents?.degree             || null,
        certifications:     user.documents?.certifications     || [],
        // aadhaar is intentionally OMITTED
        schoolId:           user.documents?.schoolId           || null,
        registrationProof:  user.documents?.registrationProof  || null,
      },
    });
  } catch (err) {
    console.error('[UPLOAD] getMyDocuments error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load documents.' });
  }
};
