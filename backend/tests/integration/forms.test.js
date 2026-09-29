import { describe, expect, it } from 'vitest';
import { createPublishedForm, sampleFields, signUp, useTestApp } from '../helpers.js';

const ctx = useTestApp();

describe('forms', () => {
  it('creates a draft with a generated slug and default settings', async () => {
    const { agent } = await signUp(ctx.app);
    const res = await agent.post('/api/forms').send({ title: 'Event RSVP' }).expect(201);

    expect(res.body.data).toMatchObject({
      title: 'Event RSVP',
      status: 'draft',
      fields: [],
      version: 1,
      responseCount: 0,
      settings: { allowIndexing: false },
    });
    expect(res.body.data.slug).toMatch(/^event-rsvp-[a-z0-9]{4}$/);
    expect(res.body.data.ownerId).toBeUndefined();

    const list = await agent.get('/api/forms').expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ title: 'Event RSVP', fieldCount: 0 });
    expect(list.headers['cache-control']).toBe('private, no-store');
  });

  it('updates fields with optimistic concurrency', async () => {
    const { agent } = await signUp(ctx.app);
    const { body } = await agent.post('/api/forms').send({ title: 'Survey' }).expect(201);
    const id = body.data.id;

    const updated = await agent
      .patch(`/api/forms/${id}`)
      .send({ version: 1, fields: sampleFields, settings: { submitLabel: 'Send' } })
      .expect(200);
    expect(updated.body.data.version).toBe(2);
    expect(updated.body.data.fields).toHaveLength(sampleFields.length);
    expect(updated.body.data.settings).toMatchObject({ submitLabel: 'Send', allowIndexing: false });

    const stale = await agent
      .patch(`/api/forms/${id}`)
      .send({ version: 1, title: 'Old' })
      .expect(409);
    expect(stale.body.error.code).toBe('CONFLICT');
  });

  it('updates the slug and rejects taken slugs', async () => {
    const { agent } = await signUp(ctx.app);
    const a = (await agent.post('/api/forms').send({ title: 'A' })).body.data;
    const b = (await agent.post('/api/forms').send({ title: 'B' })).body.data;

    await agent.patch(`/api/forms/${a.id}`).send({ version: 1, slug: 'contact-us' }).expect(200);
    await agent.patch(`/api/forms/${b.id}`).send({ version: 1, slug: 'contact-us' }).expect(409);
    await agent.patch(`/api/forms/${b.id}`).send({ version: 1, slug: 'Bad Slug' }).expect(400);
  });

  it('moves through the status lifecycle', async () => {
    const { agent } = await signUp(ctx.app);
    const { body } = await agent.post('/api/forms').send({ title: 'Lifecycle' });
    const id = body.data.id;

    const empty = await agent.post(`/api/forms/${id}/publish`).expect(409);
    expect(empty.body.error.details[0].path).toBe('fields');

    await agent.patch(`/api/forms/${id}`).send({ version: 1, fields: sampleFields }).expect(200);
    const published = await agent.post(`/api/forms/${id}/publish`).expect(200);
    expect(published.body.data.status).toBe('published');
    expect(published.body.data.publishedAt).toBeTruthy();

    await agent.post(`/api/forms/${id}/pause`).expect(200);
    await agent.post(`/api/forms/${id}/pause`).expect(409);
    await agent.post(`/api/forms/${id}/publish`).expect(200);
    await agent.post(`/api/forms/${id}/archive`).expect(200);
    await agent.post(`/api/forms/${id}/publish`).expect(409);
    const restored = await agent.post(`/api/forms/${id}/restore`).expect(200);
    expect(restored.body.data.status).toBe('draft');

    const archivedOnly = await agent.get('/api/forms?status=archived').expect(200);
    expect(archivedOnly.body.data).toHaveLength(0);
  });

  it('keeps the content version stable across status changes', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    await agent.post(`/api/forms/${form.id}/pause`).expect(200);

    const res = await agent
      .patch(`/api/forms/${form.id}`)
      .send({ version: form.version, title: 'Still editable' })
      .expect(200);
    expect(res.body.data.version).toBe(form.version + 1);
  });

  it('duplicates a form as a new draft', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    const copy = await agent.post(`/api/forms/${form.id}/duplicate`).expect(201);

    expect(copy.body.data).toMatchObject({
      title: 'Contact form (kopya)',
      status: 'draft',
      responseCount: 0,
    });
    expect(copy.body.data.slug).not.toBe(form.slug);
    expect(copy.body.data.fields).toEqual(form.fields);
  });

  it('deletes a form together with its responses', async () => {
    const { agent } = await signUp(ctx.app);
    const form = await createPublishedForm(agent);
    await agent.delete(`/api/forms/${form.id}`).expect(204);
    await agent.get(`/api/forms/${form.id}`).expect(404);
    await agent.get(`/api/public/forms/${form.slug}`).expect(404);
  });

  it('returns 404 for malformed ids', async () => {
    const { agent } = await signUp(ctx.app);
    await agent.get('/api/forms/not-an-id').expect(404);
    await agent.get('/api/forms/000000000000000000000000').expect(404);
  });
});
