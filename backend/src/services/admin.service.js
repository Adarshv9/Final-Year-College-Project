// Implements business logic for admin workflows.

import RecruiterProfile from '../models/RecruiterProfile.js';
import User from '../models/User.js';
import * as userService from './user.service.js';
import ApiError from '../utils/ApiError.js';


// Get pending recruiters.
export const getPendingRecruiters = async ({ page = 1, limit = 10, search }) => {
  const filter = {
    approvalStatus: 'pending',
    $or: [

    { role: 'recruiter' },

    { pendingRole: 'recruiter' }]

  };

  if (search) {
    filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }];

  }

  const skip = (page - 1) * limit;

  const [recruiters, total] = await Promise.all([
  User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  User.countDocuments(filter)]
  );

  const profiles = await RecruiterProfile.find({
    user: { $in: recruiters.map((recruiter) => recruiter._id) }
  }).lean();

  const profileMap = new Map(
    profiles.map((profile) => [String(profile.user), profile])
  );

  return {
    recruiters: recruiters.map((recruiter) => ({
      ...recruiter,
      profile: profileMap.get(String(recruiter._id)) || null
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};


// Verify recruiter.
export const verifyRecruiter = async (recruiterId) => {
  const recruiter = await User.findById(recruiterId);
  if (!recruiter) {
    throw new ApiError(404, 'Recruiter not found');
  }

  if (recruiter.pendingRole === 'recruiter') {
    recruiter.role = 'recruiter';
    recruiter.pendingRole = null;
  }

  recruiter.isVerified = true;
  recruiter.isActive = true;
  recruiter.approvalStatus = 'approved';
  await recruiter.save();

  return recruiter;
};


// Reject recruiter.
export const rejectRecruiter = async (recruiterId) => {
  const recruiter = await User.findById(recruiterId);
  if (!recruiter) {
    throw new ApiError(404, 'Recruiter not found');
  }


  if (recruiter.pendingRole === 'recruiter') {
    recruiter.pendingRole = null;
    recruiter.approvalStatus = 'rejected';
    recruiter.isVerified = false;
    recruiter.isActive = true;
    await recruiter.save();
    return recruiter;
  }

  recruiter.isVerified = false;
  recruiter.isActive = false;
  recruiter.approvalStatus = 'rejected';
  await recruiter.save();

  return recruiter;
};


// Promote user to admin.
export const promoteUserToAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'admin') {
    throw new ApiError(400, 'User is already an admin');
  }

  if (!user.emailVerified) {
    throw new ApiError(400, 'Only existing email-verified users can be promoted to admin');
  }

  user.role = 'admin';
  user.isActive = true;
  user.approvalStatus = null;
  await user.save();

  return user;
};


// Get all users.
export const getAllUsers = async (query) => {
  return userService.getUsers(query);
};