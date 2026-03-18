// ── User Profile Controller ──
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as profileService from '../services/profile.service.js';

// Helper: Parse JSON parsedData safely
const parseParsedData = (rawParsedData) => {
  if (!rawParsedData) {
    return undefined;
  }

  if (typeof rawParsedData === 'object') {
    return rawParsedData;
  }

  try {
    return JSON.parse(rawParsedData);
  } catch (error) {
    throw new ApiError(400, 'parsedData must be valid JSON');
  }
};

// ── Job Seeker Profile ──

// Create job seeker profile
export const createJobSeekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createJobSeekerProfile(req.user.id, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, 'Job seeker profile created successfully', profile));
});

// Fetch current user's job seeker profile
export const getJobSeekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getJobSeekerProfile(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Job seeker profile fetched successfully', profile));
});

// Update job seeker profile
export const updateJobSeekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateJobSeekerProfile(req.user.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, 'Job seeker profile updated successfully', profile));
});

// Upload resume and extract data
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Resume file is required');
  }

  const parsedData = parseParsedData(req.body.parsedData);
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  const profile = await profileService.uploadJobSeekerResume(
    req.user.id,
    resumeUrl,
    parsedData
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Resume uploaded successfully', profile));
});

// ── Recruiter Profile ──

// Create recruiter profile
export const createRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createRecruiterProfile(req.user.id, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, 'Recruiter profile created successfully', profile));
});

// Fetch recruiter profile
export const getRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getRecruiterProfile(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Recruiter profile fetched successfully', profile));
});

// Update recruiter profile
export const updateRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateRecruiterProfile(req.user.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, 'Recruiter profile updated successfully', profile));
});
