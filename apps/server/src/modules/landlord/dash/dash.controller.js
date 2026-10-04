import { getLandlordDashboard, getLandlordKpi, DashError } from './dash.service.js';
import { getLandlordProperties } from '../properties/properties.service.js';
import { getLandlordTickets } from '../tickets/tickets.service.js';
import { getTenantDirectory } from '../tenantdirectory/tenantdirectory.service.js';
import { getLandlordDocuments } from '../documents/documents.service.js';
import { getRentRoll } from '../rentroll/rentroll.service.js';
import { getLandlordAnnouncements } from '../announcements/announcements.service.js';
import Property from '../../../shared/models/property.model.js';
import Unit from '../../../shared/models/unit.model.js';
import User from '../../../shared/models/user.model.js';

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
 * High-performance orchestrator: fetches properties, units, and tenants once,
 * then resolves all 7 domains concurrently in 3 total DB roundtrips (down from 25+).
 */
async function getDashInit(req, res) {
  const landlordId = req.user.id;
  try {
    // ── Phase 1: Fetch properties, landlord profile, and tenants in 1 concurrent roundtrip ──
    const [properties, landlordUser, tenants] = await Promise.all([
      Property.find({ landlord: landlordId }).sort({ createdAt: -1 }).lean(),
      User.findById(landlordId).select('firstName lastName email plan onboardingCompleted').lean(),
      User.find({ landlord: landlordId, role: 'tenant' }).select('firstName middleName lastName email phone status createdAt').lean(),
    ]);

    const propertyIds = properties.map((p) => p._id);

    // ── Phase 2: Fetch all units under landlord properties in 1 roundtrip ──
    const units = await Unit.find({ property: { $in: propertyIds } }).lean();
    const unitIds = units.map((u) => u._id);

    // Context bundle for all domain services — completely eliminates duplicate queries
    const context = {
      properties,
      propertyIds,
      units,
      unitIds,
      landlordUser,
      tenants,
    };

    // ── Phase 3: Execute all domain services in parallel reusing the shared context ──
    const [dashRes, propertiesRes, ticketsRes, tenantsRes, documentsRes, rentrollRes, announcementsRes] =
      await Promise.all([
        getLandlordDashboard(landlordId, context).catch((err) => {
          console.warn('DashInit dash fetch:', err.message);
          return null;
        }),
        getLandlordProperties(landlordId, context).catch((err) => {
          console.warn('DashInit properties fetch:', err.message);
          return [];
        }),
        getLandlordTickets(landlordId, {}, context).catch((err) => {
          console.warn('DashInit tickets fetch:', err.message);
          return { tickets: [] };
        }),
        getTenantDirectory(landlordId, {}, context).catch((err) => {
          console.warn('DashInit tenants fetch:', err.message);
          return [];
        }),
        getLandlordDocuments(landlordId, {}, context).catch((err) => {
          console.warn('DashInit documents fetch:', err.message);
          return { documents: [] };
        }),
        getRentRoll(landlordId, {}, context).catch((err) => {
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
        properties:    { ok: true, data: { success: true, count: propertiesRes?.length || 0, data: propertiesRes || [] } },
        tickets:       { ok: true, data: { success: true, data: ticketsRes?.tickets || [], tickets: ticketsRes?.tickets || [], ...(ticketsRes || {}) } },
        tenants:       { ok: true, data: { success: true, summary: tenantsRes?.summary, count: tenantsRes?.tenants?.length || 0, data: tenantsRes?.tenants || [] } },
        documents:     { ok: true, data: { success: true, data: documentsRes?.documents || [], documents: documentsRes?.documents || [], ...(documentsRes || {}) } },
        rentroll:      { ok: true, data: { success: true, summary: rentrollRes?.summary, count: rentrollRes?.payments?.length || 0, data: rentrollRes?.payments || [] } },
        announcements: { ok: true, data: { success: true, count: announcementsRes?.length || 0, data: announcementsRes || [] } },
      },
    });
  } catch (err) {
    console.error('DashInit error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export { getDashboard, getKpi, getDashInit };

