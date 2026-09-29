import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, getDb } from '../src/database/client.js';
import { ensureIndexes } from '../src/database/indexes.js';

export const ORIGIN = 'http://localhost:3000';

let counter = 0;

export function uniqueEmail() {
  counter += 1;
  return `user${Date.now()}${counter}@example.com`;
}

export function fieldId(suffix) {
  return `fld_${suffix.padEnd(10, '0').slice(0, 10)}`;
}

export function optionId(suffix) {
  return `opt_${suffix.padEnd(8, '0').slice(0, 8)}`;
}

export function useTestApp() {
  const context = {};

  beforeAll(async () => {
    await connectDatabase();
    await ensureIndexes();
  });

  beforeEach(async () => {
    const collections = await getDb().collections();
    await Promise.all(collections.map((item) => item.deleteMany({})));
    context.app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  return context;
}

export function agentFor(app) {
  const agent = request.agent(app);
  agent.set('origin', ORIGIN);
  return agent;
}

export async function signUp(app, overrides = {}) {
  const agent = agentFor(app);
  const credentials = {
    name: 'Test User',
    email: uniqueEmail(),
    password: 'correct horse battery',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(credentials).expect(201);
  return { agent, user: res.body.data, credentials };
}

export const sampleFields = [
  {
    id: fieldId('name'),
    type: 'short_text',
    label: 'Your name',
    required: true,
  },
  {
    id: fieldId('email'),
    type: 'email',
    label: 'Email',
    required: true,
  },
  {
    id: fieldId('topic'),
    type: 'radio',
    label: 'Topic',
    options: [
      { id: optionId('sales'), label: 'Sales' },
      { id: optionId('support'), label: 'Support' },
    ],
  },
  {
    id: fieldId('message'),
    type: 'long_text',
    label: 'Message',
  },
];

export async function createPublishedForm(agent, fields = sampleFields) {
  const created = await agent.post('/api/forms').send({ title: 'Contact form' }).expect(201);
  const form = created.body.data;
  await agent.patch(`/api/forms/${form.id}`).send({ version: form.version, fields }).expect(200);
  const published = await agent.post(`/api/forms/${form.id}/publish`).expect(200);
  return published.body.data;
}

export function submit(app, slug, answers, extra = {}) {
  return request(app)
    .post(`/api/public/forms/${slug}/responses`)
    .set('origin', ORIGIN)
    .send({ answers, ...extra });
}
