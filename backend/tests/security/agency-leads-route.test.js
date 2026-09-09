const express = require('express');
const request = require('supertest');

const validForm = {
  'Agency Name (EN)': 'Sky Travel',
  'Admin Email': 'manager@skytravel.example',
  'Contact Phone': '+966500000000',
  Subdomain: 'sky-travel',
  Country: 'Saudi Arabia',
  'Commission Rate %': '5',
  'Site Language': 'en',
  'Logo URL': 'https://example.com/logo.png',
  'Primary Color': '#112233',
  'Accent Color': '#445566',
  'Hero Headline': 'Book flights',
  'Hero Subtext': 'Fast and simple',
  'Hero Image URL': 'https://example.com/hero.jpg',
  'About (EN)': 'A travel agency.',
  Address: 'Riyadh',
  'Working Hours (EN)': 'Sun-Thu 09:00-18:00',
  'Google Maps URL': 'https://maps.google.com/?q=Riyadh',
  WhatsApp: '+966500000000',
  'Top Destinations': 'Dubai, UAE',
  'License Number': 'TA-12345',
  'Founded Year': '2020',
  'Supervisor Name': 'Amina Saleh',
  'Consent: Subagency Agreement & Paid Service': 'Agreed',
  'Consent: Personal Data Processing': 'Agreed',
  'Service: Flights': 'Flights'
};

describe('public agency leads endpoint', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function loadRoute({ from, sendAgencyLeadEmail }) {
    jest.doMock('../../src/config', () => ({
      config: {
        agencyLeadRateLimitMax: 5,
        agencyLeadRateLimitWindowMs: 60000,
        agencyLeadRecipients: ['sales@aviaframe.com', 'Km@consolidator.aero']
      }
    }));
    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/services/emailService', () => ({ sendAgencyLeadEmail }));
    jest.doMock('../../src/middleware/requestGuards', () => ({
      createMemoryRateLimiter: () => (req, res, next) => next()
    }));
    const app = express();
    app.use(express.json());
    app.use('/api', require('../../src/routes/agencyLeads'));
    return app;
  }

  test('rejects an incomplete application before it reaches the database', async () => {
    const from = jest.fn();
    const app = loadRoute({ from, sendAgencyLeadEmail: jest.fn() });

    const res = await request(app).post('/api/agency-leads').send({ form: { 'Agency Name (EN)': 'Sky Travel' } });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_APPLICATION');
    expect(from).not.toHaveBeenCalled();
  });

  test('stores a valid application before notifying the sales recipients', async () => {
    const savedLead = {
      id: 'lead-1',
      agency_name: 'Sky Travel',
      supervisor_name: 'Amina Saleh',
      contact_email: 'manager@skytravel.example',
      contact_phone: '+966500000000',
      country: 'Saudi Arabia',
      subdomain: 'sky-travel',
      services: ['Flights'],
      form_data: validForm
    };
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: savedLead, error: null })
    };
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null })
    };
    const from = jest.fn().mockReturnValueOnce(insertChain).mockReturnValueOnce(updateChain);
    const sendAgencyLeadEmail = jest.fn().mockResolvedValue({ sent: true });
    const app = loadRoute({ from, sendAgencyLeadEmail });

    const res = await request(app).post('/api/agency-leads').send({ form: validForm });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ lead_id: 'lead-1', notification_sent: true });
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      agency_name: 'Sky Travel',
      contact_email: 'manager@skytravel.example',
      services: ['Flights']
    }));
    expect(sendAgencyLeadEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: ['sales@aviaframe.com', 'Km@consolidator.aero'],
      lead: savedLead
    }));
    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ notification_status: 'sent' }));
  });
});
