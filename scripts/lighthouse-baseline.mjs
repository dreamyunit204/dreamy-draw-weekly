import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const url = process.env.LHCI_URL || 'http://127.0.0.1:4321/dreamy-draw-weekly/';

const thresholds = {
  performance: Number(process.env.LH_THRESH_PERF ?? 60),
  accessibility: Number(process.env.LH_THRESH_A11Y ?? 80),
  'best-practices': Number(process.env.LH_THRESH_BP ?? 80),
  seo: Number(process.env.LH_THRESH_SEO ?? 70),
};

let chromePath = process.env.CHROME_PATH;
if (!chromePath) {
  try {
    const { chromium } = await import('playwright');
    chromePath = chromium.executablePath();
  } catch {
    // ignore; chrome-launcher will try system Chrome
  }
}

const chrome = await chromeLauncher.launch({
  chromePath,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'info',
  });

  const cats = result.lhr.categories;
  const scores = {
    performance: Math.round((cats.performance?.score ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
    'best-practices': Math.round((cats['best-practices']?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
  };

  console.log('Lighthouse scores:', scores);

  const failures = Object.entries(thresholds)
    .filter(([k, min]) => (scores[k] ?? 0) < min)
    .map(([k, min]) => `${k} ${(scores[k] ?? 0)} < ${min}`);

  if (failures.length) {
    console.error('Lighthouse threshold failures:\n' + failures.join('\n'));
    process.exitCode = 2;
  }
} finally {
  await chrome.kill();
}
