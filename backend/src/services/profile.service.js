// Implements business logic for profile workflows.

import JobSeekerProfile from '../models/JobSeekerProfile.js';
import RecruiterProfile from '../models/RecruiterProfile.js';
import ApiError from '../utils/ApiError.js';







// Create job seeker profile.
export const createJobSeekerProfile = async (userId, profileData) => {
  const existingProfile = await JobSeekerProfile.findOne({ user: userId });
  if (existingProfile) {
    throw new ApiError(409, 'Job seeker profile already exists');
  }

  return JobSeekerProfile.create({
    user: userId,
    ...profileData
  });
};


// Get job seeker profile.
export const getJobSeekerProfile = async (userId) => {
  const profile = await JobSeekerProfile.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  return profile;
};


// Update job seeker profile.
export const updateJobSeekerProfile = async (userId, profileData) => {
  const profile = await JobSeekerProfile.findOne({ user: userId });
  if (!profile) {
    throw new ApiError(404, 'Job seeker profile not found');
  }

  Object.assign(profile, profileData);
  await profile.save();

  return profile.populate('user', 'name email role isVerified isActive');
};


// Handle Job Seeker Resume.
export const uploadJobSeekerResume = async (userId, resumeUrl, resumePublicId, parsedData) => {
  let profile = await JobSeekerProfile.findOne({ user: userId });

  if (!profile) {


    profile = new JobSeekerProfile({ user: userId });
  }

  profile.resumeUrl = resumeUrl;
  profile.resumePublicId = resumePublicId;
  if (parsedData !== undefined) {
    profile.parsedData = parsedData;
  }

  await profile.save();

  return profile.populate('user', 'name email role isVerified isActive');
};




// Create recruiter profile.
export const createRecruiterProfile = async (userId, profileData) => {
  const existingProfile = await RecruiterProfile.findOne({ user: userId });
  if (existingProfile) {
    throw new ApiError(409, 'Recruiter profile already exists');
  }

  return RecruiterProfile.create({
    user: userId,
    ...profileData
  });
};


// Get recruiter profile.
export const getRecruiterProfile = async (userId) => {
  const profile = await RecruiterProfile.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  return profile;
};


// Update recruiter profile.
export const updateRecruiterProfile = async (userId, profileData) => {
  const profile = await RecruiterProfile.findOne({ user: userId });
  if (!profile) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  Object.assign(profile, profileData);
  await profile.save();

  return profile.populate('user', 'name email role isVerified isActive');
};