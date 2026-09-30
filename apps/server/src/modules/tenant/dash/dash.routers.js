import { Router } from 'express';
import { requireAuth, requireRole } from '../../../shared/middleware/auth.middleware.js';
import { getDashboard, getKpi, getPortalInit } from './dash.controller.js';

const router = Router();

// All tenant dash routes require a valid JWT and the 'tenant' role
router.use(requireAuth, requireRole('tenant'));

/**
 * @route  GET /api/tenant/dash/init
 * @desc   Singular consolidated endpoint – all portal data in 1 request
 * @access Private (tenant)
 */
router.get('/init', getPortalInit);

/**
 * @route  GET /api/tenant/dash
 * @desc   Full tenant dashboard payload
 * @access Private (tenant)
 */
router.get('/', getDashboard);

/**
 * @route  GET /api/tenant/dash/kpi
 * @desc   Lightweight KPI snapshot (badge refresh)
 * @access Private (tenant)
 */
router.get('/kpi', getKpi);

export default router;
