import { evaluateCiHealth } from './lib/ci-health.mjs';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

const result = evaluateCiHealth({
  repoRoot: '.',
  workflowPath: '.github/workflows/deploy.yml',
  requiredTriggers: ['push', 'pull_request'],
  disallowWriteAll: true,
});

if (!result.parse?.ok) fail(`Workflow YAML is invalid: ${result.parse?.error || 'parse error'}`);
if (!result.triggers.ok) fail(`Workflow missing trigger(s): ${result.triggers.missing.join(', ')}`);
if (!result.permissions.ok) fail(`Workflow permissions not scoped: ${result.permissions.problems.join('; ')}`);

console.log('✅ CI/deploy health checks passed');
