const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

describe('Priority 1 - Idempotency & Multi-tenant', () => {
  
  it('should require Idempotency-Key header', async () => {
    const res = await request('http://localhost:3000')
      .post('/api/orders/test/issue')
      .set('Authorization', 'Bearer token')
      .send({ notes: 'test' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_IDEMPOTENCY_KEY');
  });

  it('should reject invalid Idempotency-Key format', async () => {
    const res = await request('http://localhost:3000')
      .post('/api/orders/test/issue')
      .set('Authorization', 'Bearer token')
      .set('Idempotency-Key', 'abc')
      .send({ notes: 'test' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('should reject order with different agency_id', async () => {
    const res = await request('http://localhost:3000')
      .post('/api/orders')
      .set('Authorization', 'Bearer token-agency-1')
      .send({ agency_id: 'agency-2' });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

});
