// ── File Upload Middleware ──
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads/resumes');

// Create uploads directory if it doesn't exist
fs.mkdirSync(uploadsRoot, { recursive: true });

// Configure where and how files are stored
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    cb(null, `${safeName}-${Date.now()}${extension.toLowerCase()}`);
  },
});

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
 * Multer instance — PDF only, 2 MB max
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

// Export single file upload middleware for resume field
export const uploadResume = upload.single('resume');

/**
 * Magic-byte validation middleware.
 * Must be used AFTER multer has saved the file.
 * Reads the first 4 bytes and verifies the %PDF signature.
 */
export const validatePdfSignature = (req, res, next) => {
  if (!req.file) return next();

  try {
    const fd = fs.openSync(req.file.path, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    const signature = buffer.toString('ascii');
    if (!signature.startsWith('%PDF')) {
      fs.unlinkSync(req.file.path); // delete the fake file
      return next(new ApiError(400, 'File is not a valid PDF', [], false));
    }

    next();
  } catch (err) {
    next(new ApiError(500, 'Failed to validate file signature'));
  }
};
