// HTTP handlers for job seeker and recruiter profile management.
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as profileService from '../services/profile.service.js';
import { deleteResumeAsset, uploadResumeBuffer } from '../config/cloudinary.js';

const parseParsedData = (rawParsedData) => {
  if (!rawParsedData) {
    return undefined;
  }

  if (typeof rawParsedData === 'object') {
    return rawParsedData;
  }

  try {
    return JSON.parse(rawParsedData);
  } catch (_error) {
    throw new ApiError(400, 'parsedData must be valid JSON');
  }
};

export const createJobSeekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createJobSeekerProfile(req.user.id, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, 'Job seeker profile created successfully', profile));
});

export const getJobSeekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getJobSeekerProfile(req.user.id);

  const message = profile
    ? 'Job seeker profile fetched successfully'
    : 'No job seeker profile yet';

  res.status(200).json(new ApiResponse(200, message, profile));
});

export const updateJobSeekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateJobSeekerProfile(req.user.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, 'Job seeker profile updated successfully', profile));
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Resume file is required');
  }

  const parsedData = parseParsedData(req.body.parsedData);
  const currentProfile = await profileService.getJobSeekerProfile(req.user.id);
  const upload = await uploadResumeBuffer(req.file.buffer, {
    // Include `.pdf` so Cloudinary identifies the asset as a PDF.
    public_id: `profile-resume-${req.user.id}-${Date.now()}.pdf`,
  });

  if (currentProfile?.resumePublicId && currentProfile.resumePublicId !== upload.public_id) {
    await deleteResumeAsset(currentProfile.resumePublicId);
  }

  const profile = await profileService.uploadJobSeekerResume(
    req.user.id,
    upload.secure_url,
    upload.public_id,
    parsedData
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Resume uploaded successfully', profile));
});

export const createRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createRecruiterProfile(req.user.id, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, 'Recruiter profile created successfully', profile));
});

export const getRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getRecruiterProfile(req.user.id);

  const message = profile
    ? 'Recruiter profile fetched successfully'
    : 'No recruiter profile yet';

  res.status(200).json(new ApiResponse(200, message, profile));
});

export const updateRecruiterProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateRecruiterProfile(req.user.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, 'Recruiter profile updated successfully', profile));
});
