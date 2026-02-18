# Kindred Reels Chronicle — Phased Spec

## Overview

A standalone repo that tells the complete story of building Kindred Reels — both quantitative (lines of code, growth rates) and qualitative (what was built, why, how it evolved). Combines the existing Code Chronicle with a new PR-based development chronicle in a single React application.

The full spec is broken into 4 phases. Each phase is a self-contained Claude Code session.

---

## Pre-Work (Dimitri does manually)

1. Create new repo (e.g., `kindred-reels-chronicle`)
2. Copy `code-chronicle/` contents into root
3. Add `CLAUDE.md` (provided separately)
4. Commit and push
5. Launch Claude Code from this repo

---

## Phase 1: React App + Code Stats View

**Goal:** Replace the vanilla JS Code Chronicle dashboard with a proper React app. When done, you have a working React dashboard that shows everything the old Code Chronicle showed, plus the shell for the other views.

**What to build:**

1. **Initialize React project** in this repo alongside the existing files
   - Vite + React 18 + TypeScript + TailwindCSS (dark theme, `bg-gray-900` base)
   - Recharts for all charts (replaces Chart.js)
   - Dev server on a port that doesn't conflict with Kindred Reels

2. **App shell with tab navigation**
   - Four tabs: Timeline, Chapters, Code Stats, Growth
   - Timeline, Chapters, Growth show placeholder content for now ("Coming soon")
   - Code Stats is the fully functional view

3. **Code Stats view** — Faithful reimplementation of the existing dashboard. Reference the old `dashboard/` files for logic and layout, but rewrite properly in React. All six components:
   - **Stats cards row**: Total lines, total files, days tracked, avg lines/day
   - **Time Series chart**: Stacked area, lines by category over time (daily/weekly/monthly toggle)
   - **Growth Rate chart**: Bar chart, net lines added per period (daily/weekly/monthly toggle, green positive / red negative)
   - **Category Donut**: Current breakdown
   - **Date Comparison**: Pick two dates, see per-category deltas
   - **Category Details Table**: Category, lines, files, avg lines/file, % of total

4. **Data loading**: Read `data/snapshots.json` (the existing Code Chronicle data). Fill missing days (carry forward, same logic as old dashboard). The app should handle the existing data format as-is.

