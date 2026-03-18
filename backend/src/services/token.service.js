// ── Token Service ──
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

/**
 * Generate an access token for a user.
 * @param {Object} user - Mongoose user document
 * @returns {string} JWT access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry }
  );
};

/**
 * Generate a refresh token, persist it in the database,
 * and return the token string.
 * @param {Object} user - Mongoose user document
 * @returns {Promise<string>} JWT refresh token
 */
export const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { id: user._id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry }
  );

  // Persist the token expiry so embedded refresh tokens can be pruned later.
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);
  const now = new Date();

  await User.findByIdAndUpdate(user._id, {
    $pull: {
      refreshTokens: {
        expiresAt: { $lte: now },
      },
    },
    $push: {
      refreshTokens: {
        token: refreshToken,
        expiresAt,
      },
    },
  });

  return refreshToken;
};

/**
 * Verify a refresh token and return the decoded payload.
 * @param {string} token - Refresh token string
 * @returns {Promise<Object>} Decoded token payload
 */
export const verifyRefreshToken = async (token) => {
  const decoded = jwt.verify(token, env.jwt.refreshSecret);
  const now = new Date();

  const storedToken = await User.findOneAndUpdate(
    { _id: decoded.id },
    {
      $pull: {
        refreshTokens: {
          expiresAt: { $lte: now },
        },
      },
    },
    {
      new: true,
      select: '+refreshTokens',
    }
  );

  const hasValidToken = storedToken?.refreshTokens?.some(
    (refreshToken) => refreshToken.token === token
  );

  if (!hasValidToken) {
    throw new Error('Refresh token not found or has been revoked');
  }

  return decoded;
};

/**
 * Remove a specific refresh token (used during logout).
 * @param {string} token - Refresh token string
 */
export const removeRefreshToken = async (token) => {
  await User.updateOne(
    { 'refreshTokens.token': token },
    {
      $pull: {
        refreshTokens: {
          token,
        },
      },
    }
  );
};

/**
 * Remove all refresh tokens for a user (e.g. password change).
 * @param {string} userId - User ObjectId
 */
export const removeAllUserTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshTokens: [] },
  });
};
