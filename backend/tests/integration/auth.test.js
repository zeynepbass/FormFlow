import { describe, expect, it, vi } from 'vitest';
import { mailer } from '../../src/common/utils/mailer.js';
import { agentFor, signUp, uniqueEmail, useTestApp } from '../helpers.js';

const ctx = useTestApp();

function lastLinkToken() {
  const { text } = mailer.send.mock.lastCall[0];
  return new URL(text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');
}

describe('auth', () => {
  it('registers a user, sets an httpOnly session cookie and never returns the hash', async () => {
    const agent = agentFor(ctx.app);
    const res = await agent
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'Ada@Example.com', password: 'long enough pass' })
      .expect(201);

    expect(res.body.data).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      emailVerified: false,
    });
    expect(res.body.data.passwordHash).toBeUndefined();

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/formflow_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.data.email).toBe('ada@example.com');
  });

  it('rejects duplicate emails and weak input', async () => {
    const { credentials } = await signUp(ctx.app);
    const agent = agentFor(ctx.app);
    await agent.post('/api/auth/register').send(credentials).expect(409);

    const invalid = await agent
      .post('/api/auth/register')
      .send({ name: '', email: 'nope', password: 'short' })
      .expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalid.body.error.details.map((d) => d.path).sort()).toEqual([
      'email',
      'name',
      'password',
    ]);
  });

  it('logs in and out', async () => {
    const { credentials } = await signUp(ctx.app);
    const agent = agentFor(ctx.app);

    const wrong = await agent
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong password' })
      .expect(401);
    expect(wrong.body.error.message).toBe('Email or password is incorrect.');

    const unknown = await agent
      .post('/api/auth/login')
      .send({ email: uniqueEmail(), password: 'whatever pass' })
      .expect(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);

    await agent
      .post('/api/auth/login')
      .send({ email: credentials.email.toUpperCase(), password: credentials.password })
      .expect(200);
    await agent.get('/api/auth/me').expect(200);

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('verifies email with a single-use token', async () => {
    const send = vi.spyOn(mailer, 'send');
    const { agent } = await signUp(ctx.app);
    const token = lastLinkToken();

    await agent.post('/api/auth/verify-email').send({ token }).expect(200);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.data.emailVerified).toBe(true);

    await agent.post('/api/auth/verify-email').send({ token }).expect(400);
    send.mockRestore();
  });

  it('resets the password and revokes existing sessions', async () => {
    const send = vi.spyOn(mailer, 'send');
    const { agent, credentials } = await signUp(ctx.app);

    const anon = agentFor(ctx.app);
    const missing = await anon
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail() })
      .expect(202);
    const existing = await anon
      .post('/api/auth/forgot-password')
      .send({ email: credentials.email })
      .expect(202);
    expect(missing.body).toEqual(existing.body);

    const token = lastLinkToken();
    await anon
      .post('/api/auth/reset-password')
      .send({ token, password: 'brand new password' })
      .expect(200);

    await agent.get('/api/auth/me').expect(401);
    await anon
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'brand new password' })
      .expect(200);
    await anon
      .post('/api/auth/reset-password')
      .send({ token, password: 'another password' })
      .expect(400);
    send.mockRestore();
  });

  it('changes password and keeps the current device signed in', async () => {
    const { agent, credentials } = await signUp(ctx.app);
    const other = agentFor(ctx.app);
    await other
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    await agent
      .patch('/api/users/me/password')
      .send({ currentPassword: 'wrong', newPassword: 'new password 123' })
      .expect(400);
    await agent
      .patch('/api/users/me/password')
      .send({ currentPassword: credentials.password, newPassword: 'new password 123' })
      .expect(200);

    await agent.get('/api/auth/me').expect(200);
    await other.get('/api/auth/me').expect(401);
  });

  it('deletes the account with its forms', async () => {
    const { agent, credentials } = await signUp(ctx.app);
    await agent.post('/api/forms').send({ title: 'Mine' }).expect(201);
    await agent.delete('/api/users/me').send({ password: credentials.password }).expect(204);
    await agent.get('/api/auth/me').expect(401);
    await agentFor(ctx.app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(401);
  });
});
