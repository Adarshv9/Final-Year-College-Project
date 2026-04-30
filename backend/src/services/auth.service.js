// ── Authentication Service ──
import { env } from '../config/env.js';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import * as tokenService from './token.service.js';

// ────────────────────────────────────────
// EMAIL CONFIGURATION
// ────────────────────────────────────────

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.secure,
  connectionTimeout: env.email.connectionTimeoutMs,
  greetingTimeout: env.email.greetingTimeoutMs,
  socketTimeout: env.email.socketTimeoutMs,
  auth: {
    user: env.email.user,
    pass: env.email.password,
  },
});

let transporterVerified = false;
let verifyPromise = null;

const withTimeout = async (promise, timeoutMs, message) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const ensureEmailConfigured = () => {
  if (env.email.user && env.email.password) {
    return;
  }

  throw new ApiError(
    503,
    'Email delivery is not configured on the server. Set EMAIL_USER and EMAIL_PASSWORD.'
  );
};

const verifyTransporter = async () => {
  if (transporterVerified) {
    return;
  }

  if (!verifyPromise) {
    verifyPromise = withTimeout(
      transporter.verify(),
      env.email.sendTimeoutMs,
      'SMTP verification timed out'
    )
      .then(() => {
        transporterVerified = true;
      })
      .finally(() => {
        verifyPromise = null;
      });
  }

  await verifyPromise;
};

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
 * Send OTP to user email
 * @param {string} email - User's email address
 * @param {string} otp - OTP to send
 * @param {string} userName - User's name
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp, userName) => {
  try {
    ensureEmailConfigured();
    await verifyTransporter();

    const mailOptions = {
      from: env.email.user,
      to: email,
      subject: 'Email Verification - OTP',
      html: `
        <h2>Email Verification</h2>
        <p>Hi ${userName},</p>
        <p>Your OTP for email verification is:</p>
        <h1 style="color: #333; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br/>Job Portal Team</p>
      `,
    };

    await withTimeout(
      transporter.sendMail(mailOptions),
      env.email.sendTimeoutMs,
      'SMTP send timed out'
    );
  } catch (error) {
    console.error('Email send error:', error.message);
    throw new ApiError(
      503,
      'Failed to send OTP email. Check production email configuration or SMTP access.'
    );
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
