import { sendSuccess, sendError } from '../../utils/api-response.js';
import {
  register,
  login,
  refreshTokens,
  logout,
  getMe,
  createPasswordResetToken,
  resetPassword,
} from './auth.service.js';

export async function registerUser(req, res, next) {
  try {
    const result = await register(req.body, req);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function loginUser(req, res, next) {
  try {
    const result = await login(req.body, req);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refreshUserTokens(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }
    const result = await refreshTokens(refreshToken, req);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logoutUser(req, res, next) {
  try {
    await logout(req.user.id, req);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await createPasswordResetToken(req.body.email);

    if (!result) {
      return sendError(res, 'Email not found', 404);
    }

    sendSuccess(res, { message: 'Reset link sent to your email' });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    await resetPassword(req.body.token, req.body.password);
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}
