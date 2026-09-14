import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { saveSubscription } from '../../shared/services/pushNotification.service.js';
import Notification from '../../shared/models/notification.model.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification management and Web Push subscription
 */

/**
 * @swagger
 * /api/notifications/vapid-key:
 *   get:
 *     summary: Get the VAPID public key for Web Push subscription
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: VAPID public key
 */
router.get('/vapid-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(500).json({ success: false, message: 'VAPID public key not configured' });
  }
  return res.status(200).json({ success: true, publicKey: key });
});

/**
 * @swagger
 * /api/notifications/subscribe:
 *   post:
 *     summary: Save a Web Push subscription for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscription]
 *             properties:
 *               subscription: { type: object }
 *     responses:
 *       200:
 *         description: Subscription saved
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

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter by unread only
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const filter = { user: userId };
    if (req.query.unread === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount: await Notification.countDocuments({ user: userId, read: false }),
    });
  } catch (err) {
    console.error('Get notifications error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
    return res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/notifications/clear-all:
 *   delete:
 *     summary: Delete all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 */
router.delete('/clear-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await Notification.deleteMany({ user: userId });
    return res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
