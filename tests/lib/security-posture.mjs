import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const DEFAULT_GITIGNORE_PATTERNS = [
  '.env*',
  '*.key',
  '*.pem',
  'credentials*',
  'auth*',
  'memory/',
  'MEMORY.md',
  'TOOLS.md',
  'USER.md',
  'SOUL.md',
  'AGENTS.md',
];

export const DEFAULT_SECRET_PATTERNS = [
  { name: 'GitHub classic token', regex: /ghp_[A-Za-z0-9]{20,}/g },
  { name: 'GitHub fine-grained token', regex: /github_pat_[A-Za-z0-9_]{30,}/g },
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Google API key', regex: /AIza[A-Za-z0-9_-]{35}/g },
  { name: 'Slack token', regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'Private key marker', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Assignment high entropy candidate', regex: /\b[A-Za-z0-9_]+=[A-Za-z0-9/+]{32,}\b/g },
];

const DEFAULT_EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'dist', '.astro', '.next', '.turbo', 'coverage']);
const DEFAULT_EXCLUDE_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);

function listFiles(dir, { excludeDirs, excludeFiles }, out = []) {
  for (const entry of readdirSync(dir)) {
    if (excludeFiles.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!excludeDirs.has(entry)) listFiles(full, { excludeDirs, excludeFiles }, out);
      continue;
    }
    out.push(full);
  }
  return out;
}

export function validateGitignore({
  repoRoot = '.',
  gitignorePath = '.gitignore',
  requiredPatterns = DEFAULT_GITIGNORE_PATTERNS,
} = {}) {
  const full = join(repoRoot, gitignorePath);
  const content = readFileSync(full, 'utf8');
  const missing = requiredPatterns.filter((p) => !content.includes(p));
  return {
    ok: missing.length === 0,
    missing,
    requiredPatterns,
    gitignorePath: full,
  };
}

export function scanForSecrets({
  repoRoot = '.',
  includeFiles,
  excludeDirs = [...DEFAULT_EXCLUDE_DIRS],
  excludeFiles = [...DEFAULT_EXCLUDE_FILES],
  secretPatterns = DEFAULT_SECRET_PATTERNS,
  allowMatches = [],
} = {}) {
  const exDirs = new Set(excludeDirs);
  const exFiles = new Set(excludeFiles);
  const files = includeFiles ?? listFiles(repoRoot, { excludeDirs: exDirs, excludeFiles: exFiles });
  const findings = [];

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const { name, regex } of secretPatterns) {
      regex.lastIndex = 0;
      let m;
      while ((m = regex.exec(text))) {
        const value = m[0];
        const allow = allowMatches.some((rule) => {
          if (rule.file && !file.includes(rule.file)) return false;
          if (rule.pattern && !rule.pattern.test(value)) return false;
          return true;
        });
        if (allow) continue;
        findings.push({ file, detector: name, match: value.slice(0, 120), index: m.index });
      }
    }
  }

  return {
    ok: findings.length === 0,
    scannedFileCount: files.length,
    findings,
  };
}

export function evaluateSecurityPosture(config = {}) {
  const gitignore = validateGitignore(config);
  const secrets = scanForSecrets(config);
  return {
    ok: gitignore.ok && secrets.ok,
    gitignore,
    secrets,
  };
}
