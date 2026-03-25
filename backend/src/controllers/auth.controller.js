// ── Authentication Controller ──
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('authToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('authToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

/**
 * POST /api/v1/auth/register
 * Create a new user account. OTP sent to email must be verified first.
 */
export const register = asyncHandler(async (req, res) => {
  const { user, email } = await authService.register(req.body);

  const response = new ApiResponse(
    201,
    'Signup successful. Please verify OTP sent to email.',
    { email: user.email, name: user.name }
  );

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP sent to email
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  await authService.verifyOTP(req.body);

  const response = new ApiResponse(200, 'Email verified successfully');

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP to user's email
 */
export const resendOTP = asyncHandler(async (req, res) => {
  await authService.resendOTP(req.body);

  const response = new ApiResponse(200, 'OTP resent successfully');

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { token, refreshToken, user } = await authService.login(req.body);

  setAuthCookies(res, {
    accessToken: token,
    refreshToken,
  });

  const response = new ApiResponse(200, 'Login successful', {
    user,
  });

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookies first, then body
  const refreshTokenStr = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshTokenStr) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(refreshTokenStr);

  setAuthCookies(res, {
    accessToken,
    refreshToken: newRefreshToken,
  });

  const response = new ApiResponse(200, 'Token refreshed successfully', {
    accessToken,
    refreshToken: newRefreshToken,
  });

  res.status(response.statusCode).json(response);
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout({
    userId: req.user?.id,
    refreshToken: req.cookies?.refreshToken || null,
  });

  clearAuthCookies(res);

  const response = new ApiResponse(200, 'Logged out successfully');

  res.status(response.statusCode).json(response);
});

/**
 * GET /api/v1/auth/me
 * Returns 200 with data: null when there is no valid session (no 401 spam in the browser).
 */
export const getMe = asyncHandler(async (req, res) => {
  let currentUser = req.user;

  if (!currentUser && req.cookies?.refreshToken) {
    try {
      const { accessToken, refreshToken, user } = await authService.refreshAccessToken(req.cookies.refreshToken);
      setAuthCookies(res, { accessToken, refreshToken });
      currentUser = user;
    } catch {
      clearAuthCookies(res);
    }
  }

  if (!currentUser) {
    const response = new ApiResponse(200, 'Not authenticated', null);
    return res.status(200).json(response);
  }

  const user = await userService.getUserById(currentUser.id || currentUser._id);

  const response = new ApiResponse(200, 'User profile fetched', user);

  res.status(response.statusCode).json(response);
});

/**
 * GET /api/v1/auth/profile
 * Returns authenticated user's profile
 */
export const profile = asyncHandler(async (req, res) => {
  const userProfile = await authService.getProfile(req.user.id);

  const response = new ApiResponse(200, 'Profile fetched successfully', userProfile);

  res.status(response.statusCode).json(response);
});
