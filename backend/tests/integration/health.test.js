import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('health endpoint', () => {
  it('returns ok when database is connected', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
      timestamp: expect.any(String),
      env: expect.any(String),
    });
  });
});
