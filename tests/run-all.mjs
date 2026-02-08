import { spawnSync } from 'node:child_process';

const tests = [
  'tests/smoke.test.mjs',
  'tests/ci-deploy.test.mjs',
  'tests/content-integrity.test.mjs',
  'tests/security-posture.test.mjs',
];

for (const test of tests) {
  console.log(`\n=== ${test} ===`);
  const res = spawnSync('node', [test], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

console.log('\n✅ All Gate 1 SRE tests passed');
