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
 * Update a user by ID.
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated user document
 */
export const updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
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
 * Delete a user by ID.
 * @param {string} userId
 * @returns {Promise<Object>} Deleted user document
 */
export const deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};
