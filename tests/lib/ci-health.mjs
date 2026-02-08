import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function parseYaml(filePath) {
  const rubyScript = [
    'require "yaml"',
    'require "json"',
    `doc = YAML.load_file(${JSON.stringify(filePath)})`,
    'puts JSON.generate(doc || {})',
  ].join('; ');

  const out = spawnSync('ruby', ['-e', rubyScript], { encoding: 'utf8' });
  if (out.status !== 0) {
    return { ok: false, error: out.stderr || out.stdout || 'YAML parser failed' };
  }
  try {
    return { ok: true, data: JSON.parse(out.stdout || '{}') };
  } catch (err) {
    return { ok: false, error: `Invalid parser output: ${String(err)}` };
  }
}

export function validateWorkflowTriggers({ workflow, requiredAny = ['push', 'pull_request'] } = {}) {
  const on = workflow?.on ?? workflow?.true;
  const keys = typeof on === 'string' ? [on] : Array.isArray(on) ? on : Object.keys(on || {});
  const missing = requiredAny.filter((k) => !keys.includes(k));
  return {
    ok: missing.length === 0,
    triggers: keys,
    missing,
  };
}

export function validateScopedPermissions({ workflow, disallowWriteAll = true } = {}) {
  const permissions = workflow?.permissions;
  const problems = [];

  if (!permissions) {
    problems.push('Missing top-level permissions block');
  } else if (typeof permissions === 'string') {
    if (permissions === 'write-all' && disallowWriteAll) problems.push('permissions: write-all is too broad');
  }

  const walkJobs = workflow?.jobs || {};
  for (const [jobName, jobDef] of Object.entries(walkJobs)) {
    if (jobDef && typeof jobDef.permissions === 'string' && jobDef.permissions === 'write-all' && disallowWriteAll) {
      problems.push(`jobs.${jobName}.permissions uses write-all`);
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    permissions,
  };
}

export function evaluateCiHealth({ repoRoot = '.', workflowPath = '.github/workflows/ci.yml', ...opts } = {}) {
  const full = join(repoRoot, workflowPath);
  const raw = readFileSync(full, 'utf8');
  const parsed = parseYaml(full);
  if (!parsed.ok) {
    return { ok: false, workflowPath: full, parse: parsed, triggers: null, permissions: null, rawLength: raw.length };
  }

  const triggers = validateWorkflowTriggers({ workflow: parsed.data, requiredAny: opts.requiredTriggers ?? ['push', 'pull_request'] });
  const permissions = validateScopedPermissions({ workflow: parsed.data, disallowWriteAll: opts.disallowWriteAll ?? true });

  return {
    ok: parsed.ok && triggers.ok && permissions.ok,
    workflowPath: full,
    parse: parsed,
    triggers,
    permissions,
  };
}
