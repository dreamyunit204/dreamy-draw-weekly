import { test, expect } from '@playwright/test';

test.describe('Gate 1 — assets + mobile responsiveness', () => {
  test('no failed network requests on homepage', async ({ page }) => {
    const failed: Array<{ url: string; status?: number; failure?: string }> = [];

    page.on('response', async (res) => {
      const url = res.url();
      // Only track first-party assets/pages
      if (!url.includes('dreamyunit204.github.io')) return;
      const status = res.status();
      if (status >= 400) failed.push({ url, status });
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      if (!url.includes('dreamyunit204.github.io')) return;
      failed.push({ url, failure: req.failure()?.errorText });
    });

    await page.goto('.', { waitUntil: 'networkidle' });

    expect(failed, `Failed requests: ${JSON.stringify(failed, null, 2)}`).toEqual([]);
  });

  test('layout is usable on mobile viewport (main visible, no horizontal scroll)', async ({ page }) => {
    // This test runs in the chromium-mobile project as well.
    await page.goto('.', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const hasHScroll = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(hasHScroll).toBeFalsy();
  });
});
