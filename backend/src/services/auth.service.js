// Implements business logic for auth workflows.

import otpGenerator from 'otp-generator';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { EMAIL_FROM_ADDRESS, sendEmail } from './email.service.js';
import * as tokenService from './token.service.js';





// Generate OTP.
const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true
  });
};








// Send OTP email.
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
      `
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, 'Failed to send OTP email. Please try again later.');
  }
};





// Get OTP expiry.
const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000);
};










// Register the user.
export const register = async ({ name, email, password, role = 'job_seeker' }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }


  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry();


  const userData = {
    name,
    email,
    password,
    role,
    emailVerified: false,
    otp,
    otpExpiresAt
  };


  if (role === 'recruiter') {
    userData.approvalStatus = 'pending';
  }

  const user = await User.create(userData);

  try {


    await sendOTPEmail(email, otp, name);
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  return { user, email };
};






// Verify OTP.
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


  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return { user };
};






// Resend OTP.
export const resendOTP = async ({ email }) => {
  const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.emailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }


  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry();

  user.otp = otp;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();


  await sendOTPEmail(email, otp, user.name);
};






// Log in the user.
export const login = async ({ email, password }) => {

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }


  if (user.provider !== 'local') {
    throw new ApiError(403, `This account is registered with ${user.provider}`);
  }


  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }


  if (!user.emailVerified) {

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


  if (user.role === 'recruiter' && user.approvalStatus !== 'approved') {
    throw new ApiError(403, 'Your recruiter account is not yet approved by admin.');
  }



  const token = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return {
    token,
    refreshToken,
    user: {
      email: user.email,
      role: user.role
    }
  };
};






// Refresh access token.
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


  await tokenService.removeRefreshToken(refreshTokenStr);

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      role: user.role
    }
  };
};






// Log out the user.
export const logout = async ({ userId, refreshToken }) => {
  if (refreshToken) {
    await tokenService.removeRefreshToken(refreshToken);
    return;
  }

  if (userId) {
    await tokenService.removeAllUserTokens(userId);
  }
};






// Get profile.
export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    email: user.email,
    role: user.role
  };
};