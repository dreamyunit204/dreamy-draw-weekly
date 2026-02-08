import { evaluateBuildSmoke } from './lib/build-smoke.mjs';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

console.log('Running build smoke test...');
const result = evaluateBuildSmoke({
  repoRoot: '.',
  runBuild: true,
  command: 'npm',
  args: ['run', 'build'],
  shell: true,
  expectedFiles: ['dist/index.html', 'dist/rss.xml'],
});

if (!result.build.ok) fail('`npm run build` failed');
if (!result.artifacts.ok) fail(`Missing build artifacts: ${result.artifacts.missing.join(', ')}`);

const postsDir = join('dist', 'posts');
if (!existsSync(postsDir)) fail('Missing dist/posts directory');

const postDirs = readdirSync(postsDir).filter((name) => {
  const full = join(postsDir, name);
  return statSync(full).isDirectory() && existsSync(join(full, 'index.html'));
});

if (postDirs.length === 0) fail('No built post pages found under dist/posts/*/index.html');

console.log(`✅ Build smoke test passed (${postDirs.length} post page(s) found)`);
