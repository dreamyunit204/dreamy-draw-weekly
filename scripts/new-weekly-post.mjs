#!/usr/bin/env node
/**
 * Create a new Weekly Recap markdown file under src/content/posts.
 *
 * Usage:
 *   node scripts/new-weekly-post.mjs --date 2026-02-15 --issue 2
 *   node scripts/new-weekly-post.mjs --date 2026-02-15 --title "Weekly Recap — Feb 15, 2026"
 *
 * If --issue is omitted, it auto-increments from existing posts.
 * If --title is omitted, it uses "Weekly Recap — <MMM D, YYYY>".
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const POSTS_DIR = path.join(REPO_ROOT, 'src', 'content', 'posts');
const TEMPLATE_PATH = path.join(REPO_ROOT, 'templates', 'weekly-recap-template.md');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) die(`Missing value for ${flag}`);
  return v;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatTitleFromDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) die(`Invalid --date: ${isoDate}`);
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `Weekly Recap — ${fmt.format(d)}`;
}

function listIssues() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const issues = [];
  for (const f of files) {
    const p = path.join(POSTS_DIR, f);
    const content = fs.readFileSync(p, 'utf8');
    const m = content.match(/^issue:\s*(\d+)\s*$/m);
    if (m) issues.push(Number(m[1]));
  }
  return issues.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
}

function nextIssueNumber() {
  const issues = listIssues();
  if (issues.length === 0) return 1;
  return issues[issues.length - 1] + 1;
}

function applyTemplate(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`Create a new Weekly Recap post.\n\n` +
`Options:\n` +
`  --date  YYYY-MM-DD   (required)\n` +
`  --issue N            (optional; auto if omitted)\n` +
`  --title "..."       (optional)\n`);
    process.exit(0);
  }

  const date = getArg('--date');
  if (!date) die('Missing required --date YYYY-MM-DD');

  const issueArg = getArg('--issue');
  const issue = issueArg ? Number(issueArg) : nextIssueNumber();
  if (!Number.isFinite(issue) || issue <= 0) die(`Invalid --issue: ${issueArg}`);

  const title = getArg('--title') || formatTitleFromDate(date);

  const [yyyy, mm, dd] = date.split('-');
  if (!yyyy || !mm || !dd || yyyy.length !== 4 || mm.length !== 2 || dd.length !== 2) {
    die(`Invalid --date format (expected YYYY-MM-DD): ${date}`);
  }

  if (!fs.existsSync(TEMPLATE_PATH)) {
    die(`Template missing: ${path.relative(REPO_ROOT, TEMPLATE_PATH)}\nDid you clone the repo with templates/?`);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const d = new Date(`${date}T00:00:00`);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(d);

  const filled = applyTemplate(template, {
    YYYY: yyyy,
    MM: mm,
    DD: dd,
    YEAR: year,
    MONTH: month,
    DAY: day,
    ISSUE: issue,
  }).replace(/^title:.*$/m, `title: ${JSON.stringify(title)}`);

  const filename = `${date}-weekly.md`;
  const outPath = path.join(POSTS_DIR, filename);

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  if (fs.existsSync(outPath)) {
    die(`Post already exists: ${path.relative(REPO_ROOT, outPath)}`);
  }

  fs.writeFileSync(outPath, filled, 'utf8');
  console.log(`Created ${path.relative(REPO_ROOT, outPath)}`);
}

main();
