import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../../../app.js';
import User from '../../shared/models/user.model.js';
import Property from '../../shared/models/property.model.js';
import Unit from '../../shared/models/unit.model.js';
import SessionLog from '../../shared/models/sessionLog.model.js';

let mongoServer;
let superadminToken;
let superadminUser;
let landlordUser;
let landlordToken;
let tenantUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-12345';

  superadminUser = await User.create({
    firstName: 'System',
    lastName: 'Superadmin',
    email: 'superadmin@jptl.sys',
    password: 'admin123',
    role: 'superadmin',
    status: 'active',
  });

  superadminToken = jwt.sign(
    { _id: superadminUser._id, id: superadminUser._id, role: 'superadmin', email: superadminUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  landlordUser = await User.create({
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@example.com',
    password: 'admin123',
    role: 'landlord',
    status: 'active',
  });

  landlordToken = jwt.sign(
    { _id: landlordUser._id, id: landlordUser._id, role: 'landlord', email: landlordUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  tenantUser = await User.create({
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@example.com',
    password: 'admin123',
    role: 'tenant',
    landlord: landlordUser._id,
    status: 'active',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Superadmin Authentication & Platform Management API', () => {
  describe('Superadmin Auth (POST /api/auth/superadmin/login)', () => {
    it('authenticates valid superadmin credentials and logs session', async () => {
      const res = await request(app)
        .post('/api/auth/superadmin/login')
        .send({ email: 'superadmin@jptl.sys', password: 'admin123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('superadmin');

      // Verify SessionLog was recorded
      const session = await SessionLog.findOne({ email: 'superadmin@jptl.sys' });
      expect(session).toBeDefined();
      expect(session.role).toBe('superadmin');
    });

    it('rejects regular landlord attempting to use superadmin login', async () => {
      const res = await request(app)
        .post('/api/auth/superadmin/login')
        .send({ email: 'marcus.vance@example.com', password: 'admin123' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/superadmin/login')
        .send({ email: 'superadmin@jptl.sys', password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('RBAC Guards', () => {
    it('blocks non-superadmin (landlord) from superadmin routes with 403', async () => {
      await request(app)
        .get('/api/superadmin/properties')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(403);
    });

    it('blocks unauthenticated requests with 401', async () => {
      await request(app)
        .get('/api/superadmin/properties')
        .expect(401);
    });
  });

  describe('Superadmin Lookups & CRUD Operations', () => {
    let createdPropertyId;
    let createdUnitId;

    it('GET /api/superadmin/lookup/users returns landlords and tenants', async () => {
      const res = await request(app)
        .get('/api/superadmin/lookup/users')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.landlords)).toBe(true);
      expect(Array.isArray(res.body.tenants)).toBe(true);
    });

    it('POST /api/superadmin/properties creates a property across the platform', async () => {
      const res = await request(app)
        .post('/api/superadmin/properties')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Apex Heights',
          address: '100 Silicon Way',
          city: 'Tech City',
          category: 'Commercial',
          landlord: landlordUser._id,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.property.name).toBe('Apex Heights');
      createdPropertyId = res.body.property._id;
    });

    it('GET /api/superadmin/properties lists properties with landlord populated', async () => {
      const res = await request(app)
        .get('/api/superadmin/properties')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.properties.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/superadmin/units creates a unit under a property', async () => {
      const res = await request(app)
        .post('/api/superadmin/units')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          label: 'Suite 404',
          property: createdPropertyId,
          rentAmount: 3200,
          status: 'occupied',
          tenant: tenantUser._id,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.unit.label).toBe('Suite 404');
      createdUnitId = res.body.unit._id;
    });

    it('GET /api/superadmin/units lists units with property & tenant resolved', async () => {
      const res = await request(app)
        .get('/api/superadmin/units')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.units.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/superadmin/users creates a new tenant user', async () => {
      const res = await request(app)
        .post('/api/superadmin/users')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          firstName: 'Chloe',
          lastName: 'Smith',
          email: 'chloe@example.com',
          password: 'Password123!',
          role: 'tenant',
          landlord: landlordUser._id,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('chloe@example.com');
    });

    it('GET /api/superadmin/users retrieves platform users with search and filter', async () => {
      const res = await request(app)
        .get('/api/superadmin/users?role=tenant')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.users.every((u) => u.role === 'tenant')).toBe(true);
    });

    it('GET /api/superadmin/sessions returns session history and active counts', async () => {
      const res = await request(app)
        .get('/api/superadmin/sessions')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      expect(typeof res.body.activeCount).toBe('number');
    });

    it('DELETE /api/superadmin/units/:id deletes a unit', async () => {
      const res = await request(app)
        .delete(`/api/superadmin/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/superadmin/properties/:id deletes a property', async () => {
      const res = await request(app)
        .delete(`/api/superadmin/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Platform Maintenance Mode (HTTP 503 Gatekeeper)', () => {
    it('enables maintenance mode via superadmin endpoint', async () => {
      const res = await request(app)
        .post('/api/superadmin/system/maintenance')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ enabled: true, message: 'Platform lockdown test' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.enabled).toBe(true);
    });

    it('blocks tenant/landlord login with 503 while maintenance mode is active', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'marcus.vance@example.com', password: 'admin123' })
        .expect(503);

      expect(res.body.success).toBe(false);
      expect(res.body.maintenance).toBe(true);
    });

    it('still allows superadmin login and endpoints during maintenance mode', async () => {
      const res = await request(app)
        .post('/api/auth/superadmin/login')
        .send({ email: 'superadmin@jptl.sys', password: 'admin123' })
        .expect(200);

      expect(res.body.success).toBe(true);

      await request(app)
        .get('/api/superadmin/properties')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });

    it('disables maintenance mode and restores normal login access', async () => {
      const res = await request(app)
        .post('/api/superadmin/system/maintenance')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ enabled: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.enabled).toBe(false);

      // Now normal login succeeds
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'marcus.vance@example.com', password: 'admin123' })
        .expect(200);
    });
  });
});
