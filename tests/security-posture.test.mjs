import { evaluateSecurityPosture } from './lib/security-posture.mjs';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

const result = evaluateSecurityPosture({
  repoRoot: '.',
  excludeDirs: ['.git', 'node_modules', 'dist', '.astro'],
  excludeFiles: ['package-lock.json'],
  allowMatches: [{ file: 'tests/security-posture.test.mjs' }],
});

if (!result.gitignore.ok) fail(`.gitignore missing patterns: ${result.gitignore.missing.join(', ')}`);
if (!result.secrets.ok) {
  const sample = result.secrets.findings.slice(0, 20).map((f) => `${f.file} [${f.detector}] ${f.match}`).join('\n');
  fail(`Potential secrets detected:\n${sample}`);
}

console.log('✅ Security posture checks passed');
