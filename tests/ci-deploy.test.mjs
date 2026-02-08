import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflowPath = '.github/workflows/deploy.yml';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!existsSync(workflowPath)) fail('Missing .github/workflows/deploy.yml');

console.log('Validating workflow YAML syntax...');
const yamlCheck = spawnSync('ruby', ['-e', `require \"yaml\"; YAML.load_file(\"${workflowPath}\"); puts \"ok\"`], {
  stdio: 'pipe',
});

if (yamlCheck.status !== 0) {
  fail(`Workflow YAML is invalid:\n${yamlCheck.stderr?.toString() || yamlCheck.stdout?.toString()}`);
}

const content = readFileSync(workflowPath, 'utf8');

if (!/on:\s*[\s\S]*push:\s*[\s\S]*branches:\s*\[\s*main\s*\]/m.test(content)) {
  fail('Workflow missing push trigger on main branch');
}

if (!/workflow_dispatch:/m.test(content)) {
  fail('Workflow missing workflow_dispatch trigger');
}

const requiredPermissions = [
  /permissions:\s*[\s\S]*contents:\s*read/m,
  /permissions:\s*[\s\S]*pages:\s*write/m,
  /permissions:\s*[\s\S]*id-token:\s*write/m,
];

for (const pattern of requiredPermissions) {
  if (!pattern.test(content)) fail(`Workflow permissions check failed for pattern: ${pattern}`);
}

console.log('✅ CI/deploy health checks passed');
