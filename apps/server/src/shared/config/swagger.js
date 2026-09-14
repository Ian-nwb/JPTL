import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JPTL Property Management API',
      version: '1.0.0',
      description: 'Complete API Documentation for JPTL Property Management — including Superadmin, Landlord, Tenant, and Authentication modules.',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local Development Server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Alternate Port',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & Session Management' },
      { name: 'Superadmin', description: 'Platform Administration (Users, Properties, Units & Live Monitoring)' },
      { name: 'Landlord', description: 'Landlord Operations (Properties, Rent Roll, Tenants, Tickets, Leases, Documents)' },
      { name: 'Tenant', description: 'Tenant Operations (Dashboard, Rent Payments, Tickets, Leases, Announcements)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    paths: {
      '/api/landlord/dash': {
        get: {
          tags: ['Landlord'],
          summary: 'Retrieve Landlord dashboard telemetry, revenue stats, and occupancy rates',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Landlord dashboard metrics' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/landlord/properties': {
        get: {
          tags: ['Landlord'],
          summary: 'List properties owned by authenticated landlord',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Properties list' },
          },
        },
        post: {
          tags: ['Landlord'],
          summary: 'Create a new property for authenticated landlord',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'address', 'city'],
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    city: { type: 'string' },
                    category: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Property created' },
          },
        },
      },
      '/api/landlord/tenantdirectory': {
        get: {
          tags: ['Landlord'],
          summary: 'List tenants residing across landlord properties',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Tenant directory list' },
          },
        },
      },
      '/api/landlord/tickets': {
        get: {
          tags: ['Landlord'],
          summary: 'List maintenance tickets across landlord properties',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Maintenance tickets list' },
          },
        },
      },
      '/api/landlord/rentroll': {
        get: {
          tags: ['Landlord'],
          summary: 'Retrieve rent roll and payment schedules for landlord units',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Rent roll report' },
          },
        },
      },
      '/api/landlord/announcements': {
        get: {
          tags: ['Landlord'],
          summary: 'List announcements created by landlord',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Announcements list' },
          },
        },
        post: {
          tags: ['Landlord'],
          summary: 'Broadcast a new announcement to tenants',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    category: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Announcement broadcasted' },
          },
        },
      },
      '/api/tenant/dash': {
        get: {
          tags: ['Tenant'],
          summary: 'Retrieve tenant portal dashboard (unit details, rent status, active tickets)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Tenant dashboard overview' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/tenant/payments': {
        get: {
          tags: ['Tenant'],
          summary: 'Retrieve tenant rent payment ledger and invoice history',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Payment history ledger' },
          },
        },
      },
      '/api/tenant/tickets': {
        get: {
          tags: ['Tenant'],
          summary: 'List maintenance tickets filed by tenant',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Tenant maintenance tickets' },
          },
        },
        post: {
          tags: ['Tenant'],
          summary: 'File a new maintenance repair request',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'category', 'description'],
                  properties: {
                    title: { type: 'string' },
                    category: { type: 'string', enum: ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Other'] },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Ticket created' },
          },
        },
      },
      '/api/tenant/announcements': {
        get: {
          tags: ['Tenant'],
          summary: 'Retrieve announcements broadcasted to tenant',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Broadcasted announcements' },
          },
        },
      },
    },
  },
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.js',
    './app.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
