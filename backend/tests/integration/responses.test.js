import { ObjectId } from 'mongodb';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getDb } from '../../src/database/client.js';
import { PDF_BYTES, PNG_BYTES } from '../fixtures.js';
import {
  ORIGIN,
  createPublishedForm,
  fieldId,
  optionId,
  sampleFields,
  signUp,
  submit,
  useTestApp,
} from '../helpers.js';

const ctx = useTestApp();

const validAnswers = (overrides = {}) => ({
  [fieldId('name')]: 'Ada Lovelace',
  [fieldId('email')]: 'ada@example.com',
  [fieldId('topic')]: optionId('support'),
  [fieldId('message')]: 'Hello there',
  ...overrides,
});

describe('public form', () => {
  it('exposes published forms without owner data', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);

    const res = await request(ctx.app).get(`/api/public/forms/${form.slug}`).expect(200);
    expect(res.body.data).toMatchObject({ slug: form.slug, status: 'published' });
    expect(res.body.data.ownerId).toBeUndefined();
    expect(res.body.data.responseCount).toBeUndefined();
    expect(res.body.data.fields).toHaveLength(sampleFields.length);
  });

  it('hides drafts and archived forms', async () => {
    const { agent } = await signUp(ctx.app);
    const draft = (await agent.post('/api/forms').send({ title: 'Draft' })).body.data;
    await request(ctx.app).get(`/api/public/forms/${draft.slug}`).expect(404);

    const form = await createPublishedForm(agent);
    await agent.post(`/api/forms/${form.id}/archive`).expect(200);
    await request(ctx.app).get(`/api/public/forms/${form.slug}`).expect(404);
  });
});

describe('submissions', () => {
  it('stores a valid submission and increments the counter', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);

    const res = await submit(ctx.app, form.slug, validAnswers()).expect(201);
    expect(res.body.data.message).toBe(form.settings.successMessage);

    const list = await agent.get(`/api/forms/${form.id}/responses`).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].answers).toEqual({
      [fieldId('name')]: 'Ada Lovelace',
      [fieldId('email')]: 'ada@example.com',
      [fieldId('topic')]: 'Support',
      [fieldId('message')]: 'Hello there',
    });

    const detail = await agent
      .get(`/api/forms/${form.id}/responses/${list.body.data[0].id}`)
      .expect(200);
    expect(detail.body.data.createdAt).toBeTruthy();

    const updated = await agent.get(`/api/forms/${form.id}`).expect(200);
    expect(updated.body.data.responseCount).toBe(1);
  });

  it('returns field-level errors', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);

    const res = await submit(ctx.app, form.slug, {
      [fieldId('email')]: 'not an email',
      [fieldId('topic')]: 'opt_missing0',
    }).expect(400);

    expect(res.body.error.details.map((d) => d.path).sort()).toEqual(
      [fieldId('email'), fieldId('name'), fieldId('topic')].sort(),
    );
  });

  it('rejects submissions to paused forms', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    await agent.post(`/api/forms/${form.id}/pause`).expect(200);

    const res = await submit(ctx.app, form.slug, validAnswers()).expect(409);
    expect(res.body.error.code).toBe('FORM_CLOSED');
  });

  it('accepts honeypot submissions silently without storing them', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);

    await submit(ctx.app, form.slug, validAnswers(), { website: 'http://spam.example' }).expect(
      201,
    );
    const list = await agent.get(`/api/forms/${form.id}/responses`).expect(200);
    expect(list.body.data).toHaveLength(0);
  });

  it('stores uploaded files and serves them only as attachments', async () => {
    const { agent } = await signUp(ctx.app);
    const fileField = { id: fieldId('resume'), type: 'file', label: 'Resume', required: true };
    const form = await createPublishedForm(agent, [...sampleFields, fileField]);

    await request(ctx.app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .set('origin', ORIGIN)
      .field('payload', JSON.stringify({ answers: validAnswers() }))
      .attach(fileField.id, PDF_BYTES, { filename: '../My CV.pdf', contentType: 'image/png' })
      .expect(201);

    const list = await agent.get(`/api/forms/${form.id}/responses`).expect(200);
    const file = list.body.data[0].answers[fileField.id];
    expect(file).toMatchObject({ name: 'My CV.pdf', mimeType: 'application/pdf' });
    expect(file.key).toBeUndefined();

    const download = await agent
      .get(`/api/forms/${form.id}/responses/${list.body.data[0].id}/files/${file.fileId}`)
      .expect(200);
    expect(download.headers['content-disposition']).toMatch(/^attachment;/);
    expect(download.headers['content-type']).toBe('application/pdf');
    expect(download.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects oversized uploads', async () => {
    const { agent } = await signUp(ctx.app);
    const fileField = { id: fieldId('photo'), type: 'file', label: 'Photo' };
    const form = await createPublishedForm(agent, [fileField]);

    const big = Buffer.concat([PNG_BYTES, Buffer.alloc(6 * 1024 * 1024)]);
    await request(ctx.app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .set('origin', ORIGIN)
      .field('payload', JSON.stringify({ answers: {} }))
      .attach(fileField.id, big, 'photo.png')
      .expect(413);
  });
});

describe('response dashboard', () => {
  async function seed(count) {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    const base = Date.UTC(2026, 0, 1);
    const docs = Array.from({ length: count }, (_, index) => ({
      formId: new ObjectId(form.id),
      ownerId: null,
      answers: {
        [fieldId('name')]: index % 2 === 0 ? `Even person ${index}` : `Odd person ${index}`,
      },
      searchText: index % 2 === 0 ? `Even person ${index}` : `Odd person ${index}`,
      createdAt: new Date(base + index * 24 * 60 * 60 * 1000),
    }));
    const owner = await getDb()
      .collection('forms')
      .findOne({ _id: new ObjectId(form.id) });
    docs.forEach((doc) => (doc.ownerId = owner.ownerId));
    await getDb().collection('responses').insertMany(docs);
    return { agent, form };
  }

  it('paginates with cursors in both directions', async () => {
    const { agent, form } = await seed(7);
    const url = `/api/forms/${form.id}/responses`;

    const first = await agent.get(url).query({ limit: 3 }).expect(200);
    expect(first.body.meta).toMatchObject({ total: 7, prevCursor: null });
    expect(first.body.data.map((r) => r.answers[fieldId('name')])).toEqual([
      'Even person 6',
      'Odd person 5',
      'Even person 4',
    ]);

    const second = await agent.get(url).query({ limit: 3, cursor: first.body.meta.nextCursor });
    const third = await agent.get(url).query({ limit: 3, cursor: second.body.meta.nextCursor });
    expect(third.body.data).toHaveLength(1);
    expect(third.body.meta.nextCursor).toBeNull();

    const back = await agent
      .get(url)
      .query({ limit: 3, cursor: second.body.meta.prevCursor, dir: 'prev' })
      .expect(200);
    expect(back.body.data).toEqual(first.body.data);
    expect(back.body.meta.prevCursor).toBeNull();

    await agent.get(url).query({ cursor: 'garbage' }).expect(400);
  });

  it('filters by search text and date range', async () => {
    const { agent, form } = await seed(6);
    const url = `/api/forms/${form.id}/responses`;

    const search = await agent.get(url).query({ q: 'odd' }).expect(200);
    expect(search.body.meta.total).toBe(3);

    const range = await agent.get(url).query({ from: '2026-01-02', to: '2026-01-03' }).expect(200);
    expect(range.body.meta.total).toBe(2);

    await agent.get(url).query({ from: '2026-02-01', to: '2026-01-01' }).expect(400);
  });

  it('deletes a response', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    await submit(ctx.app, form.slug, validAnswers()).expect(201);
    const [response] = (await agent.get(`/api/forms/${form.id}/responses`)).body.data;

    await agent.delete(`/api/forms/${form.id}/responses/${response.id}`).expect(204);
    await agent.get(`/api/forms/${form.id}/responses/${response.id}`).expect(404);
    expect((await agent.get(`/api/forms/${form.id}`)).body.data.responseCount).toBe(0);
  });
});

