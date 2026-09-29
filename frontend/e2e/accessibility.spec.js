import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seedPublishedForm } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
  ).toEqual([]);
}

for (const path of ['/', '/ozellikler', '/hakkinda', '/giris', '/kayit', '/sifremi-unuttum']) {
  test(`${path} sayfasında WCAG ihlali yok`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}

test.describe('yayınlanan form', () => {
  let slug;

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL });
    ({
      form: { slug },
    } = await seedPublishedForm(request, baseURL));
    await request.dispose();
  });

  test('hata durumu dahil WCAG ihlali yok', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Gönder' }).click();
    await expect(page.getByText('Bu alan zorunludur.').first()).toBeVisible();
    await expectNoViolations(page);
  });

  test('küçük ekranda klavyeyle doldurulabilir', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await page.goto(`/f/${slug}`);
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Ad soyad').focus();
    await page.keyboard.type('Keyboard User');
    await page.keyboard.press('Tab');
    await page.keyboard.type('keys@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page.getByLabel('Formlar')).toBeChecked();

    await page.getByRole('button', { name: 'Gönder' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Yanıtın gönderildi' })).toBeFocused();
  });

  test('varsayılan olarak noindex ile sunulur', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
