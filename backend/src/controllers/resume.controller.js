// ── Resume Controller ──
import fs from 'fs';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as resumeService from '../services/resume.service.js';
import {
  extractTextFromPdf,
  extractResumeWithAI,
  transformResumeData,
} from '../utils/resumeExtraction.js';
import logger from '../utils/logger.js';

/**
 * PUT /resume — Upload and parse PDF resume with AI extraction
 * Accepts multipart/form-data with 'resume' field
 */
export const uploadResume = asyncHandler(async (req, res) => {
  // Check if user is a job seeker
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can upload resume');
  }
  // Check if file is uploaded
  if (!req.file) {
    throw new ApiError(400, 'Resume file is required');
  }

  try {
    // Step 1: Extract text from PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const rawText = await extractTextFromPdf(pdfBuffer);
    

    if (!rawText || rawText.trim().length === 0) {
      // Delete uploaded file if extraction fails
      fs.unlinkSync(req.file.path);
      throw new ApiError(400, 'Could not extract text from PDF');
    }

    // Step 2: Extract and parse using AI
    logger.info('Sending resume text to AI for parsing...');
    const AiData = await extractResumeWithAI(rawText);

    // Step 3: Transform resume data (calculate experienceYears, normalize skills, etc.)
    const transformedData = transformResumeData(AiData);

    // Step 4: Prepare data for upsert
    const resumeData = {
      ...transformedData,
      fileUrl: req.file.path,
      rawText: rawText.substring(0, 10000), // Store only first 10k chars
      parsedData: AiData,
    };

    // Step 5: Atomic upsert to resumes collection
    const resume = await resumeService.upsertResume(req.user.id, resumeData);

    // Determine if this is a create or update
    const isCreated = resume.createdAt && resume.updatedAt && resume.createdAt.getTime() === resume.updatedAt.getTime();
    const statusCode = isCreated ? 201 : 200;
    const message = isCreated ? 'Resume uploaded and parsed successfully' : 'Resume updated successfully';

    // Prepare response data
    const responseData = {
      name: resume.name,
      skills: resume.skills,
      experienceYears: resume.experienceYears,
    };

    res.status(statusCode).json(new ApiResponse(statusCode, message, responseData));
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }

    // Re-throw if it's an ApiError
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('Resume upload error:', error);
    throw new ApiError(500, 'Failed to process resume');
  }
});

/**
 * GET /resume — Fetch current user's resume
 */
export const getResume = asyncHandler(async (req, res) => {
  // Check if user is a job seeker
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can view resume');
  }

  const resume = await resumeService.getResumeByUserId(req.user.id);

  res.status(200).json(new ApiResponse(200, 'Resume fetched successfully', resume));
});

/**
 * DELETE /resume — Delete current user's resume
 */
export const deleteResume = asyncHandler(async (req, res) => {
  // Check if user is a job seeker
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can delete resume');
  }

  const resume = await resumeService.deleteResume(req.user.id);

  // Delete file from disk
  if (resume.fileUrl) {
    try {
      fs.unlinkSync(resume.fileUrl);
    } catch (error) {
      logger.warn('Error deleting resume file:', error);
    }
  }

  res.status(200).json(new ApiResponse(200, 'Resume deleted successfully', null));
});

/**
 * PATCH /resume — Partial update of current user's resume
 */
export const updateResume = asyncHandler(async (req, res) => {
  // Check if user is a job seeker
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can update resume');
  }

  const updates = { ...req.body };

  if (Array.isArray(updates.skills)) {
    const currentResume = await resumeService.getResumeByUserId(req.user.id);
    const existingSkills = Array.isArray(currentResume.skills) ? currentResume.skills : [];
    updates.skills = Array.from(new Set([...existingSkills, ...updates.skills]));
  }

  await resumeService.updateResumeFields(req.user.id, updates);

  res.status(200).json(new ApiResponse(200, 'Resume updated successfully', null));
});

/**
 * POST /resume/manual — Manual resume creation or update
 */
export const manualResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can save resume manually');
  }

  const normalizeEducation = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (!value || Object.keys(value).length === 0) {
      return [];
    }
    return [value];
  };

  const manualData = { ...req.body };
  if (manualData.education && !Array.isArray(manualData.education)) {
    manualData.education = normalizeEducation(manualData.education);
  }

  const existingResume = await resumeService.findResumeByUserId(req.user.id);

  await resumeService.upsertResume(req.user.id, {
    ...manualData,
    fileUrl: (existingResume?.fileUrl) || manualData.fileUrl || '',
    rawText: existingResume?.rawText || manualData.rawText || '',
    parsedData: existingResume?.parsedData || manualData.parsedData || {},
  });

  res.status(200).json(new ApiResponse(200, 'Resume saved successfully', null));
});

/**
 * Admin endpoints
 */

/**
 * GET /resumes — Get all resumes (admin only)
 */
export const getAllResumes = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, search = '' } = req.query;

  const result = await resumeService.getAllResumes({
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
    search,
  });

  res.status(200).json(new ApiResponse(200, 'Resumes fetched successfully', result));
});

/**
 * PATCH /resumes/:resumeId/verify — Verify resume (admin only)
 */
export const verifyResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const { isVerified } = req.body;

  if (typeof isVerified !== 'boolean') {
    throw new ApiError(400, 'isVerified must be a boolean');
  }

  const resume = await resumeService.updateResumeVerification(resumeId, isVerified);

  res.status(200).json(new ApiResponse(200, 'Resume verification updated successfully', resume));
});
