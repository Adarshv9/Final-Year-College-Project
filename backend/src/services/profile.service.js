// ── User Profile Service ──
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import RecruiterProfile from '../models/RecruiterProfile.js';
import ApiError from '../utils/ApiError.js';

// ── Job Seeker Profile ──

// Create a new job seeker profile
export const createJobSeekerProfile = async (userId, profileData) => {
  const existingProfile = await JobSeekerProfile.findOne({ user: userId });
  if (existingProfile) {
    throw new ApiError(409, 'Job seeker profile already exists');
  }

  return JobSeekerProfile.create({
    user: userId,
    ...profileData,
  });
};

// Fetch job seeker profile by user ID
export const getJobSeekerProfile = async (userId) => {
  const profile = await JobSeekerProfile.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  if (!profile) {
    throw new ApiError(404, 'Job seeker profile not found');
  }

  return profile;
};

// Update job seeker profile fields
export const updateJobSeekerProfile = async (userId, profileData) => {
  const profile = await JobSeekerProfile.findOne({ user: userId });
  if (!profile) {
    throw new ApiError(404, 'Job seeker profile not found');
  }

  Object.assign(profile, profileData);
  await profile.save();

  return profile.populate('user', 'name email role isVerified isActive');
};

// Upload resume and store file URL and parsed data
export const uploadJobSeekerResume = async (userId, resumeUrl, parsedData) => {
  let profile = await JobSeekerProfile.findOne({ user: userId });

  if (!profile) {
    profile = new JobSeekerProfile({ user: userId });
  }

  profile.resumeUrl = resumeUrl;
  if (parsedData !== undefined) {
    profile.parsedData = parsedData;
  }

  await profile.save();

  return profile.populate('user', 'name email role isVerified isActive');
};

// ── Recruiter Profile ──

// Create a new recruiter profile
export const createRecruiterProfile = async (userId, profileData) => {
  const existingProfile = await RecruiterProfile.findOne({ user: userId });
  if (existingProfile) {
    throw new ApiError(409, 'Recruiter profile already exists');
  }

  return RecruiterProfile.create({
    user: userId,
    ...profileData,
  });
};

// Fetch recruiter profile by user ID
export const getRecruiterProfile = async (userId) => {
  const profile = await RecruiterProfile.findOne({ user: userId }).populate(
    'user',
    'name email role isVerified isActive'
  );

  if (!profile) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  return profile;
};

// Update recruiter profile fields
export const updateRecruiterProfile = async (userId, profileData) => {
  const profile = await RecruiterProfile.findOne({ user: userId });
  if (!profile) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  Object.assign(profile, profileData);
  await profile.save();

  return profile.populate('user', 'name email role isVerified isActive');
};
