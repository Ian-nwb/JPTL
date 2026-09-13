import express from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware.js';

const router = express.Router();

router.post('/signup', authLimiter, authController.signupLandlord);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.patch('/change-password', requireAuth, authController.changePassword);

export default router;