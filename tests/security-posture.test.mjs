import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

console.log('Checking .gitignore sensitive patterns...');
if (!existsSync('.gitignore')) fail('Missing .gitignore');
const gi = readFileSync('.gitignore', 'utf8');

for (const pattern of ['.env*', '*.key', '*.pem', 'credentials*', 'auth*']) {
  if (!gi.includes(pattern)) fail(`.gitignore missing sensitive pattern: ${pattern}`);
}

console.log('Scanning repository for likely committed secrets...');
const grepCmd = [
  "grep -RInE",
  "'(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|AIza[A-Za-z0-9_-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|[A-Za-z0-9_]+=[A-Za-z0-9/+]{32,})'",
  ".",
  "--exclude-dir=.git",
  "--exclude-dir=node_modules",
  "--exclude-dir=dist",
  "--exclude-dir=.astro",
  "--exclude=package-lock.json",
].join(' ');

const scan = spawnSync('sh', ['-lc', grepCmd], { encoding: 'utf8' });

if (scan.status === 0 && scan.stdout.trim()) {
  const lines = scan.stdout.trim().split('\n');
  const findings = lines.filter((line) => !line.includes('tests/security-posture.test.mjs'));
  if (findings.length > 0) {
    fail(`Potential secrets detected:\n${findings.slice(0, 20).join('\n')}`);
  }
}

console.log('✅ Security posture checks passed');
