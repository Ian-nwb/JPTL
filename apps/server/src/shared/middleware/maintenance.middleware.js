import jwt from 'jsonwebtoken';
import { getMaintenanceState } from '../services/systemState.service.js';

/**
 * Middleware to intercept non-superadmin API traffic when maintenance mode is active.
 */
export async function checkMaintenanceMode(req, res, next) {
  const state = await getMaintenanceState();
  if (!state.enabled) {
    return next();
  }

  const path = req.originalUrl || req.url || '';

  // Paths always allowed during maintenance
  const bypassPrefixes = [
    '/api/health',
    '/api/system/status',
    '/api/docs',
    '/api/superadmin',
    '/api/auth/superadmin',
  ];

  if (bypassPrefixes.some((prefix) => path.startsWith(prefix))) {
    return next();
  }

  // Check if Bearer token belongs to superadmin
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret');
      if (decoded && decoded.role === 'superadmin') {
        req.user = decoded;
        return next();
      }
    } catch {
      // Invalid/expired token
    }
  }

  // If user is already authenticated as superadmin on request object
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }

  return res.status(503).json({
    success: false,
    maintenance: true,
    message: state.message || 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
    retryAfter: 300,
  });
}
