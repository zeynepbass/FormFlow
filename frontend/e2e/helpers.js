import { expect } from '@playwright/test';

export const PASSWORD = 'correct horse battery';

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export async function login(page, email, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function seedPublishedForm(request, baseURL) {
  const headers = { origin: new URL(baseURL).origin };
  const email = 'seed-user@example.com';

  const signedIn = await request.post('/api/auth/login', {
    headers,
    data: { email, password: PASSWORD },
  });
  if (!signedIn.ok()) {
    const registered = await request.post('/api/auth/register', {
      headers,
      data: { name: 'Seed User', email, password: PASSWORD },
    });
    expect(registered.ok()).toBe(true);
  }
  const created = await request.post('/api/forms', {
    headers,
    data: { title: 'Accessibility check' },
  });
  const form = (await created.json()).data;

  await request.patch(`/api/forms/${form.id}`, {
    headers,
    data: {
      version: form.version,
      description: 'A form used by automated checks.',
      fields: [
        { id: 'fld_nameaaaaaa', type: 'short_text', label: 'Full name', required: true },
        { id: 'fld_mailaaaaaa', type: 'email', label: 'Email', required: true },
        {
          id: 'fld_sizeaaaaaa',
          type: 'select',
          label: 'Team size',
          options: [
            { id: 'opt_smallaaa', label: '1–5' },
            { id: 'opt_largeaaa', label: '6 or more' },
          ],
        },
        {
          id: 'fld_likeaaaaaa',
          type: 'checkbox',
          label: 'What do you use?',
          options: [
            { id: 'opt_formsaaa', label: 'Forms' },
            { id: 'opt_surveyaa', label: 'Surveys' },
          ],
        },
        { id: 'fld_dateaaaaaa', type: 'date', label: 'Start date' },
      ],
    },
  });
  await request.post(`/api/forms/${form.id}/publish`, { headers });
  return { form, email };
}
