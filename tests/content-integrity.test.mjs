import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function listFiles(dir, matcher, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) listFiles(full, matcher, out);
    else if (matcher(full)) out.push(full);
  }
  return out;
}

console.log('Checking post frontmatter schema compliance...');
const postsDir = 'src/content/posts';
if (!existsSync(postsDir)) fail('Posts directory not found');

const postFiles = listFiles(postsDir, (p) => p.endsWith('.md'));
if (postFiles.length === 0) fail('No markdown posts found');

for (const file of postFiles) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) fail(`${file}: missing frontmatter block`);

  const fm = m[1];
  for (const required of ['title', 'date', 'description']) {
    const re = new RegExp(`^${required}:\\s*(.+)$`, 'm');
    const hit = fm.match(re);
    if (!hit || !hit[1].trim()) fail(`${file}: missing required frontmatter field \`${required}\``);
  }

  const dateValue = (fm.match(/^date:\s*(.+)$/m) || [])[1]?.trim()?.replace(/^['\"]|['\"]$/g, '');
  if (!dateValue || Number.isNaN(new Date(dateValue).getTime())) {
    fail(`${file}: invalid date value \`${dateValue || ''}\``);
  }
}

console.log('Ensuring no broken internal links in built site...');
if (!existsSync('dist')) {
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
  if (build.status !== 0) fail('Build failed before link check');
}

let basePath = '/';
if (existsSync('astro.config.mjs')) {
  const astroCfg = readFileSync('astro.config.mjs', 'utf8');
  const m = astroCfg.match(/base:\s*['\"]([^'\"]+)['\"]/);
  if (m?.[1]) basePath = m[1];
}
if (!basePath.endsWith('/')) basePath += '/';

const htmlFiles = listFiles('dist', (p) => p.endsWith('.html'));
const broken = [];

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  const hrefs = [...html.matchAll(/href=\"([^\"]+)\"/g)].map((x) => x[1]);

  for (const href of hrefs) {
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('data:')) {
      continue;
    }

    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;

    let target;
    if (clean.startsWith('/')) {
      const withoutBase = clean.startsWith(basePath) ? clean.slice(basePath.length - 1) : clean;
      target = resolve('dist', `.${withoutBase}`);
    } else {
      target = resolve(dirname(htmlFile), clean);
    }

    const candidates = [target, join(target, 'index.html')];
    if (!target.endsWith('.html')) candidates.push(`${target}.html`);

    if (!candidates.some((c) => existsSync(c))) {
      broken.push({ from: htmlFile, href });
    }
  }
}

if (broken.length > 0) {
  const sample = broken.slice(0, 10).map((b) => `- ${b.from} -> ${b.href}`).join('\n');
  fail(`Found ${broken.length} broken internal link(s):\n${sample}`);
}

console.log(`✅ Content integrity checks passed (${postFiles.length} post(s), ${htmlFiles.length} html file(s) scanned)`);
