import * as authService from './auth.service.js';

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
    const { user, token } = await authService.login(req.body);
    // Clear global cookie so multi-tab sessionStorage isolation works cleanly
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
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.status(200).json({ success: true, message: 'Logged out' });
}

async function changePassword(req, res) {
  try {
    // req.user is set by your authentication middleware (e.g., protectRoute)
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

export { signupLandlord, login, getMe, logout, changePassword };