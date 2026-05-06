/**
 * EduReach — Upload Routes
 *
 * POST /api/upload/document?documentType=<type>   — upload a file
 * GET  /api/upload/my-documents                   — get own docs + status
 *
 * All routes require authentication. Role gate is enforced in the controller.
 */

const express = require('express');
const router  = express.Router();

const { uploadDocument, getMyDocuments } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // all upload routes require login

router.post('/document',     uploadDocument);
router.get('/my-documents',  getMyDocuments);

module.exports = router;
