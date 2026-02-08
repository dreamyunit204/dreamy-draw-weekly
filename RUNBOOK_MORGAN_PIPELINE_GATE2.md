# Gate 2 — Morgan Weekly Recap → Publish Pipeline (Runbook)

Repo: `dreamyunit204/dreamy-draw-weekly`

This runbook wires **Morgan** into the content pipeline so weekly recaps can be drafted, approved, and published as Markdown posts.

---

## 0) Where posts live

All posts are Markdown files here:

- `src/content/posts/YYYY-MM-DD-weekly.md`

Astro reads these files via `src/content.config.ts`.

**Frontmatter requirements** (YAML):

- `title` (string, required)
- `date` (string, required, ISO `YYYY-MM-DD`)
- `issue` (number, optional)
- `tags` (string[], optional)
- `description` (string, optional)

---

## 1) Drafting template (Morgan)

Template file:

- `templates/weekly-recap-template.md`

Workflow:

1. Copy template content.
2. Fill in sections (TL;DR, Network Activity, Trending, Narratives/Macro, Lab Scorecard, etc.).
3. Keep content **public-safe** (no private wallet addresses, internal PnL details, private deals).

---

## 2) Approval flow (required)

1. **Morgan drafts** the recap using the template.
2. Morgan posts the draft to Slack:
   - Channel: `#dreamy-lab-socialmedia`
   - Channel ID: `C0AE30B5GTA`
3. **Director (AJ) approves** (or requests edits).
4. Only after approval: create the final Markdown post in the repo and publish.

---

## 3) Creating a properly-formatted Markdown post

### Option A (recommended): generate a new post file with the helper script

From the repo root:

```bash
cd dreamy-draw-weekly
node scripts/new-weekly-post.mjs --date 2026-02-15
```

This creates:

- `src/content/posts/2026-02-15-weekly.md`

Then paste in Morgan’s approved content (keeping the YAML frontmatter valid).

### Option B: manual

Copy `templates/weekly-recap-template.md` into:

- `src/content/posts/YYYY-MM-DD-weekly.md`

Then replace placeholders (`{{...}}`) and fill in the body.

---

## 4) Publishing (commit + push)

> Note: Morgan does not currently have direct git access.
> The publish step is performed by Louie or Dreamy after AJ approval.

From the repo root:

```bash
git status

git add templates/ scripts/ src/content/posts/

git commit -m "Weekly recap: YYYY-MM-DD"

git push origin main
```

GitHub Actions will auto-deploy to GitHub Pages after the push.

---

## 5) Scheduling (Sunday 9:00 AM MST)

This project’s schedule target:

- **Sunday 9:00 AM MST** → generate recap draft → post to Slack for approval.

Because Morgan is an agent (not a human with a laptop), the schedule should run on a machine/service that can invoke Morgan’s recap generation.

### Option A: classic cron (Linux/macOS)

Edit crontab:

```bash
crontab -e
```

Add:

```cron
# Dreamy Draw Weekly — Sunday 09:00 America/Phoenix
0 9 * * 0 cd /PATH/TO/dreamy-draw-weekly && /usr/bin/node /PATH/TO/dreamy-draw-weekly/scripts/morgan-generate-and-post.mjs >> /tmp/dreamy-weekly.log 2>&1
```

Notes:

- Cron uses the machine’s local timezone.
- Arizona is typically `America/Phoenix` (no DST). Verify machine timezone.
- `scripts/morgan-generate-and-post.mjs` currently exists as a **stub reminder script** (prints next steps). A future Gate can replace it with a real Morgan invocation + Slack-post automation.

### Option B: launchd (macOS, more reliable than cron)

Create `~/Library/LaunchAgents/io.dreamy.weekly.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key><string>io.dreamy.weekly</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>cd /PATH/TO/dreamy-draw-weekly && /usr/bin/node scripts/morgan-generate-and-post.mjs</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
      <key>Weekday</key><integer>1</integer>
      <key>Hour</key><integer>9</integer>
      <key>Minute</key><integer>0</integer>
    </dict>
    <key>StandardOutPath</key><string>/tmp/dreamy-weekly.out.log</string>
    <key>StandardErrorPath</key><string>/tmp/dreamy-weekly.err.log</string>
  </dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/io.dreamy.weekly.plist
launchctl list | grep io.dreamy.weekly
```

---

## 6) What’s implemented vs future work

Implemented in Gate 2:

- A reusable Markdown template for Morgan.
- A helper script to generate correctly-named post files with valid frontmatter.
- This runbook documenting approval + publish flow.

Future hook (not implemented here):

- Upgrade `scripts/morgan-generate-and-post.mjs` from a reminder stub into a real script that invokes Morgan, generates the recap, and posts to Slack automatically.
  (This depends on how Dreamy wants Morgan to be orchestrated + Slack auth.)
