# Kindred Reels Chronicle

An analytics and storytelling tool for the Kindred Reels project — a 100K+ line production web app built entirely through AI-assisted development with Claude Code. This app tells that story both quantitatively and qualitatively.

## Features

The Chronicle app has four interactive views:

- **Code Stats** — Lines of code over time, category breakdowns, and growth metrics from codebase snapshots
- **Timeline** — Chronological feed of all development entries (PRs and commit groups) with filtering by category, significance, and search
- **Chapters** — Phase-based narrative view that groups entries into development chapters with rich context and narratives
- **Growth** — Correlation chart overlaying codebase growth with major development milestones, with brush selection to explore date ranges

## Setup

```bash
npm install
```

Create a `.env` file with:

```
KINDRED_REELS_REPO_PATH=/path/to/kindredreels
```

## Development

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
```

## Data Pipeline

The data pipeline extracts information from the Kindred Reels GitHub repo and transforms it into the structured `chronicle-data.json` consumed by the React app.

```bash
# Full update (collect stats, extract PRs, extract orphans, build data)
npm run update

# Individual steps
npm run collect           # Collect code stats from repo
npm run extract           # Extract merged PRs via gh CLI
npm run extract-orphans   # Extract direct-to-main commits
npm run build-data        # Build chronicle-data.json from all sources

# Enrichment (requires manual Claude Code work)
npm run generate-entries  # Generate enriched entries from raw PRs
npm run generate-orphans  # Generate enriched entries from orphan commits
```

## Document Generation

Generate a markdown chronicle document from the data:

```bash
npm run generate-doc
```

Outputs `output/building-kindred-reels.md` — a complete narrative document with all phases, entries, statistics, and a full change log appendix.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Recharts
- **Build**: Vite 7
- **Data scripts**: Node.js ES modules, GitHub CLI (`gh`)
- **Deployment**: GitHub Pages
