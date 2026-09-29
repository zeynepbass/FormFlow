import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PDF_BYTES, PNG_BYTES } from '../fixtures.js';
import {
  ORIGIN,
  agentFor,
  createPublishedForm,
  fieldId,
  sampleFields,
  signUp,
  submit,
  useTestApp,
} from '../helpers.js';

const ctx = useTestApp();

describe('rate limiting', () => {
  it('limits repeated login attempts for one email', async () => {
    const { credentials } = await signUp(ctx.app);
    const agent = agentFor(ctx.app);
    const attempt = () =>
      agent.post('/api/auth/login').send({ email: credentials.email, password: 'wrong password' });

    for (let i = 0; i < 5; i += 1) await attempt().expect(401);
    const blocked = await attempt().expect(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.headers.ratelimit).toBeDefined();
  });

  it('limits public submissions per form', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    const answers = { [fieldId('name')]: 'Bot', [fieldId('email')]: 'bot@example.com' };

    for (let i = 0; i < 10; i += 1) await submit(ctx.app, form.slug, answers).expect(201);
    await submit(ctx.app, form.slug, answers).expect(429);
  });
});

describe('malicious uploads', () => {
  async function formWithUpload() {
    const { agent } = await signUp(ctx.app);
    const fileField = { id: fieldId('upload'), type: 'file', label: 'Upload' };
    const form = await createPublishedForm(agent, [sampleFields[0], fileField]);
    const send = (buffer, filename) =>
      request(ctx.app)
        .post(`/api/public/forms/${form.slug}/responses`)
        .set('origin', ORIGIN)
        .field('payload', JSON.stringify({ answers: { [fieldId('name')]: 'A' } }))
        .attach(fileField.id, buffer, filename);
    return { agent, form, send, fileField };
  }

  it('rejects executables, HTML, SVG and disguised files', async () => {
    const { agent, form, send } = await formWithUpload();

    await send(Buffer.from('MZ\x90\x00'), 'setup.exe').expect(415);
    await send(Buffer.from('<script>alert(1)</script>'), 'page.html').expect(415);
    await send(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'),
      'x.svg',
    ).expect(415);
    await send(PDF_BYTES, 'image.png').expect(415);
    await send(PNG_BYTES, 'notes.txt').expect(415);

    const list = await agent.get(`/api/forms/${form.id}/responses`).expect(200);
    expect(list.body.data).toHaveLength(0);
  });

  it('rejects files sent to non-file fields and extra files', async () => {
    const { form, fileField } = await formWithUpload();
    await request(ctx.app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .set('origin', ORIGIN)
      .field('payload', JSON.stringify({ answers: { [fieldId('name')]: 'A' } }))
      .attach(fieldId('name'), PNG_BYTES, 'a.png')
      .expect(400);

    await request(ctx.app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .set('origin', ORIGIN)
      .field('payload', JSON.stringify({ answers: { [fieldId('name')]: 'A' } }))
      .attach(fileField.id, PNG_BYTES, 'a.png')
      .attach(fileField.id, PNG_BYTES, 'b.png')
      .expect(400);
  });
});
