import { expect } from '@playwright/test';

export const PASSWORD = 'correct horse battery';

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export async function login(page, email, password = PASSWORD) {
  await page.goto('/giris');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill(password);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page).toHaveURL(/\/panel$/);
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
      data: { name: 'Test Kullanıcısı', email, password: PASSWORD },
    });
    expect(registered.ok()).toBe(true);
  }
  const created = await request.post('/api/forms', {
    headers,
    data: { title: 'Erişilebilirlik kontrolü' },
  });
  const form = (await created.json()).data;

  await request.patch(`/api/forms/${form.id}`, {
    headers,
    data: {
      version: form.version,
      description: 'Otomatik kontrollerde kullanılan form.',
      fields: [
        { id: 'fld_nameaaaaaa', type: 'short_text', label: 'Ad soyad', required: true },
        { id: 'fld_mailaaaaaa', type: 'email', label: 'E-posta', required: true },
        {
          id: 'fld_sizeaaaaaa',
          type: 'select',
          label: 'Ekip büyüklüğü',
          options: [
            { id: 'opt_smallaaa', label: '1–5' },
            { id: 'opt_largeaaa', label: '6 veya daha fazla' },
          ],
        },
        {
          id: 'fld_likeaaaaaa',
          type: 'checkbox',
          label: 'Neler kullanıyorsun?',
          options: [
            { id: 'opt_formsaaa', label: 'Formlar' },
            { id: 'opt_surveyaa', label: 'Anketler' },
          ],
        },
        { id: 'fld_dateaaaaaa', type: 'date', label: 'Başlangıç tarihi' },
      ],
    },
  });
  await request.post(`/api/forms/${form.id}/publish`, { headers });
  return { form, email };
}
