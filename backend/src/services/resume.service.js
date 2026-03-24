// ── Resume Service ──
import Resume from '../models/Resume.js';
import ApiError from '../utils/ApiError.js';
import {
  extractTextFromPdf,
  cleanResumeText,
  transformResumeData,
} from '../utils/resumeExtraction.js';
import { parseResumeText } from './ai/ai.service.js';
import logger from '../utils/logger.js';

// ── Resume Processing Pipeline ────────────────────────────────────────────────

/**
 * Full resume processing pipeline:
 *  1. Extract text from PDF buffer
 *  2. Clean extracted text
 *  3. Parse with AI → structured JSON
 *  4. Transform (dates, experience years, normalize skills)
 *  5. Upsert to DB
 *
 * @param {string} userId    - MongoDB user ID
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @param {string} filePath  - Saved file path (stored in resume.fileUrl)
 * @returns {Promise<Object>} Saved resume document
 */
export const processResumeFile = async (userId, pdfBuffer, filePath) => {
  const start = Date.now();

  // Step 1: Extract text
  const rawText = await extractTextFromPdf(pdfBuffer);
  if (!rawText || rawText.trim().length === 0) {
    throw new ApiError(400, 'Could not extract text from PDF');
  }

  // Step 2: Clean
  const cleanedText = cleanResumeText(rawText);

  // Step 3: AI parsing
  logger.info(`[Pipeline] Sending resume to AI for user ${userId}`);
  const aiData = await parseResumeText(cleanedText);

  // Step 4: Transform
  const transformedData = transformResumeData(aiData);

  // Step 5: Upsert
  const resumeData = {
    ...transformedData,
    fileUrl: filePath,
    rawText: rawText.substring(0, 10000),
    parsedData: aiData,
  };

  const resume = await upsertResume(userId, resumeData);

  logger.info(`[METRIC] Full resume pipeline for user ${userId} completed in ${Date.now() - start}ms`);
  return resume;
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Upsert resume (create if doesn't exist, update if exists)
 */
export const upsertResume = async (userId, resumeData) => {
  const { skills, experiences, experienceYears, ...otherData } = resumeData;

  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        user: userId,
        name: otherData.name || '',
        email: otherData.email || '',
        phone: otherData.phone || '',
        location: otherData.location || '',
        summary: otherData.summary || '',
        skills: skills || [],
        experiences: experiences || [],
        education: otherData.education || [],
        projects: otherData.projects || [],
        experienceYears: experienceYears || 0,
        fileUrl: otherData.fileUrl || '',
        rawText: otherData.rawText || '',
        parsedData: otherData.parsedData || {},
      },
    },
    { new: true, upsert: true }
  );

  return resume;
};

/**
 * Update resume fields for the current job seeker
 */
export const updateResumeFields = async (userId, updates) => {
  const allowedFields = [
    'name', 'email', 'phone', 'location', 'summary',
    'skills', 'experiences', 'education', 'projects', 'experienceYears',
  ];

  const updatePayload = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      updatePayload[field] = updates[field];
    }
  });

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, 'No fields provided for update');
  }

  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    { $set: updatePayload },
    { new: true }
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};

/**
 * Get resume by user ID
 */
export const getResumeByUserId = async (userId) => {
  const resume = await Resume.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};

export const findResumeByUserId = async (userId) => Resume.findOne({ user: userId });

/**
 * Get all resumes (admin only) — paginated
 */
export const getAllResumes = async (options = {}) => {
  const { limit = 10, page = 1, search = '' } = options;
  const skip = (page - 1) * limit;

  const query = search ? { name: { $regex: search, $options: 'i' } } : {};

  const resumes = await Resume.find(query)
    .populate('user', 'name email role')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Resume.countDocuments(query);

  return {
    data: resumes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update resume verification status (admin only)
 */
export const updateResumeVerification = async (resumeId, isVerified) => {
  const resume = await Resume.findByIdAndUpdate(
    resumeId,
    { $set: { isVerified } },
    { new: true }
  );

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};

/**
 * Delete resume by user ID
 */
export const deleteResume = async (userId) => {
  const resume = await Resume.findOneAndDelete({ user: userId });

  if (!resume) {
    throw new ApiError(404, 'Resume not found', [], false);
  }

  return resume;
};
