import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PASSWORD, login, uniqueEmail } from './helpers';

test('owner builds, publishes and reviews a form end to end', async ({
  page,
  browser,
  baseURL,
}) => {
  const email = uniqueEmail();

  await test.step('register', async () => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Hi, Ada' })).toBeVisible();
  });

  await test.step('log out and log back in', async () => {
    await page.getByRole('button', { name: /Account menu/ }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await login(page, email);
  });

  await test.step('create a form', async () => {
    await page.getByRole('main').getByRole('link', { name: 'New form' }).first().click();
    await page.getByLabel('Title').fill('Event feedback');
    await page.getByRole('button', { name: 'Create and add fields' }).click();
    await expect(page).toHaveURL(/\/forms\/[a-f0-9]{24}$/);
  });

  await test.step('add and configure fields', async () => {
    const palette = page.getByRole('region', { name: 'Add a field' });

    await palette.getByRole('button', { name: 'Short text' }).click();
    await page.getByLabel('Question').fill('Your name');
    await page.getByRole('checkbox', { name: 'Required' }).check();

    await palette.getByRole('button', { name: 'Email' }).click();
    await page.getByLabel('Question').fill('Email');
    await page.getByRole('checkbox', { name: 'Required' }).check();

    await palette.getByRole('button', { name: 'Checkboxes' }).click();
    await page.getByLabel('Question').fill('What did you enjoy?');
    await page.getByRole('textbox', { name: 'Option 1' }).fill('Talks');
    await page.getByRole('textbox', { name: 'Option 2' }).fill('Workshops');
  });

  await test.step('reorder with the keyboard', async () => {
    const handle = page.getByRole('button', { name: 'Reorder What did you enjoy?' });
    await handle.focus();
    for (const key of ['Space', 'ArrowUp', 'Space']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(250);
    }

    const labels = page.getByRole('list', { name: 'Form fields' }).locator(':scope > li');
    await expect(labels.nth(1)).toContainText('What did you enjoy?');
    await expect(labels.nth(2)).toContainText('Email');
  });

  await test.step('save', async () => {
    await expect(page.getByText('Unsaved changes')).toBeVisible();
    await page.getByRole('button', { name: /^Save/ }).click();
    await expect(page.getByText('All changes saved')).toBeVisible();
  });

  const tabs = page.getByRole('navigation', { name: 'Form sections' });

  await test.step('configure form settings', async () => {
    await tabs.getByRole('link', { name: 'Settings' }).click();
    await page.getByLabel('Submit button label').fill('Send feedback');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('Settings saved.')).toBeVisible();
  });

  await test.step('publish', async () => {
    await tabs.getByRole('link', { name: 'Build' }).click();
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Your form is live.')).toBeVisible();
  });

  const slug = (
    await page
      .getByText(/^\/f\//)
      .first()
      .textContent()
  )
    .replace('/f/', '')
    .trim();

  await test.step('respond as a visitor', async () => {
    const context = await browser.newContext({ baseURL });
    const visitor = await context.newPage();
    await visitor.goto(`/f/${slug}`);
    await expect(visitor.getByRole('heading', { level: 1, name: 'Event feedback' })).toBeVisible();

    await visitor.getByRole('button', { name: 'Send feedback' }).click();
    await expect(visitor.getByText('This field is required.').first()).toBeVisible();
    await expect(visitor.getByLabel('Your name')).toBeFocused();

    await visitor.getByLabel('Your name').fill('Grace Hopper');
    await visitor.getByLabel('Email').fill('grace@example.com');
    await visitor.getByLabel('Workshops').check();
    await visitor.getByRole('button', { name: 'Send feedback' }).click();
    await expect(visitor.getByRole('heading', { name: 'Response sent' })).toBeVisible();
    await context.close();
  });

  await test.step('view the response', async () => {
    await tabs.getByRole('link', { name: 'Responses' }).click();
    await expect(page.getByText('1 response')).toBeVisible();
    await page.getByRole('link', { name: /^View/ }).first().click();
    await expect(page).toHaveURL(/\/responses\/[a-f0-9]{24}$/);
    const detail = page.getByRole('article');
    await expect(detail.getByText('Grace Hopper')).toBeVisible();
    await expect(detail.getByText('Workshops')).toBeVisible();
  });

  await test.step('export CSV', async () => {
    await page.getByRole('link', { name: 'All responses' }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Export CSV' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^${slug}-responses-\\d{4}-\\d{2}-\\d{2}\\.csv$`),
    );
    const csv = await readFile(await download.path(), 'utf8');
    expect(csv).toContain('"Your name","What did you enjoy?","Email"');
    expect(csv).toContain('"Grace Hopper","Workshops","grace@example.com"');
  });
});
