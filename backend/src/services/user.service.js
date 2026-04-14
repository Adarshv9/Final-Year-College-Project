// ── User Service ──
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get a paginated list of users with optional filtering.
 * @param {Object} query - { page, limit, role, search }
 * @returns {Promise<Object>} { users, pagination }
 */
export const getUsers = async ({ page = 1, limit = 10, role, search }) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single user by ID.
 * @param {string} userId
 * @returns {Promise<Object>} User document
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

/**
 * Update a user by ID, with optional self-service rules.
 * @param {string} userId
 * @param {Object} updateData
 * @param {Object} options
 * @param {boolean} options.self - When true, restrict fields/role transitions.
 */
export const updateUser = async (userId, updateData, options = {}) => {
  const { self = false } = options;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (updateData.role === 'admin' && !user.emailVerified) {
    throw new ApiError(400, 'Only existing email-verified users can be promoted to admin');
  }

  // Protect super admin from being demoted
  if (user.email === process.env.SUPER_ADMIN_EMAIL && updateData.role && updateData.role !== 'admin') {
    throw new ApiError(403, 'The super admin account cannot be demoted');
  }

  // Self-service: disallow admin role changes and enforce recruiter approval flow.
  if (self && updateData.role) {
    if (updateData.role === 'admin') {
      throw new ApiError(403, 'You cannot change your account type to admin');
    }
    if (!['job_seeker', 'recruiter'].includes(updateData.role)) {
      throw new ApiError(400, 'Account type must be job_seeker or recruiter');
    }
    if (updateData.role === 'recruiter' && user.role !== 'recruiter') {
      // Request recruiter role: keep existing role until admin approval.
      updateData.pendingRole = 'recruiter';
      updateData.approvalStatus = 'pending';
      delete updateData.role;
    }

    if (updateData.role === 'job_seeker') {
      // Allow switching back/cancelling any pending request.
      updateData.role = 'job_seeker';
      updateData.pendingRole = null;
      updateData.approvalStatus = null;
      updateData.isVerified = false;
    }
  }

  // Check for email uniqueness if email is being changed
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

/**
 * Delete the authenticated user's own account.
 */
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

/**
 * Delete a user by ID.
 * @param {string} userId
 * @param {Object} requester - The user performing the deletion
 * @returns {Promise<Object>} Deleted user document
 */
export const deleteUser = async (userId, requester) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Protect super admin account
  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(403, 'The super admin account cannot be deleted');
  }

  // Prevent users from deleting themselves
  if (user._id.toString() === requester?.id?.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  // Only super admin can delete other admins
  if (user.role === 'admin' && requester?.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(403, 'Only the Super Admin can delete other admins');
  }

  await User.findByIdAndDelete(userId);
  return user;
};

/**
 * Change user password.
 * @param {string} userId
 * @param {Object} data - { oldPassword, newPassword }
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify old password
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update with new password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();
};
