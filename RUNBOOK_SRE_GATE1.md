# Gate 1 SRE Test Suite — Dreamy Draw Weekly

Target:
- Repo: `dreamyunit204/dreamy-draw-weekly`
- Live site: https://dreamyunit204.github.io/dreamy-draw-weekly/

## What this covers

1. **Site availability / health checks** (HTTP + basic render)
2. **Build pipeline validation** (`npm ci` + `npm run build`)
3. **Content rendering** (homepage + RSS + navigation heuristics)
4. **Asset loading & mobile responsiveness** (no 4xx/failed requests; no horizontal scroll on mobile)
5. **Performance baseline** (Lighthouse thresholds on a locally served build)
6. **Deployment rollback verification** (runbook procedure)
7. **DNS/routing** for `dreamyunit204.github.io/dreamy-draw-weekly/` (tested via live URL health)

## How to run locally

```bash
npm ci

# 1) Run SRE checks against live site
SRE_BASE_URL=https://dreamyunit204.github.io/dreamy-draw-weekly/ \
  npx playwright test

# 2) Run performance baseline against a local build
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
# in a second terminal:
node scripts/lighthouse-baseline.mjs
```

## CI (GitHub Actions)

Workflow: `.github/workflows/sre-gate1.yml`

- Runs on PRs and on a daily schedule.
- Validates build.
- Runs Playwright suite against the **live GitHub Pages** URL.
- Runs Lighthouse baseline against a locally served `astro preview` build.

## Rollback verification (GitHub Pages)

GitHub Pages deployments are tied to commits on `main`.

**Rollback procedure (manual, Gate 1 verification):**

1. Identify last known-good commit SHA on `main`.
2. Create a rollback PR that reverts the bad commit(s) *or* cherry-picks the known-good state.
3. Merge to `main` (Pages deploy workflow will run).
4. Verify:
   - `https://dreamyunit204.github.io/dreamy-draw-weekly/` returns 200.
   - Homepage content matches the expected known-good snapshot (title + post list).
   - `rss.xml` returns 200.
   - SRE Gate 1 workflow completes green.

**Tip:** If rollback is frequent, consider adding a visible build stamp (commit SHA) in the footer so verification can be deterministic.
