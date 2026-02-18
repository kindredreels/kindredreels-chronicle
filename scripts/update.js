/**
 * Orchestrator script: runs data collection and build pipeline in sequence.
 * Does NOT run enrichment scripts (generate-entries, generate-orphan-entries)
 * — those require manual Claude Code work.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'data');

function loadJSON(filename) {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(label, command) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(60));
  try {
    execSync(command, { cwd: ROOT_DIR, stdio: 'inherit', env: process.env });
  } catch (err) {
    console.error(`\nFailed: ${label}`);
    console.error(err.message);
    process.exit(1);
  }
}

// Snapshot previous state
const prevData = loadJSON('chronicle-data.json');
const prevEntryCount = prevData ? prevData.entries.length : 0;

// Run pipeline
run('1. Collect code stats', 'node --env-file=.env scripts/collect-stats.js');
run('2. Extract PRs', 'node --env-file=.env scripts/extract-prs.js');
run('3. Extract orphan commits', 'node --env-file=.env scripts/extract-orphan-commits.js');
run('4. Build chronicle data', 'node scripts/build-data.js');

// Report
const newData = loadJSON('chronicle-data.json');
const newEntryCount = newData ? newData.entries.length : 0;

console.log(`\n${'='.repeat(60)}`);
console.log('  Update complete');
console.log('='.repeat(60));
console.log(`  Entries: ${prevEntryCount} → ${newEntryCount}`);

// Check for unenriched PRs
const rawPRs = loadJSON('raw-prs.json') || [];
const entries = loadJSON('entries.json') || [];
const enrichedPRNumbers = new Set(entries.filter(e => e.prNumber !== null).map(e => e.prNumber));
const unenrichedPRs = rawPRs.filter(pr => !enrichedPRNumbers.has(pr.number));

if (unenrichedPRs.length > 0) {
  console.log(`\n  Unenriched PRs (${unenrichedPRs.length}):`);
  for (const pr of unenrichedPRs) {
    console.log(`    PR #${pr.number}: ${pr.title}`);
  }
} else {
  console.log('  All PRs are enriched.');
}

// Check for unenriched orphan commits
const rawOrphans = loadJSON('raw-orphan-commits.json') || [];
const enrichedOrphanIds = new Set(
  entries.filter(e => e.prNumber === null).map(e => e.id)
);
// Count raw orphan commits not covered by any entry
const orphanSHAs = rawOrphans.map(c => c.sha || c.oid);
const coveredSHAs = new Set();
for (const entry of entries) {
  if (entry.prNumber === null) {
    // commit-{sha} entries cover a single SHA
    if (entry.id.startsWith('commit-')) {
      coveredSHAs.add(entry.id.replace('commit-', ''));
    }
    // commits-{date}-{slug} entries — we check if commitMessages overlap
    // For simplicity, mark all entry commit messages as covered
  }
}
const uncoveredOrphans = orphanSHAs.filter(sha => !coveredSHAs.has(sha));

if (uncoveredOrphans.length > 0 && uncoveredOrphans.length !== orphanSHAs.length) {
  // Only report if there are genuinely new ones (not all of them)
  console.log(`\n  Orphan commits not individually covered: ${uncoveredOrphans.length} of ${orphanSHAs.length} total`);
} else if (enrichedOrphanIds.size === 0 && rawOrphans.length > 0) {
  console.log(`\n  Raw orphan commits: ${rawOrphans.length} (none enriched yet)`);
} else {
  console.log('  Orphan commits are covered by entries.');
}

console.log('\nTo enrich new entries, run:');
console.log('  npm run generate-entries    # For PR entries');
console.log('  npm run generate-orphans    # For orphan commit entries');
