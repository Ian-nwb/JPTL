import * as authService from './auth.service.js';
import { recordLogoutSession } from '../../shared/services/sessionMonitor.service.js';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day, match JWT_EXPIRES_IN

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  };
}

function getClientDetails(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.socket?.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';
  return { ip, userAgent };
}

async function signupLandlord(req, res) {
  try {
    const user = await authService.signupLandlord(req.body);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { ip, userAgent } = getClientDetails(req);
    const { user, token } = await authService.login({ ...req.body, ip, userAgent });
    // Clear global cookie so multi-tab sessionStorage isolation works cleanly
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(200).json({ success: true, user, role: user.role, token });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

async function loginSuperadmin(req, res) {
  try {
    const { ip, userAgent } = getClientDetails(req);
    const { user, token } = await authService.loginSuperadmin({ ...req.body, ip, userAgent });
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(200).json({ success: true, user, role: user.role, token });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

async function logout(req, res) {
  try {
    let userId = req.user?.id || req.user?._id;
    if (!userId) {
      // Attempt to inspect Bearer token if passed in header or cookie
      const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : req.cookies?.token;
      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch {
          // ignore error if token invalid
        }
      }
    }
    if (userId) {
      await recordLogoutSession(userId);
    }
  } catch (err) {
    console.error('Logout session log error:', err);
  }

  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.status(200).json({ success: true, message: 'Logged out' });
}

async function changePassword(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePasswordService(
      userId,
      currentPassword,
      newPassword
    );

    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    await authService.forgotPassword({ email: req.body.email, origin });
    // Always return 200 regardless of whether the email exists (prevent enumeration)
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword({ token, newPassword });
    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export { signupLandlord, login, loginSuperadmin, getMe, logout, changePassword, forgotPassword, resetPassword };