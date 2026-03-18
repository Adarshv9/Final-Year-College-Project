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
  // Generate unique filename with timestamp and sanitize original name
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    cb(null, `${safeName}-${Date.now()}${extension.toLowerCase()}`);
  },
});

// Validate file type: only allow resume formats
const fileFilter = (_req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    cb(new ApiError(400, 'Only PDF, DOC, and DOCX files are allowed'));
    return;
  }

  cb(null, true);
};

// Multer configuration: max file size 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Export single file upload middleware for resume field
export const uploadResume = upload.single('resume');
