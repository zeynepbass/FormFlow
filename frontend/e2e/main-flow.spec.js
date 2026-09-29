import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PASSWORD, login, uniqueEmail } from './helpers';

test('form sahibi formu oluşturur, yayınlar ve yanıtları inceler', async ({
  page,
  browser,
  baseURL,
}) => {
  const email = uniqueEmail();

  await test.step('kayıt ol', async () => {
    await page.goto('/kayit');
    await page.getByLabel('Ad soyad').fill('Ada Lovelace');
    await page.getByLabel('E-posta').fill(email);
    await page.getByLabel('Şifre').fill(PASSWORD);
    await page.getByRole('button', { name: 'Hesap oluştur' }).click();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByRole('heading', { name: 'Merhaba, Ada' })).toBeVisible();
  });

  await test.step('çıkış yap ve tekrar giriş yap', async () => {
    await page.getByRole('button', { name: /hesap menüsü/ }).click();
    await page.getByRole('menuitem', { name: 'Çıkış yap' }).click();
    await expect(page).toHaveURL(/\/giris$/);
    await login(page, email);
  });

  await test.step('form oluştur', async () => {
    await page.getByRole('main').getByRole('link', { name: 'Yeni form' }).first().click();
    await page.getByLabel('Başlık').fill('Etkinlik geri bildirimi');
    await page.getByRole('button', { name: 'Oluştur ve alan ekle' }).click();
    await expect(page).toHaveURL(/\/formlar\/[a-f0-9]{24}$/);
  });

  await test.step('alanları ekle ve düzenle', async () => {
    const palette = page.getByRole('region', { name: 'Alan ekle' });

    await palette.getByRole('button', { name: 'Kısa metin' }).click();
    await page.getByLabel('Soru').fill('Adın');
    await page.getByRole('checkbox', { name: 'Zorunlu' }).check();

    await palette.getByRole('button', { name: 'E-posta' }).click();
    await page.getByLabel('Soru').fill('E-posta');
    await page.getByRole('checkbox', { name: 'Zorunlu' }).check();

    await palette.getByRole('button', { name: 'Çoklu seçim' }).click();
    await page.getByLabel('Soru').fill('Neleri beğendin?');
    await page.getByRole('textbox', { name: 'Seçenek 1' }).fill('Konuşmalar');
    await page.getByRole('textbox', { name: 'Seçenek 2' }).fill('Atölyeler');
  });

  await test.step('klavyeyle sırala', async () => {
    const handle = page.getByRole('button', { name: 'Neleri beğendin? alanını sırala' });
    await handle.focus();
    for (const key of ['Space', 'ArrowUp', 'Space']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(250);
    }

    const fields = page.getByRole('list', { name: 'Form alanları' }).locator(':scope > li');
    await expect(fields.nth(1)).toContainText('Neleri beğendin?');
    await expect(fields.nth(2)).toContainText('E-posta');
  });

  await test.step('kaydet', async () => {
    await expect(page.getByText('Kaydedilmemiş değişiklikler var')).toBeVisible();
    await page.getByRole('button', { name: /^Kaydet/ }).click();
    await expect(page.getByText('Tüm değişiklikler kaydedildi')).toBeVisible();
  });

  const tabs = page.getByRole('navigation', { name: 'Form bölümleri' });

  await test.step('form ayarlarını düzenle', async () => {
    await tabs.getByRole('link', { name: 'Ayarlar' }).click();
    await page.getByLabel('Gönder butonu metni').fill('Geri bildirimi gönder');
    await page.getByRole('button', { name: 'Ayarları kaydet' }).click();
    await expect(page.getByText('Ayarlar kaydedildi.')).toBeVisible();
  });

  await test.step('yayınla', async () => {
    await tabs.getByRole('link', { name: 'Oluştur' }).click();
    await page.getByRole('button', { name: 'Yayınla' }).click();
    await expect(page.getByText('Formun yayında.')).toBeVisible();
  });

  const slug = (
    await page
      .getByText(/^\/f\//)
      .first()
      .textContent()
  )
    .replace('/f/', '')
    .trim();

  await test.step('ziyaretçi olarak yanıt gönder', async () => {
    const context = await browser.newContext({ baseURL });
    const visitor = await context.newPage();
    await visitor.goto(`/f/${slug}`);
    await expect(
      visitor.getByRole('heading', { level: 1, name: 'Etkinlik geri bildirimi' }),
    ).toBeVisible();

    await visitor.getByRole('button', { name: 'Geri bildirimi gönder' }).click();
    await expect(visitor.getByText('Bu alan zorunludur.').first()).toBeVisible();
    await expect(visitor.getByLabel('Adın')).toBeFocused();

    await visitor.getByLabel('Adın').fill('Grace Hopper');
    await visitor.getByLabel('E-posta').fill('grace@example.com');
    await visitor.getByLabel('Atölyeler').check();
    await visitor.getByRole('button', { name: 'Geri bildirimi gönder' }).click();
    await expect(visitor.getByRole('heading', { name: 'Yanıtın gönderildi' })).toBeVisible();
    await context.close();
  });

  await test.step('yanıtı görüntüle', async () => {
    await tabs.getByRole('link', { name: 'Yanıtlar' }).click();
    await expect(page.getByText('1 yanıt')).toBeVisible();
    await page
      .getByRole('link', { name: /^Görüntüle/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/yanitlar\/[a-f0-9]{24}$/);
    const detail = page.getByRole('article');
    await expect(detail.getByText('Grace Hopper')).toBeVisible();
    await expect(detail.getByText('Atölyeler')).toBeVisible();
  });

  await test.step('CSV indir', async () => {
    await page.getByRole('link', { name: 'Tüm yanıtlar' }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'CSV indir' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^${slug}-yanitlar-\\d{4}-\\d{2}-\\d{2}\\.csv$`),
    );
    const csv = await readFile(await download.path(), 'utf8');
    expect(csv).toContain('"Adın","Neleri beğendin?","E-posta"');
    expect(csv).toContain('"Grace Hopper","Atölyeler","grace@example.com"');
  });
});
