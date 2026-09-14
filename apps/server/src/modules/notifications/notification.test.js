import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../../../app.js';
import User from '../../shared/models/user.model.js';
import Notification from '../../shared/models/notification.model.js';

let mongoServer;
let userToken;
let userId;
let otherToken;
let notif1;
let notif2;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-12345';

  const user = await User.create({
    firstName: 'Tori',
    lastName: 'Dela Cruz',
    email: 'tori@example.com',
    password: 'Password123!',
    role: 'tenant',
    status: 'active',
  });
  userId = user._id;

  userToken = jwt.sign(
    { _id: user._id, id: user._id, role: 'tenant', email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const otherUser = await User.create({
    firstName: 'Other',
    lastName: 'User',
    email: 'other@example.com',
    password: 'Password123!',
    role: 'landlord',
    status: 'active',
  });

  otherToken = jwt.sign(
    { _id: otherUser._id, id: otherUser._id, role: 'landlord', email: otherUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
});

beforeEach(async () => {
  await Notification.deleteMany({});
  notif1 = await Notification.create({
    user: userId,
    title: 'HVAC Maintenance Scheduled',
    body: 'Technician dispatched for unit 301',
    type: 'maintenance',
    read: false,
  });
  notif2 = await Notification.create({
    user: userId,
    title: 'Community Notice',
    body: 'Water shutdown tomorrow 9 AM',
    type: 'announcement',
    read: false,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Notification Module API (/api/notifications)', () => {
  it('GET /api/notifications - retrieves notifications for authenticated user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.unreadCount).toBe(2);
  });

  it('PATCH /api/notifications/:id/read - marks single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notif1._id}/read`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.notification.read).toBe(true);

    const check = await Notification.findById(notif1._id);
    expect(check.read).toBe(true);
  });

  it('PATCH /api/notifications/read-all - marks all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.modifiedCount).toBe(2);

    const unread = await Notification.countDocuments({ user: userId, read: false });
    expect(unread).toBe(0);
  });

  it('DELETE /api/notifications/clear-all - deletes all notifications for user', async () => {
    const res = await request(app)
      .delete('/api/notifications/clear-all')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBe(2);

    const remaining = await Notification.countDocuments({ user: userId });
    expect(remaining).toBe(0);
  });

  it('GET /api/notifications - unauthenticated returns 401', async () => {
    await request(app)
      .get('/api/notifications')
      .expect(401);
  });
});
