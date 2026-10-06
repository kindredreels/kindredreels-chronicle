/**
 * Build combined chronicle-data.json from entries, phases, and snapshots.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

function loadJSON(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const entries = loadJSON('entries.json');
const phases = loadJSON('phases.json');
const snapshots = loadJSON('snapshots.json');
// The acts and opening paragraph that frame the chapters (optional).
const story = existsSync(join(DATA_DIR, 'story.json')) ? loadJSON('story.json') : undefined;

if (story) {
  const phaseIds = new Set(phases.map(p => p.id));
  const placed = story.acts.flatMap(a => a.phaseIds);
  const missing = [...phaseIds].filter(id => !placed.includes(id));
  const unknown = placed.filter(id => !phaseIds.has(id));
  if (missing.length || unknown.length) {
    console.error(`story.json and phases.json disagree. Not in any act: ${missing.join(', ') || 'none'}. Unknown: ${unknown.join(', ') || 'none'}`);
    process.exit(1);
  }
}

// Transform snapshots into codeStats format: { [date]: { totalLines, totalFiles, byCategory } }
const codeStats = {};
for (const [date, snapshot] of Object.entries(snapshots.days)) {
  const totals = snapshot.totals || {};
  const fileCounts = snapshot.fileCount || {};

  let totalLines = 0;
  let totalFiles = 0;
  const byCategory = {};

  for (const [category, lines] of Object.entries(totals)) {
    totalLines += lines;
    const files = fileCounts[category] || 0;
    totalFiles += files;
    byCategory[category] = { lines, files };
  }

  codeStats[date] = { totalLines, totalFiles, byCategory };
}

// Build date range from entries
const dates = entries.map(e => e.date).sort();
const dateRange = {
  start: dates[0],
  end: dates[dates.length - 1]
};

const chronicleData = {
  entries,
  phases,
  story,
  codeStats,
  metadata: {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    dateRange,
    repo: 'kindredreels/kindredreels'
  }
};

const outputPath = join(DATA_DIR, 'chronicle-data.json');
writeFileSync(outputPath, JSON.stringify(chronicleData, null, 2));

console.log(`Built chronicle-data.json:`);
console.log(`  Entries: ${entries.length}`);
console.log(`  Phases: ${phases.length}`);
console.log(`  Code stat days: ${Object.keys(codeStats).length}`);
console.log(`  Date range: ${dateRange.start} to ${dateRange.end}`);
console.log(`  Output: ${outputPath}`);
