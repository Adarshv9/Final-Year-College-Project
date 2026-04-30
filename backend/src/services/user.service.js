// Implements business logic for user workflows.

import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';






// Get users.
export const getUsers = async ({ page = 1, limit = 10, role, search }) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }];

  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
  User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
  User.countDocuments(filter)]
  );

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};






// Get user by ID.
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};








// Update user.
export const updateUser = async (userId, updateData, options = {}) => {
  const { self = false } = options;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (updateData.role === 'admin' && !user.emailVerified) {
    throw new ApiError(400, 'Only existing email-verified users can be promoted to admin');
  }


  if (user.email === process.env.SUPER_ADMIN_EMAIL && updateData.role && updateData.role !== 'admin') {
    throw new ApiError(403, 'The super admin account cannot be demoted');
  }


  if (self && updateData.role) {
    if (updateData.role === 'admin') {
      throw new ApiError(403, 'You cannot change your account type to admin');
    }
    if (!['job_seeker', 'recruiter'].includes(updateData.role)) {
      throw new ApiError(400, 'Account type must be job_seeker or recruiter');
    }
    if (updateData.role === 'recruiter' && user.role !== 'recruiter') {

      updateData.pendingRole = 'recruiter';
      updateData.approvalStatus = 'pending';
      delete updateData.role;
    }

    if (updateData.role === 'job_seeker') {

      updateData.role = 'job_seeker';
      updateData.pendingRole = null;
      updateData.approvalStatus = null;
      updateData.isVerified = false;
    }
  }


  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({ email: updateData.email });
    if (existingUser) {
      throw new ApiError(409, 'Email is already in use');
    }
  }

  Object.assign(user, updateData);
  await user.save();
  return user;
};




// Delete self.
export const deleteSelf = async (userId, requester) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(403, 'The super admin account cannot be deleted');
  }

  if (requester?.id?.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Forbidden');
  }

  await User.findByIdAndDelete(userId);
};







// Delete user.
export const deleteUser = async (userId, requester) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }


  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(403, 'The super admin account cannot be deleted');
  }


  if (user._id.toString() === requester?.id?.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }


  if (user.role === 'admin' && requester?.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(403, 'Only the Super Admin can delete other admins');
  }

  await User.findByIdAndDelete(userId);
  return user;
};







// Handle Password.
export const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }


  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }


  user.password = newPassword;
  await user.save();
};