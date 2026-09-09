describe('payment dry-run email flow', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('generates demo PDF and sends ticket email when dry_run_issue is enabled', async () => {
    const refreshedOrder = {
      id: 'order-1',
      order_number: 'AV-1001',
      agency_id: 'agency-1',
      drct_order_id: 'drct-1',
      origin: 'RUH',
      destination: 'JED',
      departure_time: '2026-06-10T10:00:00.000Z',
      arrival_time: '2026-06-10T12:00:00.000Z',
      airline_code: 'SV',
      airline_name: 'Saudia',
      flight_number: 'SV101',
      total_price: 100,
      currency: 'SAR',
      status: 'confirmed',
      contact_email: 'traveler@example.com',
      contact_phone: '+966500000000',
      raw_offer_data: {
        metadata: {
          dry_run_issue: true,
          origin_host: 'aviaframe.com'
        }
      }
    };

    const download = jest.fn().mockResolvedValue({
      data: {
        arrayBuffer: async () => Buffer.from('pdf-demo')
      }
    });

    const passengersEq = jest.fn().mockResolvedValue({
      data: [{ first_name: 'Jane', last_name: 'Doe', passenger_type: 'ADT' }]
    });

    const updateEq = jest.fn();
    const update = jest.fn(() => ({ eq: updateEq }));
    const single = jest.fn().mockResolvedValue({ data: refreshedOrder });
    const eqSelect = jest.fn(() => ({ single }));
    const selectOrders = jest.fn(() => ({ eq: eqSelect }));
    const selectPassengers = jest.fn(() => ({ eq: passengersEq }));

    const storageFrom = jest.fn(() => ({ download }));

    const from = jest.fn((table) => {
      if (table === 'orders') {
        return { select: selectOrders, update };
      }
      if (table === 'passengers') {
        return { select: selectPassengers };
      }
      if (table === 'ticket_issuances') {
        return { update, eq: updateEq };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const ensureTicketPdfForOrder = jest.fn().mockResolvedValue({
      doc: { storage_path: 'tickets/order-1/demo-ticket.pdf' },
      issuance: { id: 'issuance-1', pnr: 'DEMO-1001', ticket_number: 'TEST-1001' }
    });
    const sendTicketEmail = jest.fn().mockResolvedValue({ sent: true });

    jest.doMock('../../src/lib/supabase', () => ({
      from,
      storage: {
        from: storageFrom
      }
    }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn()
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail
    }));
    jest.doMock('../../src/config', () => ({
      config: { documentsBucket: 'documents' }
    }));

    const payments = require('../../src/routes/payments');

    await payments.handlePaymentPaidAsync({
      id: 'order-1',
      order_number: 'AV-1001',
      raw_offer_data: { metadata: { dry_run_issue: true, origin_host: 'aviaframe.com' } }
    }, 'pay_test_1');

    expect(ensureTicketPdfForOrder).toHaveBeenCalledWith(expect.objectContaining({
      order: refreshedOrder,
      pnr: expect.stringMatching(/^DEMO-/),
      ticketNumber: expect.stringMatching(/^TEST-/)
    }));
    expect(sendTicketEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'traveler@example.com',
      demoMode: true,
      attachment: expect.objectContaining({
        fileName: 'demo-ticket-AV-1001.pdf'
      })
    }));
    expect(storageFrom).toHaveBeenCalledWith('documents');
  });
});
