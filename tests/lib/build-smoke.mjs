import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export function runBuildCommand({
  repoRoot = '.',
  command = 'npm',
  args = ['run', 'build'],
  shell = false,
} = {}) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8', shell });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function verifyArtifacts({ repoRoot = '.', expectedFiles = [] } = {}) {
  const missing = expectedFiles.filter((f) => !existsSync(join(repoRoot, f)));
  return {
    ok: missing.length === 0,
    expectedFiles,
    missing,
  };
}

export function evaluateBuildSmoke({
  runBuild = true,
  repoRoot = '.',
  command,
  args,
  shell,
  expectedFiles = [],
} = {}) {
  const build = runBuild ? runBuildCommand({ repoRoot, command, args, shell }) : { ok: true, skipped: true };
  const artifacts = verifyArtifacts({ repoRoot, expectedFiles });
  return {
    ok: build.ok && artifacts.ok,
    build,
    artifacts,
  };
}
