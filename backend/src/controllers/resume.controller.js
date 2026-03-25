import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as resumeService from '../services/resume.service.js';
import logger from '../utils/logger.js';

/**
 * PUT /resume - Upload and parse PDF resume (synchronous)
 */
export const uploadResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can upload resume', [], false);
  }
  if (!req.file) {
    throw new ApiError(400, 'Resume file is required', [], false);
  }

  try {
    const resume = await resumeService.processResumeFile(req.user.id, req.file.buffer);

    const isCreated =
      resume.createdAt &&
      resume.updatedAt &&
      resume.createdAt.getTime() === resume.updatedAt.getTime();
    const statusCode = isCreated ? 201 : 200;
    const message = isCreated
      ? 'Resume uploaded and parsed successfully'
      : 'Resume updated successfully';

    return res.status(statusCode).json(
      new ApiResponse(statusCode, message, {
        name: resume.name,
        skills: resume.skills,
        experienceYears: resume.experienceYears,
        fileUrl: resume.fileUrl,
      })
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`Resume upload error: ${error.message}`);
    throw new ApiError(500, 'Failed to process resume');
  }
});

/**
 * GET /resume - Fetch current user's resume
 */
export const getResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can view resume', [], false);
  }

  const resume = await resumeService.findResumeByUserId(req.user.id);

  if (!resume) {
    return res.status(200).json(new ApiResponse(200, 'No resume uploaded yet', null));
  }

  res.status(200).json(new ApiResponse(200, 'Resume fetched successfully', resume));
});

/**
 * DELETE /resume - Delete current user's resume
 */
export const deleteResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can delete resume', [], false);
  }

  await resumeService.deleteResume(req.user.id);
  res.status(200).json(new ApiResponse(200, 'Resume deleted successfully', null));
});

/**
 * PATCH /resume - Partial update of current user's resume
 */
export const updateResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can update resume', [], false);
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
 * POST /resume/manual - Manual resume creation or update
 */
export const manualResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can save resume manually', [], false);
  }

  const normalizeEducation = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || Object.keys(value).length === 0) return [];
    return [value];
  };

  const manualData = { ...req.body };
  if (manualData.education && !Array.isArray(manualData.education)) {
    manualData.education = normalizeEducation(manualData.education);
  }

  const existingResume = await resumeService.findResumeByUserId(req.user.id);

  await resumeService.upsertResume(req.user.id, {
    ...manualData,
    fileUrl: existingResume?.fileUrl || manualData.fileUrl || '',
    filePublicId: existingResume?.filePublicId || manualData.filePublicId || '',
    rawText: existingResume?.rawText || manualData.rawText || '',
    parsedData: existingResume?.parsedData || manualData.parsedData || {},
  });

  res.status(200).json(new ApiResponse(200, 'Resume saved successfully', null));
});

export const getAllResumes = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, search = '' } = req.query;

  const result = await resumeService.getAllResumes({
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
    search,
  });

  res.status(200).json(new ApiResponse(200, 'Resumes fetched successfully', result));
});

export const verifyResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const { isVerified } = req.body;

  if (typeof isVerified !== 'boolean') {
    throw new ApiError(400, 'isVerified must be a boolean', [], false);
  }

  const resume = await resumeService.updateResumeVerification(resumeId, isVerified);
  res
    .status(200)
    .json(new ApiResponse(200, 'Resume verification updated successfully', resume));
});
