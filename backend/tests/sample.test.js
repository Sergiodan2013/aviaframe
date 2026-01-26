const request = require('supertest');
const express = require('express');

describe('backend smoke', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
  });

  test('healthz returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});