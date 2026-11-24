import { expect, test, type Page } from '@playwright/test';

/** Navigate and wait until every React island has hydrated (Astro removes the `ssr` attribute). */
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, null, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}
const main = (page: Page) => page.locator('#main');

const onePagePdf = () =>
  Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
  );

test.describe('public site', () => {
  test('homepage renders with SEO metadata and no heavy tool libraries', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });
    await open(page, '/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle(/Free Online Tools/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
    expect(scripts.filter((s) => /pdf|jszip|qrcode|exifr/i.test(s))).toEqual([]);
  });

  test('search suggests and opens a tool with the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'header search is in the mobile menu');
    await open(page, '/');
    const input = main(page).getByRole('combobox');
    await input.click();
    await input.fill('merge pdf');
    await expect(main(page).getByRole('option').first()).toContainText(/Merge PDF/i);
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/tools\/pdf-merge\/$/);
  });

  test('category navigation', async ({ page }) => {
    await open(page, '/categories/');
    await main(page).getByRole('link', { name: /PDF Tools/ }).first().click();
    await expect(page.locator('h1')).toHaveText(/PDF Tools/);
    await expect(main(page).getByRole('link', { name: 'Merge PDF', exact: true })).toBeVisible();
  });

  test('text tool executes', async ({ page }) => {
    await open(page, '/tools/word-counter/');
    await page.getByLabel('Input').fill('One two three. Four five!');
    await expect(main(page).locator('div.rounded-lg', { hasText: /^Words/ }).first()).toContainText('5');
  });

  test('JSON formatter validates and formats, with a download', async ({ page }) => {
    await open(page, '/tools/json-formatter/');
    const btn = page.getByRole('button', { name: 'Format / Validate' });
    await expect(async () => {
      await page.getByLabel('Input').fill('{"b":1,"a":2}');
      await expect(btn).toBeEnabled({ timeout: 1000 });
    }).toPass();
    await btn.click();
    await expect(page.getByText('Valid JSON ✓')).toBeVisible();
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    expect((await dl).suggestedFilename()).toBe('formatted.json');
  });

  test('file tool processes a PDF locally (no upload request)', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET') posts.push(r.url());
    });
    await open(page, '/tools/pdf-page-counter/');
    await page.locator('input[type=file]').setInputFiles({ name: 'one.pdf', mimeType: 'application/pdf', buffer: onePagePdf() });
    await expect(page.locator('tfoot')).toContainText('1');
    expect(posts).toEqual([]);
  });

  test('invalid file is rejected by signature', async ({ page }) => {
    await open(page, '/tools/pdf-merge/');
    await page.locator('input[type=file]').setInputFiles({ name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('hello') });
    await expect(page.getByRole('alert')).toContainText(/not a supported file/);
  });

  test('French and Arabic (RTL) versions', async ({ page }) => {
    await page.goto('/fr/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await page.goto('/ar/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.goto('/ar/tools/word-counter/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/); // untranslated guide
  });

  test('mobile navigation menu opens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.locator('summary[aria-label="Menu"]').click();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
  });

  test('robots.txt, sitemap and security headers', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toMatch(/Disallow: \/admin/);
    const sm = await request.get('/sitemap.xml');
    expect(await sm.text()).toContain('/tools/image-compressor/');
    const home = await request.get('/');
    expect(home.headers()['x-content-type-options']).toBe('nosniff');
    expect(home.headers()['x-frame-options']).toBe('DENY');
    expect(home.headers()['content-security-policy']).toMatch(/object-src 'none'/);
  });

  test('keyboard: skip link and visible focus', async ({ page, isMobile }) => {
    test.skip(isMobile);
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });

  test('no CSP violations on key pages', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) violations.push(m.text());
    });
    for (const u of ['/', '/ar/', '/tools/image-compressor/', '/tools/pdf-to-images/', '/admin/login/']) await open(page, u);
    expect(violations).toEqual([]);
  });
});

test.describe('admin access control', () => {
  test('admin pages are noindex and never public', async ({ page }) => {
    const res = await page.goto('/admin/');
    expect(res?.headers()['x-robots-tag']).toMatch(/noindex/);
    expect(res?.headers()['cache-control']).toMatch(/no-store/);
    await expect(page.locator('body')).toContainText(/(not configured|Checking your session|Sign in)/i);
  });
  test('login form shows a generic error for bad credentials', async ({ page }) => {
    test.skip(!process.env.PUBLIC_SUPABASE_URL, 'requires a configured Supabase project');
    await open(page, '/admin/login/');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  });
});
