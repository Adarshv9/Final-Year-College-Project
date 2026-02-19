import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Token from '../models/Token.js';

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

  // Calculate expiry date for the TTL index
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await Token.create({
    user: user._id,
    refreshToken,
    expiresAt,
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

  const storedToken = await Token.findOne({
    user: decoded.id,
    refreshToken: token,
  });

  if (!storedToken) {
    throw new Error('Refresh token not found or has been revoked');
  }

  return decoded;
};

/**
 * Remove a specific refresh token (used during logout).
 * @param {string} token - Refresh token string
 */
export const removeRefreshToken = async (token) => {
  await Token.findOneAndDelete({ refreshToken: token });
};

/**
 * Remove all refresh tokens for a user (e.g. password change).
 * @param {string} userId - User ObjectId
 */
export const removeAllUserTokens = async (userId) => {
  await Token.deleteMany({ user: userId });
};
