import { Router } from 'express';
import { requireAuth, requireRole } from '../../../shared/middleware/auth.middleware.js';
import { getLandlordLeaseExtensions, reviewLeaseExtension } from './leaseExtensions.controller.js';

const router = Router();

// All routes require landlord auth
router.use(requireAuth, requireRole('landlord'));

// GET  /api/landlord/lease-extensions            — list all requests (filter by ?status=)
router.get('/', getLandlordLeaseExtensions);

// PATCH /api/landlord/lease-extensions/:leaseId/:extensionId — approve or reject
router.patch('/:leaseId/:extensionId', reviewLeaseExtension);

export default router;
