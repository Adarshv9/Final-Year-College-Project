// ── Admin Service ──
import RecruiterProfile from '../models/RecruiterProfile.js';
import User from '../models/User.js';
import * as userService from './user.service.js';
import ApiError from '../utils/ApiError.js';

// Fetch all pending recruiter registrations with their profiles
export const getPendingRecruiters = async ({ page = 1, limit = 10, search }) => {
  const filter = {
    role: 'recruiter',
    isVerified: false,
    isActive: true,
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [recruiters, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const profiles = await RecruiterProfile.find({
    user: { $in: recruiters.map((recruiter) => recruiter._id) },
  }).lean();

  const profileMap = new Map(
    profiles.map((profile) => [String(profile.user), profile])
  );

  return {
    recruiters: recruiters.map((recruiter) => ({
      ...recruiter,
      profile: profileMap.get(String(recruiter._id)) || null,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Verify a recruiter and activate their account
export const verifyRecruiter = async (recruiterId) => {
  const recruiter = await User.findOne({ _id: recruiterId, role: 'recruiter' });
  if (!recruiter) {
    throw new ApiError(404, 'Recruiter not found');
  }

  recruiter.isVerified = true;
  recruiter.isActive = true;
  await recruiter.save();

  return recruiter;
};

// Reject a recruiter by deactivating their account
export const rejectRecruiter = async (recruiterId) => {
  const recruiter = await User.findOne({ _id: recruiterId, role: 'recruiter' });
  if (!recruiter) {
    throw new ApiError(404, 'Recruiter not found');
  }

  recruiter.isVerified = false;
  recruiter.isActive = false;
  await recruiter.save();

  return recruiter;
};

// Alias for fetching all users (delegates to user service)
export const getAllUsers = async (query) => {
  return userService.getUsers(query);
};
