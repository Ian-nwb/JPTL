import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './src/shared/config/cors.js';
import { swaggerUi, swaggerSpec } from './src/shared/config/swagger.js';
import authRoutes from './src/modules/auth/auth.routes.js';
import superadminRoutes from './src/modules/superadmin/superadmin.routes.js';
import landlordAnnouncementRoutes from './src/modules/landlord/announcements/announcements.routes.js';
import landlordOnboardingRoutes from './src/modules/landlord/onboarding/onboarding.routes.js';
import landlordDashRoutes from './src/modules/landlord/dash/dash.routers.js';
import landlordTenantDirectoryRoutes from './src/modules/landlord/tenantdirectory/tenantdirectory.routes.js';
import landlordRentRollRoutes from './src/modules/landlord/rentroll/rentroll.routes.js';
import landlordPropertyRoutes from './src/modules/landlord/properties/properties.routes.js';
import landlordTicketRoutes from './src/modules/landlord/tickets/tickets.routes.js';
import landlordLeaseRoutes from './src/modules/landlord/lease/lease.routes.js';
import landlordDocumentRoutes from './src/modules/landlord/documents/documents.routes.js';
import tenantAnnouncementRoutes from './src/modules/tenant/announcements/announcements.routes.js';
import tenantDashRoutes from './src/modules/tenant/dash/dash.routers.js';
import tenantPaymentsRoutes from './src/modules/tenant/payments/payments.routes.js';
import tenantTicketRoutes from './src/modules/tenant/tickets/tickets.routes.js';
import tenantLeaseRoutes from './src/modules/tenant/lease/lease.routes.js';
import tenantDocumentRoutes from './src/modules/tenant/documents/documents.routes.js';
import notificationRoutes from './src/modules/notifications/notification.routes.js';
import vehicleRoutes from './src/modules/tenant/vehicle/vehicle.routes.js';
import { generalLimiter, authLimiter } from './src/shared/middleware/rateLimiter.middleware.js';
import { checkMaintenanceMode } from './src/shared/middleware/maintenance.middleware.js';
import { getMaintenanceState } from './src/shared/services/systemState.service.js';

const app = express();

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Swagger Documentation UI (Accessible at /api/docs)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply global rate limiting and disable caching for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use('/api', generalLimiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Public platform status (checks if maintenance mode is active)
app.get('/api/system/status', async (req, res) => {
  const state = await getMaintenanceState();
  res.status(200).json({
    success: true,
    maintenance: state.enabled,
    message: state.message,
    timestamp: state.updatedAt,
  });
});

// Maintenance mode barrier (intercepts non-superadmin traffic when active)
app.use(checkMaintenanceMode);

// Authentication routes
app.use('/api/auth', authRoutes);

// Superadmin routes (Always accessible to superadmins)
app.use('/api/superadmin', superadminRoutes);

// Landlord routes
app.use('/api/landlord/dash', landlordDashRoutes);
app.use('/api/landlord/onboarding', landlordOnboardingRoutes);
app.use('/api/landlord/properties', landlordPropertyRoutes);
app.use('/api/landlord/tickets', landlordTicketRoutes);
app.use('/api/landlord/lease', landlordLeaseRoutes);
app.use('/api/landlord/documents', landlordDocumentRoutes);
app.use('/api/landlord/announcements', landlordAnnouncementRoutes);
app.use('/api/landlord/tenantdirectory', landlordTenantDirectoryRoutes);
app.use('/api/landlord/rentroll', landlordRentRollRoutes);

// Tenant routes
app.use('/api/tenant/dash', tenantDashRoutes);
app.use('/api/tenant/announcements', tenantAnnouncementRoutes);
app.use('/api/tenant/payments', tenantPaymentsRoutes);
app.use('/api/tenant/tickets', tenantTicketRoutes);
app.use('/api/tenant/lease', tenantLeaseRoutes);
app.use('/api/tenant/documents', tenantDocumentRoutes);
app.use('/api/tenant/vehicles', vehicleRoutes);

// Shared notification routes (VAPID key + push subscribe)
app.use('/api/notifications', notificationRoutes);

export default app;