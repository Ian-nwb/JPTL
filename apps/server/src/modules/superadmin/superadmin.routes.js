import express from 'express';
import * as superadminController from './superadmin.controller.js';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware.js';
import { getMaintenanceState, setMaintenanceState } from '../../shared/services/systemState.service.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Superadmin
 *   description: Superadmin platform management (Properties, Units, Live Session Monitoring)
 */

// All superadmin routes require authentication and the 'superadmin' role
router.use(requireAuth, requireRole('superadmin'));

// ─── LOOKUPS ───
/**
 * @swagger
 * /api/superadmin/lookup/users:
 *   get:
 *     summary: Retrieve landlords and tenants for selection in property and unit forms
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of landlords and tenants
 */
router.get('/lookup/users', superadminController.getUsersLookup);

// ─── PROPERTIES CRUD ───
/**
 * @swagger
 * /api/superadmin/properties:
 *   get:
 *     summary: List all properties across all landlords
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by property name, address, or city
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (Residential, Luxury, Studio, Penthouse, Commercial)
 *     responses:
 *       200:
 *         description: List of properties
 *   post:
 *     summary: Create a new property as Superadmin
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, city, landlord]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               category: { type: string }
 *               landlord: { type: string }
 *               unitsCount: { type: number }
 *     responses:
 *       201:
 *         description: Property created
 */
router.route('/properties')
  .get(superadminController.getProperties)
  .post(superadminController.createProperty);

/**
 * @swagger
 * /api/superadmin/properties/{id}:
 *   get:
 *     summary: Get single property by ID
 *     tags: [Superadmin]
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
 *         description: Property details
 *   patch:
 *     summary: Update property by ID
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Property updated
 *   delete:
 *     summary: Delete property and associated units
 *     tags: [Superadmin]
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
 *         description: Property deleted
 */
router.route('/properties/:id')
  .get(superadminController.getPropertyById)
  .patch(superadminController.updateProperty)
  .delete(superadminController.deleteProperty);

// ─── UNITS CRUD ───
/**
 * @swagger
 * /api/superadmin/units:
 *   get:
 *     summary: List all units across all properties
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by unit label
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [occupied, vacant, maintenance]
 *     responses:
 *       200:
 *         description: List of units
 *   post:
 *     summary: Create a new unit under a property
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, property, monthlyRent, sqft]
 *             properties:
 *               label: { type: string }
 *               property: { type: string }
 *               monthlyRent: { type: number }
 *               sqft: { type: number }
 *               bedrooms: { type: number }
 *               bathrooms: { type: number }
 *               status: { type: string }
 *               tenant: { type: string }
 *     responses:
 *       201:
 *         description: Unit created
 */
router.route('/units')
  .get(superadminController.getUnits)
  .post(superadminController.createUnit);

/**
 * @swagger
 * /api/superadmin/units/{id}:
 *   get:
 *     summary: Get single unit by ID
 *     tags: [Superadmin]
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
 *         description: Unit details
 *   patch:
 *     summary: Update unit by ID
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Unit updated
 *   delete:
 *     summary: Delete unit
 *     tags: [Superadmin]
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
 *         description: Unit deleted
 */
router.route('/units/:id')
  .get(superadminController.getUnitById)
  .patch(superadminController.updateUnit)
  .delete(superadminController.deleteUnit);

// ─── SESSIONS & LIVE MONITORING ───
/**
 * @swagger
 * /api/superadmin/sessions:
 *   get:
 *     summary: Retrieve paginated login session history and active session counts
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session logs list
 */
router.get('/sessions', superadminController.getSessionLogs);

/**
 * @swagger
 * /api/superadmin/sessions/stream:
 *   get:
 *     summary: Server-Sent Events (SSE) live stream for user login and logout events
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time text/event-stream
 */
router.get('/sessions/stream', superadminController.streamSessions);

// ─── USERS CRUD (LANDLORDS & TENANTS) ───
/**
 * @swagger
 * /api/superadmin/users:
 *   get:
 *     summary: List platform users (landlords and tenants) with filtering and search
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [landlord, tenant, superadmin, all]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, all]
 *         description: Filter by account status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: List of platform users
 *   post:
 *     summary: Create a new platform user (landlord or tenant)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string }
 *               middleName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [landlord, tenant, superadmin] }
 *               plan: { type: string, enum: [starter, pro, enterprise] }
 *               landlord: { type: string, description: "Landlord user ID if creating a tenant" }
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.route('/users')
  .get(superadminController.getUsers)
  .post(superadminController.createUser);

/**
 * @swagger
 * /api/superadmin/users/{id}:
 *   get:
 *     summary: Get single user by ID
 *     tags: [Superadmin]
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
 *         description: User details
 *   patch:
 *     summary: Update platform user
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               middleName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *               status: { type: string, enum: [active, suspended] }
 *     responses:
 *       200:
 *         description: User updated successfully
 *   delete:
 *     summary: Delete platform user
 *     tags: [Superadmin]
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
 *         description: User deleted successfully
 */
router.route('/users/:id')
  .get(superadminController.getUserById)
  .patch(superadminController.updateUser)
  .delete(superadminController.deleteUser);

// ─── SYSTEM STATUS & MAINTENANCE MODE ───
/**
 * @swagger
 * /api/superadmin/system/maintenance:
 *   get:
 *     summary: Get platform maintenance mode status
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current maintenance state
 *   post:
 *     summary: Enable or disable platform maintenance mode
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled: { type: boolean }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Updated maintenance state
 */
router.route('/system/maintenance')
  .get(async (req, res) => {
    const state = await getMaintenanceState();
    return res.status(200).json({ success: true, ...state });
  })
  .post(async (req, res) => {
    const { enabled, message } = req.body;
    const updated = await setMaintenanceState(enabled, message);
    return res.status(200).json({ success: true, ...updated });
  });

export default router;
