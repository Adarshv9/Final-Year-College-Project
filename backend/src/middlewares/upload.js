// Configures file upload handling for resume documents.

import path from 'path';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';





// Handle Filter.
const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.mimetype !== 'application/pdf' || extension !== '.pdf') {
    cb(new ApiError(400, 'Only PDF files are allowed', [], false));
    return;
  }

  cb(null, true);
};




const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});


export const uploadResume = upload.single('resume');






// Validate PDF signature.
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