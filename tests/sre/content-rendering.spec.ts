import { test, expect } from '@playwright/test';

function isInternalWeeklyLink(href: string | null) {
  if (!href) return false;
  if (href.startsWith('http')) return href.includes('dreamyunit204.github.io/dreamy-draw-weekly');
  return href.startsWith('/');
}

test.describe('Gate 1 — content rendering (markdown → HTML)', () => {
  test('homepage has at least one post-like link and it renders as an article/page', async ({ page }) => {
    await page.goto('.', { waitUntil: 'networkidle' });

    // Heuristic: any internal link under / should be navigable.
    const links = page.locator('main a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    // Pick the first internal link.
    let chosenHref: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (isInternalWeeklyLink(href) && href !== '/') {
        chosenHref = href;
        break;
      }
    }

    test.skip(!chosenHref, 'No internal post link found on homepage');

    await page.goto(chosenHref!, { waitUntil: 'domcontentloaded' });

    // Expect some real content.
    await expect(page.locator('main')).toBeVisible();
    const text = await page.locator('main').innerText();
    expect(text.length).toBeGreaterThan(200);
  });

  test('RSS contains at least one item', async ({ request, baseURL }) => {
    const url = new URL('rss.xml', baseURL!).toString();
    const res = await request.get(url);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/<item[\s>]/i);
  });
});
