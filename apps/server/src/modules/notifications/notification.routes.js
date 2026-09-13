import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { saveSubscription } from '../../shared/services/pushNotification.service.js';

const router = Router();

/**
 * GET /api/notifications/vapid-key
 * Returns the VAPID public key so the client can subscribe.
 */
router.get('/vapid-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(500).json({ success: false, message: 'VAPID public key not configured' });
  }
  return res.status(200).json({ success: true, publicKey: key });
});

/**
 * POST /api/notifications/subscribe
 * Saves the user's push subscription.
 * Requires authentication.
 */
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription payload is required' });
    }
    await saveSubscription(userId, subscription);
    return res.status(200).json({ success: true, message: 'Subscription saved' });
  } catch (err) {
    console.error('Push subscribe error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
