import { test, expect } from '@playwright/test';

// IMPORTANT: baseURL includes a path (/dreamy-draw-weekly/). Leading slashes would drop the path.
const PATHS = ['', 'rss.xml'];

test.describe('Gate 1 — availability / health', () => {
  for (const path of PATHS) {
    test(`GET ${path} returns 200/304`, async ({ request, baseURL }) => {
      const url = new URL(path, baseURL!).toString();
      const res = await request.get(url, { maxRedirects: 5 });
      expect([200, 304]).toContain(res.status());

      // GitHub Pages should serve HTML for '/', XML for rss/sitemap.
      if (path === '') {
        expect(res.headers()['content-type'] || '').toContain('text/html');
      } else {
        expect(res.headers()['content-type'] || '').toMatch(/xml|text\/plain/);
      }
    });
  }

  test('homepage renders title + main content', async ({ page }) => {
    await page.goto('.', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Dreamy Draw Weekly/i);
    await expect(page.locator('main')).toBeVisible();
  });
});