5. **Migrate collection script**: Update `scripts/collect.js` (or whatever it's called) to accept a configurable repo path via env var (`KINDRED_REELS_REPO_PATH`). Verify it still works.

**Preserve exact category colors:**
```
frontend: #3B82F6, backend: #10B981, scripts: #F59E0B, processing: #8B5CF6,
tests: #EC4899, docs: #06B6D4, cicd: #6366F1, claudePlans: #14B8A6, codeChronicle: #F97316
```

**Visual design:** Dark theme matching the old dashboard — `bg-gray-900` background, `bg-gray-800` cards with `border-gray-700`, white/gray text hierarchy. Period toggles with active/inactive button states.

**Done when:** `npm run dev` shows a working Code Stats tab that matches the old dashboard functionally. Old `dashboard/` directory can be deleted after verification.

---

## Phase 2: PR Data Extraction + Phase Detection

**Goal:** Pull all PR history from the Kindred Reels GitHub repo, enrich each PR with AI-generated summaries, and detect narrative phases. When done, you have `entries.json`, `phases.json`, and a combined `chronicle-data.json`.

**What to build:**

### Step A: Raw PR Extraction

Write `scripts/extract-prs.js` that:

1. Uses `gh pr list` to pull all merged PRs from the Kindred Reels repo:
   ```bash
   gh pr list --repo <owner>/<repo> --state merged \
     --json number,title,body,mergedAt,additions,deletions,changedFiles,files,labels,headRefName \
     --limit 300
   ```
2. For each PR, fetches commit messages:
   ```bash
   gh pr view <number> --repo <owner>/<repo> --json commits
   ```
3. Writes combined raw data to `data/raw-prs.json`

The Kindred Reels repo is private — `gh` should already be authenticated. Determine the repo owner/name from the Kindred Reels repo's `.git/config` or by running `gh repo view` from that directory.

### Step B: PR Enrichment

Process `data/raw-prs.json` to generate enriched entries. For each PR, read ALL available context in this priority order:

1. **Commit messages** — Often the most detailed source. Claude Code generates structured, descriptive commits. These are gold.
2. **PR body/description** — High-level context when available.
3. **PR title + branch name** — Categorization clues.
4. **Files changed + stats** — Scope and category signals.

Generate for each PR:
- **summary**: 1 line, ~80-120 chars, plain language
- **detail**: 1-3 paragraphs covering what, why, and notable technical decisions. Synthesized, not copy-pasted.
- **category**: One of `frontend`, `backend`, `processing`, `infrastructure`, `ai`, `design`, `docs`, `devops`
- **tags**: 2-5 descriptive tags (e.g., `video`, `music`, `ken-burns`, `performance`, `mobile`)
- **significance**: `major` (new feature/system), `moderate` (meaningful enhancement), `minor` (bug fix, small tweak)

**Entry schema:**
```typescript
interface ChronicleEntry {
  id: string;                    // "pr-{number}"
  prNumber: number;
  date: string;                  // YYYY-MM-DD (from mergedAt)
  mergedAt: string;              // Full ISO timestamp
  title: string;                 // PR title (original)
  branch: string;                // Head branch name
  summary: string;               // Generated one-liner
  detail: string;                // Generated rich description (markdown)
  category: string;
  tags: string[];
  significance: 'major' | 'moderate' | 'minor';
  stats: { additions: number; deletions: number; changedFiles: number; };
  filesChanged: string[];
  commitMessages: string[];      // Raw commit messages preserved
}
```

Write to `data/entries.json`. Process in batches of 10-15 if context is tight. Be idempotent — skip already-processed PRs.

### Step C: Phase Detection

Read all entries chronologically plus `docs/progress.md` from the Kindred Reels repo. Identify 4-8 natural narrative "chapters" based on:
- Clusters of related work
- Inflection points where focus shifted
- Natural arcs (foundations → features → intelligence → polish)

**Phase schema:**
```typescript
interface ChroniclePhase {
  id: string;                    // kebab-case slug
  title: string;                 // Creative chapter title
  subtitle: string;              // One-line description
  dateRange: [string, string];   // [start, end] YYYY-MM-DD
  narrative: string;             // 2-4 paragraph chapter intro (markdown)
  entryIds: string[];            // PR IDs in this phase
  color: string;                 // Hex color for visualization
}
```

Write 2-4 paragraph narratives per phase — like chapter introductions. Third-person project perspective. Write to `data/phases.json`.

### Step D: Build Combined Data

Write `scripts/build-data.js` that merges:
- `data/entries.json` (PR entries)
- `data/phases.json` (narrative phases)
- `data/snapshots.json` (Code Chronicle stats)

Into `data/chronicle-data.json`:
```typescript
interface ChronicleData {
  entries: ChronicleEntry[];
  phases: ChroniclePhase[];
  codeStats: { [date: string]: { totalLines: number; totalFiles: number; byCategory: Record<string, number>; } };
  metadata: { generatedAt: string; totalPRs: number; dateRange: [string, string]; repo: string; };
}
```

**Done when:** `data/chronicle-data.json` exists with all entries enriched, phases detected with narratives, and code stats integrated. Review entries and phases for quality.

---

## Phase 3: Timeline + Chapters Views

**Goal:** Build the two qualitative views in the React app. When done, you can browse the full PR history chronologically and by narrative chapter.

**What to build:**

### Timeline View

Load entries from `chronicle-data.json`. Vertical timeline with entries grouped by time period.

**Components:**
- `ZoomControls` — Toggle between Month and Week view
- `TimelineMonth` / `TimelineWeek` — Group containers with header (period name, PR count, lines added)
- `TimelineEntry` — Expandable PR card
- Filter bar: Category chips, significance toggle (all / major+moderate / major only), text search

**Month view (zoomed out):** Compact cards showing date, category badge, title, significance dot. Only major + moderate shown. Collapsed "+N other changes" for minors.

**Week view (zoomed in):** All entries shown. Cards include summary text. More spacious.

**Entry card expanded:** Full detail paragraphs (rendered markdown), collapsible commit messages section, collapsible file list, link to PR on GitHub.

**Category badge colors:**
```
frontend: #3B82F6, backend: #10B981, processing: #8B5CF6, ai: #F59E0B,
infrastructure: #06B6D4, design: #EC4899, docs: #6366F1, devops: #14B8A6
```

**Significance dots:** Major = solid 12px, Moderate = muted 8px, Minor = outline 6px.

### Chapters View

**Layout:** Left sidebar with phase navigation, main area with selected chapter.

**Sidebar:** List of phase cards with color accent, title, subtitle, date range, entry count. Click to navigate.

**Main area for selected phase:**
- Title + subtitle + date range header
- Narrative paragraphs
- Mini Recharts line chart showing Code Chronicle growth during this phase's date range only
- Entry list (same expandable cards as timeline)

### Shared Components

- `CategoryBadge` — Color-coded pill
- `SignificanceDot` — Visual indicator
- `TagList` — Row of tag pills
- `EntryDetail` — Expanded entry content (reused in both views)
- `StatsBar` — Context-sensitive summary (updates based on active view/filters)

**Done when:** Timeline and Chapters tabs are fully functional. Can browse all PRs, expand for detail, filter by category/significance, and read phase narratives.

---

## Phase 4: Growth Overlay + Document + Updates

**Goal:** Build the correlation view, generate the archival document, and set up ongoing update scripts. This is the polish phase.

**What to build:**

### Growth Overlay View

The "aha" view — what was being built when the codebase grew.

- Large Recharts area chart: total lines over time (from Code Chronicle data)
- Markers on the chart for `major` significance PRs (hover for title + summary)
- Subtle colored background bands showing phase boundaries
- Below chart: scrollable entry list for the visible time range
- Click marker → scroll to entry. Click+drag chart → filter entries by date range.

### Long-Form Document Generator

Write `scripts/generate-doc.js` that reads `chronicle-data.json` and outputs markdown:

```markdown
# The Building of Kindred Reels
## A Development Chronicle

*Generated [date] • [N] pull requests • [N] lines of code*

## [Phase Title]
*[date range]*
[Phase narrative]

### [PR Title] — [date]
[Detail paragraphs]
- Category: [X] • Files: [N] • Lines: +[N]/-[N]

...

## By the Numbers
[Summary stats, most active week, largest PR, category breakdown]

## Appendix: Complete PR Log
[Table of all PRs]
```

Output to `output/building-kindred-reels.md`.

### Update Scripts

- `scripts/update.js`: Pulls new code stats + new PRs since last entry, rebuilds combined data
- `npm run update` as the single command to keep it current
- New PRs get raw data extracted; enrichment still requires Claude Code to interpret

### Cleanup

- Remove old `dashboard/` directory (vanilla JS) now that React app fully replaces it
- Verify all `npm run` commands work
- Update README

**Done when:** All four tabs are functional, the archival doc is generated, and `npm run update` works for ongoing maintenance.

---

## Quick Reference: npm Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "collect": "node scripts/collect-stats.js",
    "extract": "node scripts/extract-prs.js",
    "build-data": "node scripts/build-data.js",
    "generate-doc": "node scripts/generate-doc.js",
    "update": "node scripts/update.js"
  }
}
```

---

## Key Reminders for Claude Code

- Kindred Reels repo is private. Use `gh` CLI (already authenticated).
- Commit messages are the richest data source for PR extraction — always fetch them.
- Read `docs/progress.md` from Kindred Reels repo during phase detection for additional context.
- Use Recharts for all charts (not Chart.js).
- Data set is small (50-150 entries, ~100 days of stats) — keep things simple, no virtualization needed.
- Dark theme throughout: `bg-gray-900` base, `bg-gray-800` cards, `border-gray-700`.
- The old `dashboard/` directory (vanilla JS + Chart.js) is reference material for the Code Stats view. Rewrite in React, don't copy-paste.
