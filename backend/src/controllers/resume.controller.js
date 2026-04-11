// HTTP handlers for resume upload, retrieval, manual edits, and admin verification.
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as resumeService from '../services/resume.service.js';
import cloudinary, { buildResumeDownloadUrl } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

const sanitizeFilename = (value = '') =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

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

  let clientDisconnected = false;
  let responseFinished = false;
  const markDisconnected = () => {
    if (!responseFinished) {
      clientDisconnected = true;
    }
  };
  const markFinished = () => {
    responseFinished = true;
  };
  const assertClientConnected = () => {
    if (clientDisconnected || req.aborted || res.destroyed) {
      throw new ApiError(499, 'Resume upload canceled by client', [], true, 'CLIENT_DISCONNECTED');
    }
  };

  req.once('aborted', markDisconnected);
  res.once('close', markDisconnected);
  res.once('finish', markFinished);

  try {
    const resume = await resumeService.processResumeFile(req.user.id, req.file.buffer, {
      assertClientConnected,
    });
    assertClientConnected();

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
    if (
      error?.errorCode === 'CLIENT_DISCONNECTED' ||
      error?.statusCode === 499 ||
      clientDisconnected ||
      req.aborted ||
      res.destroyed
    ) {
      logger.info(`Resume upload canceled by client for user ${req.user.id}`);
      return;
    }

    if (error instanceof ApiError) throw error;
    logger.error(`Resume upload error: ${error.message}`);
    throw new ApiError(500, 'Failed to process resume');
  } finally {
    req.off('aborted', markDisconnected);
    res.off('close', markDisconnected);
    res.off('finish', markFinished);
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

export const downloadResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'job_seeker') {
    throw new ApiError(403, 'Only job seekers can download resume', [], false);
  }

  const resume = await resumeService.getResumeByUserId(req.user.id);

  if (!resume.fileUrl && !resume.filePublicId) {
    throw new ApiError(404, 'Resume file not found', [], false);
  }

  // Fast path: redirect to a secure, signed URL for proper Cloudinary delivery.
  if (resume.filePublicId) {
    const signedUrl = buildResumeDownloadUrl(resume.filePublicId, resume.name || req.user.name);
    if (signedUrl) {
      return res.redirect(signedUrl);
    }
  } else if (resume.fileUrl) {
    // Fallback to storing URL if publicId isn't somehow available
    return res.redirect(resume.fileUrl);
  }

  const publicId = resume.filePublicId || '';
  const normalizedPublicId = publicId.endsWith('.pdf') ? publicId.slice(0, -4) : publicId;
  const candidateUrls = [
    '',
    publicId
      ? cloudinary.url(publicId, { resource_type: 'raw', type: 'upload', secure: true })
      : '',
    normalizedPublicId
      ? cloudinary.url(normalizedPublicId, {
        resource_type: 'raw',
        type: 'upload',
        format: 'pdf',
        secure: true,
      })
      : '',
    publicId
      ? cloudinary.url(publicId, { resource_type: 'image', type: 'upload', secure: true })
      : '',
    normalizedPublicId
      ? cloudinary.url(normalizedPublicId, {
        resource_type: 'image',
        type: 'upload',
        format: 'pdf',
        secure: true,
      })
      : '',
  ].filter(Boolean);

  let response = null;
  let lastStatus = 0;
  let lastUrl = '';
  const noCacheHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };
  const withCacheBuster = (url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
  };

  for (const url of candidateUrls) {
    try {
      let attempt = await fetch(url, { headers: noCacheHeaders });
      if (attempt.status === 304) {
        attempt = await fetch(withCacheBuster(url), { headers: noCacheHeaders });
      }
      if (attempt.ok) {
        response = attempt;
        break;
      }
      lastStatus = attempt.status;
      lastUrl = url;
    } catch (_error) {
      lastUrl = url;
    }
  }

  if (!response) {
    logger.error(
      `Resume download failed for user=${req.user.id} publicId=${publicId} status=${lastStatus} url=${lastUrl}`
    );
    throw new ApiError(502, 'Failed to download resume file', [], false);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${sanitizeFilename(resume.name || req.user.name || 'Resume') || 'Resume'}_Resume.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(buffer);
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
