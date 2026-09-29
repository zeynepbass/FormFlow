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

for (const path of ['/', '/features', '/about', '/login', '/register', '/forgot-password']) {
  test(`${path} has no detectable WCAG violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}

test.describe('public form', () => {
  let slug;

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL });
    ({
      form: { slug },
    } = await seedPublishedForm(request, baseURL));
    await request.dispose();
  });

  test('has no detectable WCAG violations, including error state', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('This field is required.').first()).toBeVisible();
    await expectNoViolations(page);
  });

  test('can be completed with the keyboard on a small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await page.goto(`/f/${slug}`);
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Full name').focus();
    await page.keyboard.type('Keyboard User');
    await page.keyboard.press('Tab');
    await page.keyboard.type('keys@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page.getByLabel('Forms')).toBeChecked();

    await page.getByRole('button', { name: 'Submit' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Response sent' })).toBeFocused();
  });

  test('is served with noindex by default', async ({ page }) => {
    await page.goto(`/f/${slug}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
