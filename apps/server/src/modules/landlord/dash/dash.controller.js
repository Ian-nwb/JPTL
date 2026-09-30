import { getLandlordDashboard, getLandlordKpi, DashError } from './dash.service.js';
import { getLandlordProperties } from '../properties/properties.service.js';
import { getLandlordTickets } from '../tickets/tickets.service.js';
import { getTenantDirectory } from '../tenantdirectory/tenantdirectory.service.js';
import { getLandlordDocuments } from '../documents/documents.service.js';
import { getRentRoll } from '../rentroll/rentroll.service.js';
import { getLandlordAnnouncements } from '../announcements/announcements.service.js';

/**
 * GET /api/landlord/dash
 * Full dashboard payload — properties, KPIs, recent tickets, payments, pinned announcement.
 */
async function getDashboard(req, res) {
  try {
    const data = await getLandlordDashboard(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err instanceof DashError ? err.statusCode : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/landlord/dash/kpi
 * Lightweight KPI snapshot — suitable for background polling / badge refresh.
 */
async function getKpi(req, res) {
  try {
    const data = await getLandlordKpi(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err instanceof DashError ? err.statusCode : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/landlord/dash/init
 * Singular Consolidated Endpoint:
 * Executes all 7 domain queries concurrently in 1 single Vercel function invocation.
 */
async function getDashInit(req, res) {
  const landlordId = req.user.id;
  try {
    const [dashRes, propertiesRes, ticketsRes, tenantsRes, documentsRes, rentrollRes, announcementsRes] =
      await Promise.all([
        getLandlordDashboard(landlordId).catch((err) => {
          console.warn('DashInit dash fetch:', err.message);
          return null;
        }),
        getLandlordProperties(landlordId).catch((err) => {
          console.warn('DashInit properties fetch:', err.message);
          return [];
        }),
        getLandlordTickets(landlordId).catch((err) => {
          console.warn('DashInit tickets fetch:', err.message);
          return { tickets: [] };
        }),
        getTenantDirectory(landlordId).catch((err) => {
          console.warn('DashInit tenants fetch:', err.message);
          return [];
        }),
        getLandlordDocuments(landlordId).catch((err) => {
          console.warn('DashInit documents fetch:', err.message);
          return { documents: [] };
        }),
        getRentRoll(landlordId).catch((err) => {
          console.warn('DashInit rentroll fetch:', err.message);
          return { payments: [] };
        }),
        getLandlordAnnouncements(landlordId, {}).catch((err) => {
          console.warn('DashInit announcements fetch:', err.message);
          return [];
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        dash:          { ok: true, data: { success: true, data: dashRes } },
        properties:    { ok: true, data: { success: true, data: propertiesRes } },
        tickets:       { ok: true, data: { success: true, data: ticketsRes } },
        tenants:       { ok: true, data: { success: true, data: tenantsRes } },
        documents:     { ok: true, data: { success: true, data: documentsRes } },
        rentroll:      { ok: true, data: { success: true, data: rentrollRes } },
        announcements: { ok: true, data: { success: true, data: announcementsRes } },
      },
    });
  } catch (err) {
    console.error('DashInit error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export { getDashboard, getKpi, getDashInit };