describe('csv export', () => {
  it('streams a CSV with a header row and neutralized formulas', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    await submit(
      ctx.app,
      form.slug,
      validAnswers({ [fieldId('name')]: '=HYPERLINK("http://evil")' }),
    ).expect(201);

    const res = await agent.get(`/api/forms/${form.id}/export`).buffer(true).expect(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toMatch(
      new RegExp(`attachment; filename="${form.slug}-yanitlar-\\d{4}-\\d{2}-\\d{2}\\.csv"`),
    );

    const [header, row] = res.text
      .replace(/^\uFEFF/, '')
      .trim()
      .split('\r\n');
    expect(header).toBe('"Gönderim zamanı","Yanıt ID","Your name","Email","Topic","Message"');
    expect(row).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(row).toContain('"Support"');
  });
});

describe('analytics', () => {
  it('counts unique views and starts and computes rates', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    const event = (type, visitorId) =>
      request(ctx.app)
        .post(`/api/public/forms/${form.slug}/events`)
        .set('origin', ORIGIN)
        .send({ type, visitorId });

    await event('view', 'visitor-aaaaaaaaaaaa').expect(202);
    await event('view', 'visitor-aaaaaaaaaaaa').expect(202);
    await event('view', 'visitor-bbbbbbbbbbbb').expect(202);
    await event('start', 'visitor-aaaaaaaaaaaa').expect(202);
    await event('submit', 'visitor-aaaaaaaaaaaa').expect(400);
    await submit(ctx.app, form.slug, validAnswers(), { visitorId: 'visitor-aaaaaaaaaaaa' }).expect(
      201,
    );

    const res = await agent.get(`/api/forms/${form.id}/analytics?range=7d`).expect(200);
    expect(res.body.data.totals).toEqual({
      views: 2,
      starts: 1,
      submissions: 1,
      completionRate: 100,
      conversionRate: 50,
    });
    expect(res.body.data.daily).toHaveLength(7);
    expect(res.body.data.daily.at(-1)).toMatchObject({ views: 2, starts: 1, submissions: 1 });
  });
});
