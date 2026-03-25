// File Upload Middleware
import path from 'path';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * PDF-only file filter.
 * Checks both MIME type and file extension.
 */
const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.mimetype !== 'application/pdf' || extension !== '.pdf') {
    cb(new ApiError(400, 'Only PDF files are allowed', [], false));
    return;
  }

  cb(null, true);
};

/**
 * Multer instance - PDF only, 2 MB max
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

// Export single file upload middleware for resume field
export const uploadResume = upload.single('resume');

/**
 * Magic-byte validation middleware.
 * Must be used AFTER multer has read the file.
 * Reads the first 4 bytes and verifies the %PDF signature.
 */
export const validatePdfSignature = (req, _res, next) => {
  if (!req.file) return next();

  try {
    const signature = req.file.buffer?.subarray(0, 4).toString('ascii');
    if (!signature?.startsWith('%PDF')) {
      return next(new ApiError(400, 'File is not a valid PDF', [], false));
    }

    next();
  } catch (_error) {
    next(new ApiError(500, 'Failed to validate file signature'));
  }
};
