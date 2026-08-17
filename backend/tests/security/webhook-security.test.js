const express = require('express');
const request = require('supertest');

describe('webhook security controls', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.TAMARA_ENABLED;
    delete process.env.TAMARA_PUBLIC_KEY;
  });

  test('email provider webhook rejects invalid secret', async () => {
    jest.doMock('../../src/config', () => ({
      config: {
        emailWebhookSecret: 'email-secret',
        nodeEnv: 'test'
      }
    }));

    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));

    const router = require('../../src/routes/webhooks');
    const app = express();
    app.use(express.json());
    app.use('/api', router);

    const res = await request(app)
      .post('/api/webhooks/email-provider')
      .set('x-email-webhook-secret', 'wrong-secret')
      .send({ provider: 'mailgun', event: 'delivered' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('tamara webhook rejects invalid notification token', async () => {
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/config', () => ({
      config: {}
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/client', () => ({
      createCheckoutSession: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/mapper', () => ({
      buildCheckoutPayload: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/webhook', () => ({
      validateWebhookToken: jest.fn(() => ({ valid: false, error: 'bad token' })),
      persistWebhookEvent: jest.fn(),
      markEventProcessed: jest.fn(),
      logOperation: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/orderFlow', () => ({
      processApprovedOrder: jest.fn(),
      updateOrderProviderStatus: jest.fn()
    }));

    const router = require('../../src/routes/tamara');
    const app = express();
    app.use('/api/payments', router);

    const res = await request(app)
      .post('/api/payments/tamara/webhook')
      .send({ order_id: 'tamara-order-1', order_status: 'approved' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid webhook token' });
  });

  test('tamara webhook acknowledges duplicate event without triggering order processing', async () => {
    const supabaseFrom = jest.fn();
    const processApprovedOrder = jest.fn();
    const updateOrderProviderStatus = jest.fn();
    const markEventProcessed = jest.fn();
    const persistWebhookEvent = jest.fn().mockResolvedValue({
      existing: true,
      inserted: false,
      id: 'evt-1'
    });

    jest.doMock('../../src/lib/supabase', () => ({
      from: supabaseFrom
    }));
    jest.doMock('../../src/config', () => ({
      config: {}
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/client', () => ({
      createCheckoutSession: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/mapper', () => ({
      buildCheckoutPayload: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/webhook', () => ({
      validateWebhookToken: jest.fn(() => ({ valid: true })),
      persistWebhookEvent,
      markEventProcessed,
      logOperation: jest.fn()
    }));
    jest.doMock('../../src/services/tamara/orderFlow', () => ({
      processApprovedOrder,
      updateOrderProviderStatus
    }));

    const router = require('../../src/routes/tamara');
    const app = express();
    app.use('/api/payments', router);

    const res = await request(app)
      .post('/api/payments/tamara/webhook')
      .set('x-notification-token', 'valid-token')
      .send({ order_id: 'tamara-order-1', event_type: 'order.updated', order_status: 'approved' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(persistWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'tamara',
        providerOrderId: 'tamara-order-1',
        eventType: 'order.updated',
        eventStatus: 'approved'
      })
    );
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(updateOrderProviderStatus).not.toHaveBeenCalled();
    expect(processApprovedOrder).not.toHaveBeenCalled();
    expect(markEventProcessed).not.toHaveBeenCalled();
  });
});
