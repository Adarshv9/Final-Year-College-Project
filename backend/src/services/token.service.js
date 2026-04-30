// Implements business logic for token workflows.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';






// Generate access token.
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry }
  );
};







// Generate refresh token.
export const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { id: user._id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry }
  );


  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);
  const now = new Date();


  await User.findByIdAndUpdate(user._id, {
    $pull: {
      refreshTokens: {
        expiresAt: { $lte: now }
      }
    }
  });


  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        token: refreshToken,
        expiresAt
      }
    }
  });

  return refreshToken;
};






// Verify refresh token.
export const verifyRefreshToken = async (token) => {
  const decoded = jwt.verify(token, env.jwt.refreshSecret);
  const now = new Date();

  const storedToken = await User.findOneAndUpdate(
    { _id: decoded.id },
    {
      $pull: {
        refreshTokens: {
          expiresAt: { $lte: now }
        }
      }
    },
    {
      new: true,
      select: '+refreshTokens'
    }
  );

  const hasValidToken = storedToken?.refreshTokens?.some(
    (refreshToken) => refreshToken.token === token
  );

  if (!hasValidToken) {
    throw new ApiError(401, 'Refresh token not found or has been revoked');
  }

  return decoded;
};





// Remove refresh token.
export const removeRefreshToken = async (token) => {
  await User.updateOne(
    { 'refreshTokens.token': token },
    {
      $pull: {
        refreshTokens: {
          token
        }
      }
    }
  );
};





// Remove all user tokens.
export const removeAllUserTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshTokens: [] }
  });
};