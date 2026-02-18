/**
 * Build combined chronicle-data.json from entries, phases, and snapshots.
 */

import { readFileSync, writeFileSync } from 'fs';
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
