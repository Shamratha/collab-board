import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

const validUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'secret123',
};

async function registerUser(overrides = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('ada@example.com');
  });

  it('never leaks the password hash', async () => {
    const res = await registerUser();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser();
    const res = await registerUser({ name: 'Someone Else' });
    expect(res.status).toBe(409);
  });

  it('rejects a short password with 400', async () => {
    const res = await registerUser({ password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.z' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const reg = await registerUser();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ada@example.com');
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});
