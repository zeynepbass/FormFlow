import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ORIGIN, createPublishedForm, fieldId, signUp, submit, useTestApp } from '../helpers.js';

const ctx = useTestApp();

async function twoUsersWithForm() {
  const owner = await signUp(ctx.app);
  const intruder = await signUp(ctx.app);
  const form = await createPublishedForm(owner.agent);
  await submit(ctx.app, form.slug, {
    [fieldId('name')]: 'Private person',
    [fieldId('email')]: 'private@example.com',
  }).expect(201);
  const [response] = (await owner.agent.get(`/api/forms/${form.id}/responses`)).body.data;
  return { owner, intruder, form, response };
}

describe('IDOR / BOLA', () => {
  it("returns 404 for every endpoint on another user's form", async () => {
    const { intruder, form, response } = await twoUsersWithForm();
    const a = intruder.agent;
    const base = `/api/forms/${form.id}`;

    await a.get(base).expect(404);
    await a.patch(base).send({ version: form.version, title: 'Hacked' }).expect(404);
    await a.post(`${base}/duplicate`).expect(404);
    await a.post(`${base}/pause`).expect(404);
    await a.post(`${base}/archive`).expect(404);
    await a.get(`${base}/responses`).expect(404);
    await a.get(`${base}/responses/${response.id}`).expect(404);
    await a.delete(`${base}/responses/${response.id}`).expect(404);
    await a.get(`${base}/export`).expect(404);
    await a.get(`${base}/analytics`).expect(404);
    await a.delete(base).expect(404);
  });

  it('leaves the victim data unchanged after attempted tampering', async () => {
    const { owner, intruder, form } = await twoUsersWithForm();
    await intruder.agent.patch(`/api/forms/${form.id}`).send({ version: form.version, title: 'X' });
    await intruder.agent.delete(`/api/forms/${form.id}`);

    const check = await owner.agent.get(`/api/forms/${form.id}`).expect(200);
    expect(check.body.data.title).toBe('Contact form');
    expect(check.body.data.responseCount).toBe(1);
  });

  it("cannot read a response through the intruder's own form id", async () => {
    const { intruder, response } = await twoUsersWithForm();
    const own = (await intruder.agent.post('/api/forms').send({ title: 'Mine' })).body.data;
    await intruder.agent.get(`/api/forms/${own.id}/responses/${response.id}`).expect(404);
    await intruder.agent.delete(`/api/forms/${own.id}/responses/${response.id}`).expect(404);
  });

  it('does not list forms that belong to someone else', async () => {
    const { intruder } = await twoUsersWithForm();
    const list = await intruder.agent.get('/api/forms').expect(200);
    expect(list.body.data).toEqual([]);
  });
});

describe('authentication', () => {
  it('rejects anonymous, forged and revoked sessions', async () => {
    const anon = request(ctx.app);
    await anon.get('/api/forms').expect(401);
    await anon.get('/api/forms').set('cookie', 'formflow_session=forged-token-value').expect(401);
    await anon.get('/api/forms').set('cookie', 'formflow_session[$ne]=x').expect(401);

    const { agent } = await signUp(ctx.app);
    const res = await agent.post('/api/auth/logout').expect(204);
    expect(res.headers['set-cookie'][0]).toMatch(/formflow_session=;/);
    await agent.get('/api/forms').expect(401);
  });
});

describe('input hardening', () => {
  it('rejects mass assignment of protected fields', async () => {
    const { agent } = await signUp(ctx.app);
    const form = (await agent.post('/api/forms').send({ title: 'A' })).body.data;

    for (const payload of [
      { version: 1, ownerId: '000000000000000000000000' },
      { version: 1, status: 'published' },
      { version: 1, responseCount: 999 },
    ]) {
      await agent.patch(`/api/forms/${form.id}`).send(payload).expect(400);
    }
    await agent.post('/api/forms').send({ title: 'B', status: 'published' }).expect(400);
  });

  it('rejects MongoDB operator payloads', async () => {
    const { credentials } = await signUp(ctx.app);
    const anon = request(ctx.app);
    await anon
      .post('/api/auth/login')
      .set('origin', ORIGIN)
      .send({ email: { $ne: null }, password: { $ne: null } })
      .expect(400);
    await anon
      .post('/api/auth/login')
      .set('origin', ORIGIN)
      .send({ email: credentials.email, password: { $gt: '' } })
      .expect(400);
    await anon.get('/api/public/forms/%7B%22%24ne%22%3Anull%7D').expect(404);
  });

  it('stores XSS payloads as inert text', async () => {
    const { agent } = await signUp(ctx.app);
    const payload = '<img src=x onerror=alert(1)>';
    const form = (await agent.post('/api/forms').send({ title: payload })).body.data;
    expect(form.title).toBe(payload);

    const res = await agent.get(`/api/forms/${form.id}`).expect(200);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it('rejects malformed and oversized bodies', async () => {
    const { agent } = await signUp(ctx.app);
    const malformed = await agent
      .post('/api/forms')
      .set('content-type', 'application/json')
      .send('{"title": ')
      .expect(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');

    const huge = await agent
      .post('/api/forms')
      .send({ title: 'x'.repeat(200 * 1024) })
      .expect(413);
    expect(huge.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('does not leak internals on unexpected input', async () => {
    const { agent } = await signUp(ctx.app);
    const res = await agent.get('/api/forms/zzzzzzzzzzzzzzzzzzzzzzzz').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });
});

describe('CSRF', () => {
  it('blocks state-changing requests from other origins', async () => {
    const { agent } = await signUp(ctx.app);
    await agent
      .post('/api/forms')
      .set('origin', 'https://evil.example')
      .send({ title: 'x' })
      .expect(403);
    await agent
      .post('/api/forms')
      .set('origin', ORIGIN)
      .set('sec-fetch-site', 'cross-site')
      .send({ title: 'x' })
      .expect(403);
    await agent.post('/api/forms').send({ title: 'ok' }).expect(201);
  });
});
