/**
 * Admin dashboard E2E against a real Supabase stack.
 * Requires: npx supabase start && node scripts/setup-local-supabase.mjs,
 * and a build made with PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY of that stack.
 * Skipped when .env.test.local is missing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const env: Record<string, string> = {};
if (existsSync('.env.test.local')) {
  for (const line of readFileSync('.env.test.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2];
  }
}
const ready = !!env.SUPABASE_TEST_OWNER_EMAIL;

async function login(page: Page, who: 'OWNER' | 'EDITOR') {
  await page.goto('/admin/login/');
  await page.getByLabel('Email').fill(env[`SUPABASE_TEST_${who}_EMAIL`]);
  await page.getByLabel('Password').fill(env[`SUPABASE_TEST_${who}_PASSWORD`]);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
}

test.describe('admin with Supabase', () => {
  test.skip(!ready, 'local Supabase test accounts not configured');
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 1280, height: 900 } });

  test('rejects bad credentials with a generic message', async ({ page }) => {
    await page.goto('/admin/login/');
    await page.getByLabel('Email').fill(env.SUPABASE_TEST_OWNER_EMAIL);
    await page.getByLabel('Password').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  });

  test('owner signs in, sees all 17 sections, edits a tool and signs out', async ({ page }) => {
    await login(page, 'OWNER');
    await expect(page.locator('aside nav a')).toHaveCount(17);
    await page.locator('aside nav a', { hasText: 'Tools' }).click();
    await page.getByRole('button', { name: 'Edit UUID Generator' }).click();
    const dialog = page.locator('dialog[open]');
    const title = dialog.getByLabel(/^Title/);
    const before = await title.inputValue();
    await title.fill(`${before} (e2e)`);
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Tool saved.')).toBeVisible();
    await expect(page.getByText(`${before} (e2e)`)).toBeVisible();
    // restore
    await page.getByRole('button', { name: `Edit ${before} (e2e)` }).click();
    await page.locator('dialog[open]').getByLabel(/^Title/).fill(before);
    await page.locator('dialog[open]').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Tool saved.').last()).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/admin\/login\/$/);
  });

  test('editor only sees permitted sections', async ({ page }) => {
    await login(page, 'EDITOR');
    const nav = page.locator('aside nav a');
    await expect(nav).toHaveCount(10);
    await expect(nav.filter({ hasText: 'SEO' })).toHaveCount(0);
    await expect(nav.filter({ hasText: 'Activity Logs' })).toHaveCount(0);
    await page.goto('/admin/#ads');
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });
});
