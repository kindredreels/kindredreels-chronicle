/**
 * Extract commits pushed directly to main (not part of any PR).
 * Compares all non-merge commits on main against the PR commit pool
 * from raw-prs.json to find "orphan" commits.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const OUTPUT_FILE = join(DATA_DIR, 'raw-orphan-commits.json');

const repoPath = process.env.KINDRED_REELS_REPO_PATH;
if (!repoPath) {
  console.error('Error: KINDRED_REELS_REPO_PATH environment variable is required.');
  process.exit(1);
}

function git(args) {
  return execSync(`git ${args}`, {
    cwd: repoPath,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024
  }).trim();
}

// 1. Collect all commit SHAs from PRs
const rawPRs = JSON.parse(readFileSync(join(DATA_DIR, 'raw-prs.json'), 'utf8'));
const prCommitSHAs = new Set();
for (const pr of rawPRs) {
  for (const commit of (pr.commits || [])) {
    prCommitSHAs.add(commit.oid);
  }
}
console.log(`PR commit pool: ${prCommitSHAs.size} SHAs`);

// 2. Get all non-merge commits on main
const LOG_FORMAT = '%H%x00%aI%x00%s%x00%b%x1E';
const rawLog = git(`log main --no-merges --format="${LOG_FORMAT}"`);
const logEntries = rawLog.split('\x1E').filter(s => s.trim());

console.log(`Total non-merge commits on main: ${logEntries.length}`);

// 3. Filter to orphans (not in PR pool)
const orphans = [];
for (const entry of logEntries) {
  const [sha, date, headline, ...bodyParts] = entry.trim().split('\x00');
  if (!sha) continue;
  if (prCommitSHAs.has(sha)) continue;

  orphans.push({ sha, date, headline, body: bodyParts.join('\x00').trim() });
}

console.log(`Orphan commits (not in any PR): ${orphans.length}`);

// 4. Enrich each orphan with file stats via git show --stat
const enrichedOrphans = [];
for (const orphan of orphans) {
  const { sha, date, headline, body } = orphan;

  // Get diff stats
  let additions = 0;
  let deletions = 0;
  const filesChanged = [];

  try {
    const numstat = git(`show ${sha} --format="" --numstat`);
    for (const line of numstat.split('\n').filter(l => l.trim())) {
      const [add, del, path] = line.split('\t');
      const a = add === '-' ? 0 : parseInt(add, 10);
      const d = del === '-' ? 0 : parseInt(del, 10);
      additions += a;
      deletions += d;
      filesChanged.push({ path, additions: a, deletions: d });
    }
  } catch (err) {
    console.warn(`  Warning: Could not get stats for ${sha.slice(0, 7)}: ${err.message}`);
  }

  enrichedOrphans.push({
    sha,
    date,
    headline,
    body,
    stats: { additions, deletions, changedFiles: filesChanged.length },
    filesChanged
  });
}

// Sort oldest first
enrichedOrphans.sort((a, b) => new Date(a.date) - new Date(b.date));

writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedOrphans, null, 2));
console.log(`\nWrote ${enrichedOrphans.length} orphan commits to ${OUTPUT_FILE}`);

// Summary by date range
if (enrichedOrphans.length > 0) {
  const first = enrichedOrphans[0];
  const last = enrichedOrphans[enrichedOrphans.length - 1];
  console.log(`Date range: ${first.date.slice(0, 10)} to ${last.date.slice(0, 10)}`);
  console.log(`First: ${first.headline}`);
  console.log(`Last: ${last.headline}`);
}
