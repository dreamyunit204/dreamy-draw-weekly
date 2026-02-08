import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

console.log('Running build smoke test...');
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (build.status !== 0) fail('`npm run build` failed');

const dist = 'dist';
if (!existsSync(dist)) fail('dist/ was not generated');

const required = ['index.html', 'rss.xml'];
for (const file of required) {
  const p = join(dist, file);
  if (!existsSync(p)) fail(`Missing build artifact: ${p}`);
}

const postsDir = join(dist, 'posts');
if (!existsSync(postsDir)) fail('Missing dist/posts directory');

const postDirs = readdirSync(postsDir).filter((name) => {
  const full = join(postsDir, name);
  return statSync(full).isDirectory() && existsSync(join(full, 'index.html'));
});

if (postDirs.length === 0) fail('No built post pages found under dist/posts/*/index.html');

console.log(`✅ Build smoke test passed (${postDirs.length} post page(s) found)`);
