const express = require('express');
const request = require('supertest');

function jsonApp(router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe('tenant and role boundaries', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('agent cannot query another agency orders', async () => {
    const queryStub = {
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis()
    };

    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn().mockResolvedValue({
        user: { id: 'user-1', email: 'agent@agency.test' },
        profile: { id: 'user-1', role: 'agent', agency_id: 'agency-a' }
      }),
      forbidden: (res, message = 'Access denied') =>
        res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      ensureStaff: jest.fn(),
      canAccessOrder: jest.fn()
    }));

    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn(() => ({
        select: jest.fn(() => queryStub)
      }))
    }));

    const router = require('../../src/routes/orders');
    const app = jsonApp(router);

    const res = await request(app)
      .get('/api/orders')
      .query({ agency_id: 'agency-b' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toMatch(/own agency/i);
  });

  test('document download is forbidden across tenant boundary', async () => {
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn().mockResolvedValue({
        user: { id: 'user-1', email: 'agent@agency.test' },
        profile: { id: 'user-1', role: 'agent', agency_id: 'agency-a' }
      }),
      forbidden: (res, message = 'Access denied') =>
        res.status(403).json({ error: { code: 'FORBIDDEN', message } })
    }));

    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' }
    }));

    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'doc-1',
                agency_id: 'agency-b',
                order_id: 'order-9',
                storage_bucket: 'documents',
                storage_path: 'tickets/order-9.pdf'
              },
              error: null
            })
          }))
        }))
      }))
    }));

    jest.doMock('../../src/services/orderService', () => ({
      canAccessDocument: jest.fn().mockResolvedValue(false),
      createSignedDocumentUrl: jest.fn()
    }));

    const router = require('../../src/routes/documents');
    const app = jsonApp(router);

    const res = await request(app).get('/documents/doc-1/download');

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('non-admin cannot access admin agencies list', async () => {
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn().mockResolvedValue({
        user: { id: 'user-2', email: 'user@test.local' },
        profile: { id: 'user-2', role: 'user', agency_id: null }
      }),
      forbidden: (res, message = 'Access denied') =>
        res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      ensureAdmin: (auth, res) => {
        if (auth.profile.role !== 'admin' && auth.profile.role !== 'super_admin') {
          res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin role required' } });
          return false;
        }
        return true;
      },
      ensureStaff: jest.fn()
    }));

    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      VALID_PAYMENT_METHODS: ['online', 'cash', 'invoice', 'tamara']
    }));

    jest.doMock('../../src/utils/helpers', () => ({
      isAdminRole: jest.fn(() => false),
      normalizeHost: jest.fn((v) => v),
      toIsoDateStart: jest.fn(),
      toIsoDateEnd: jest.fn(),
      generateInvoiceNumber: jest.fn(() => 'INV-TEST')
    }));

    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));

    jest.doMock('../../src/services/orderService', () => ({
      linkAgencyAdminProfileByEmail: jest.fn(),
      ensureAuthUserByEmail: jest.fn(),
      generateInvoicePdfForInvoice: jest.fn()
    }));

    jest.doMock('../../src/services/agencyProvision', () => ({
      generateAgencySiteFiles: jest.fn(),
      deployToNetlify: jest.fn(),
      addGodaddyCname: jest.fn()
    }));

    const router = require('../../src/routes/admin');
    const app = jsonApp(router);

    const res = await request(app).get('/agencies');

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toMatch(/admin role required/i);
  });
});
