// ── Authentication Service ──
import otpGenerator from 'otp-generator';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { EMAIL_FROM_ADDRESS, sendEmail } from './email.service.js';
import * as tokenService from './token.service.js';

/**
 * Generate a 6-digit OTP
 * @returns {string} OTP code
 */
const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });
};

/**
 * Send OTP to user email via Resend.
 * @param {string} email - User's email address
 * @param {string} otp - OTP to send
 * @param {string} userName - User's name
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp, userName) => {
  try {
    await sendEmail({
      context: 'otp',
      from: EMAIL_FROM_ADDRESS,
      to: email,
      subject: 'Your CompasX Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Email Verification</h2>
          <p style="color: #475569;">Hi ${userName},</p>
          <p style="color: #475569;">Use the code below to verify your email address:</p>
          <div style="background: #fff; border: 2px solid #6366f1; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #6366f1;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #475569; margin-top: 24px;">— The CompasX Team</p>
        </div>
      `,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, 'Failed to send OTP email. Please try again later.');
  }
};

/**
 * Calculate OTP expiry time (10 minutes from now)
 * @returns {Date} Expiry timestamp
 */
const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

// ────────────────────────────────────────
// AUTHENTICATION FUNCTIONS
// ────────────────────────────────────────

/**
 * Register a new user with OTP verification.
 * @param {Object} data - { name, email, password, role }
 * @returns {Promise<Object>} { user, email }
 */
export const register = async ({ name, email, password, role = 'job_seeker' }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  // Generate OTP up front so we can store it with the user atomically.
  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry();

  // Create user with emailVerified = false and OTP
  const userData = {
    name,
    email,
    password,
    role,
    emailVerified: false,
    otp,
    otpExpiresAt,
  };

  // If role is recruiter, set approvalStatus to pending
  if (role === 'recruiter') {
    userData.approvalStatus = 'pending';
  }

  const user = await User.create(userData);

  try {
    // Send OTP to email — roll back the user record if delivery fails so the
    // email address stays available for a fresh signup attempt.
    await sendOTPEmail(email, otp, name);
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  return { user, email };
};

/**
 * Verify OTP and mark email as verified.
 * @param {Object} data - { email, otp }
 * @returns {Promise<Object>} { user }
 */
export const verifyOTP = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.emailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  if (!user.otp) {
    throw new ApiError(400, 'No OTP found for this email. Please sign up again.');
  }

  if (user.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  // Mark email as verified and clear OTP
  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return { user };
};

/**
 * Resend OTP to user's email.
 * @param {Object} data - { email }
 * @returns {Promise<void>}
 */
export const resendOTP = async ({ email }) => {
  const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.emailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry();

  user.otp = otp;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  // Send OTP to email
  await sendOTPEmail(email, otp, user.name);
};

/**
 * Authenticate a user with email and password.
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} { token, refreshToken, user }
 */
export const login = async ({ email, password }) => {
  // Gate Check 1: User must exist
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Gate Check 2: Provider must be 'local'
  if (user.provider !== 'local') {
    throw new ApiError(403, `This account is registered with ${user.provider}`);
  }

  // Gate Check 3: Password must match (bcrypt)
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Gate Check 4: Email must be verified
  if (!user.emailVerified) {
    // Auto-send a fresh OTP so the user can verify immediately from the redirect.
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = getOTPExpiry();
    await user.save();
    await sendOTPEmail(user.email, otp, user.name);
    throw new ApiError(
      403,
      'Email not verified. A new OTP has been sent to your email.',
      [],
      true,
      'EMAIL_NOT_VERIFIED'
    );
  }

  // Gate Check 5: If recruiter, approvalStatus must be 'approved'
  if (user.role === 'recruiter' && user.approvalStatus !== 'approved') {
    throw new ApiError(403, 'Your recruiter account is not yet approved by admin.');
  }

  // Access tokens stay short-lived while refresh tokens are persisted for
  // rotation and revocation in tokenService.
  const token = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return {
    token,
    refreshToken,
    user: {
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Refresh the access token using a valid refresh token.
 * @param {string} refreshTokenStr - The refresh token
 * @returns {Promise<Object>} { accessToken, refreshToken }
 */
export const refreshAccessToken = async (refreshTokenStr) => {
  const decoded = await tokenService.verifyRefreshToken(refreshTokenStr);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  if (user.role === 'recruiter' && user.approvalStatus !== 'approved') {
    throw new ApiError(403, 'Your recruiter account is not yet approved by admin.');
  }

  // Rotation limits replay risk by making each refresh token single-use.
  await tokenService.removeRefreshToken(refreshTokenStr);

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Logout: invalidate the current refresh token when present.
 * Falls back to clearing all tokens for the user only when there is no
 * specific refresh token to revoke.
 */
export const logout = async ({ userId, refreshToken }) => {
  if (refreshToken) {
    await tokenService.removeRefreshToken(refreshToken);
    return;
  }

  if (userId) {
    await tokenService.removeAllUserTokens(userId);
  }
};

/**
 * Get authenticated user's profile.
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { email, role }
 */
export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    email: user.email,
    role: user.role,
  };
};
