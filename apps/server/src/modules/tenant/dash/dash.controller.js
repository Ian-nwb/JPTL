import { getTenantDashboard, getTenantKpi, TenantDashError } from './dash.service.js';
import { getTenantLedger } from '../payments/payments.service.js';
import { getTenantTickets } from '../tickets/tickets.service.js';
import { getTenantFeed } from '../announcements/announcements.service.js';
import { getTenantLease } from '../lease/lease.service.js';

/**
 * GET /api/tenant/dash
 * Full tenant dashboard payload.
 */
async function getDashboard(req, res) {
  try {
    const tenantId = req.user._id || req.user.id;
    const data = await getTenantDashboard(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err instanceof TenantDashError ? err.statusCode : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/tenant/dash/kpi
 * Lightweight KPI snapshot for badge refresh.
 */
async function getKpi(req, res) {
  try {
    const tenantId = req.user._id || req.user.id;
    const data = await getTenantKpi(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err instanceof TenantDashError ? err.statusCode : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/tenant/dash/init
 * Singular Consolidated Endpoint:
 * Executes all 5 domain queries concurrently in 1 single Vercel function invocation!
 */
async function getPortalInit(req, res) {
  const tenantId = req.user._id || req.user.id;
  try {
    const [dashRes, paymentsRes, ticketsRes, feedRes, leaseRes] = await Promise.all([
      getTenantDashboard(tenantId).catch((err) => {
        console.warn('PortalInit dash fetch:', err.message);
        return null;
      }),
      getTenantLedger(tenantId).catch((err) => {
        console.warn('PortalInit ledger fetch:', err.message);
        return null;
      }),
      getTenantTickets(tenantId).catch((err) => {
        console.warn('PortalInit tickets fetch:', err.message);
        return [];
      }),
      getTenantFeed(tenantId, {}).catch((err) => {
        console.warn('PortalInit announcements fetch:', err.message);
        return { announcements: [] };
      }),
      getTenantLease(tenantId).catch((err) => {
        console.warn('PortalInit lease fetch:', err.message);
        return null;
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        dash: { ok: true, data: { success: true, data: dashRes } },
        payments: { ok: true, data: paymentsRes },
        tickets: { ok: true, data: ticketsRes },
        announcements: { ok: true, data: feedRes?.announcements || feedRes || [] },
        lease: { ok: true, data: { success: true, data: leaseRes } },
      },
    });
  } catch (err) {
    console.error('PortalInit error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export { getDashboard, getKpi, getPortalInit };
