/**
 * Generate a markdown document from chronicle-data.json
 * Output: output/building-kindred-reels.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const OUTPUT_DIR = join(__dirname, '..', 'output');

function loadJSON(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatNum(n) {
  return n.toLocaleString();
}

function entryLink(entry) {
  const id = entry.id;
  if (id.startsWith('pr-')) {
    const num = entry.prNumber || id.replace('pr-', '');
    return `[PR #${num}](https://github.com/kindredreels/kindredreels/pull/${num})`;
  }
  if (id.startsWith('commit-')) {
    const sha = id.replace('commit-', '');
    return `[commit ${sha}](https://github.com/kindredreels/kindredreels/commit/${sha})`;
  }
  // commits-{date}-{slug} — grouped direct commits, no single link
  return 'Direct commits';
}

function categoryLabel(cat) {
  const map = {
    frontend: 'Frontend',
    backend: 'Backend',
    processing: 'Processing',
    ai: 'AI',
    infrastructure: 'Infrastructure',
    design: 'Design',
    docs: 'Docs',
    devops: 'DevOps'
  };
  return map[cat] || cat;
}

const data = loadJSON('chronicle-data.json');
const { entries, phases, codeStats, metadata } = data;

// Build entriesById lookup
const entriesById = {};
for (const entry of entries) {
  entriesById[entry.id] = entry;
}

// Count PRs and direct commits
const prCount = entries.filter(e => e.prNumber !== null).length;
const commitCount = entries.length - prCount;

// Get latest total lines
const statDates = Object.keys(codeStats).sort();
const latestLines = statDates.length > 0
  ? codeStats[statDates[statDates.length - 1]].totalLines
  : 0;

const lines = [];

// Header
lines.push('# The Building of Kindred Reels');
lines.push('## A Development Chronicle');
lines.push('');
lines.push(`*Generated ${formatDate(new Date().toISOString().slice(0, 10))} \u2022 ${prCount} pull requests \u2022 ${commitCount} direct commits \u2022 ${formatNum(latestLines)} lines of code*`);
lines.push('');

// Phases with entries
for (const phase of phases) {
  lines.push(`## ${phase.title}`);
  lines.push(`*${formatDate(phase.dateRange.start)} \u2013 ${formatDate(phase.dateRange.end)}*`);
  lines.push('');
  lines.push(phase.narrative);
  lines.push('');

  const phaseEntries = phase.entryIds
    .map(id => entriesById[id])
    .filter(e => e != null);

  for (const entry of phaseEntries) {
    lines.push(`### ${entry.title} \u2014 ${formatDateShort(entry.date)}`);
    lines.push('');
    if (entry.detail) {
      lines.push(entry.detail);
      lines.push('');
    } else {
      lines.push(entry.summary);
      lines.push('');
    }
    lines.push(`- Category: ${categoryLabel(entry.category)} \u2022 Files: ${entry.stats.changedFiles} \u2022 Lines: +${formatNum(entry.stats.additions)}/-${formatNum(entry.stats.deletions)}`);
    lines.push(`- ${entryLink(entry)}`);
    lines.push('');
  }
}

// By the Numbers
lines.push('## By the Numbers');
lines.push('');

const totalAdditions = entries.reduce((sum, e) => sum + e.stats.additions, 0);
const totalDeletions = entries.reduce((sum, e) => sum + e.stats.deletions, 0);
const majorCount = entries.filter(e => e.significance === 'major').length;

// Most active week
const weekBuckets = {};
for (const entry of entries) {
  const d = new Date(entry.date + 'T00:00:00');
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  const key = `${year}-W${String(week).padStart(2, '0')}`;
  weekBuckets[key] = (weekBuckets[key] || 0) + 1;
}
const mostActiveWeek = Object.entries(weekBuckets).sort((a, b) => b[1] - a[1])[0];

// Largest entry
const largestEntry = entries.reduce((max, e) =>
  (e.stats.additions + e.stats.deletions) > (max.stats.additions + max.stats.deletions) ? e : max
, entries[0]);

// Category breakdown
const categoryBreakdown = {};
for (const entry of entries) {
  categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + 1;
}

lines.push(`- **Total entries**: ${entries.length} (${prCount} PRs, ${commitCount} direct commit groups)`);
lines.push(`- **Major changes**: ${majorCount}`);
lines.push(`- **Lines added/removed**: +${formatNum(totalAdditions)} / -${formatNum(totalDeletions)}`);
lines.push(`- **Current codebase**: ${formatNum(latestLines)} lines across ${statDates.length} measured snapshots`);
lines.push(`- **Development period**: ${formatDate(metadata.dateRange.start)} to ${formatDate(metadata.dateRange.end)}`);
lines.push(`- **Phases**: ${phases.length}`);
if (mostActiveWeek) {
  lines.push(`- **Most active week**: ${mostActiveWeek[0]} (${mostActiveWeek[1]} entries)`);
}
if (largestEntry) {
  lines.push(`- **Largest entry**: "${largestEntry.title}" (+${formatNum(largestEntry.stats.additions)}/-${formatNum(largestEntry.stats.deletions)})`);
}
lines.push('');

lines.push('**Category breakdown:**');
lines.push('');
const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
for (const [cat, count] of sortedCategories) {
  lines.push(`- ${categoryLabel(cat)}: ${count}`);
}
lines.push('');

// Appendix
lines.push('## Appendix: Complete Change Log');
lines.push('');
lines.push('| # | Date | Title | Category | Significance | +/- | Source |');
lines.push('|---|------|-------|----------|-------------|-----|--------|');

entries.forEach((entry, i) => {
  const title = entry.title.replace(/\|/g, '\\|');
  const source = entryLink(entry).replace(/\|/g, '\\|');
  lines.push(`| ${i + 1} | ${entry.date} | ${title} | ${categoryLabel(entry.category)} | ${entry.significance} | +${formatNum(entry.stats.additions)}/-${formatNum(entry.stats.deletions)} | ${source} |`);
});

lines.push('');

// Write output
mkdirSync(OUTPUT_DIR, { recursive: true });
const outputPath = join(OUTPUT_DIR, 'building-kindred-reels.md');
writeFileSync(outputPath, lines.join('\n'));

console.log(`Generated document: ${outputPath}`);
console.log(`  Phases: ${phases.length}`);
console.log(`  Entries: ${entries.length} (${prCount} PRs, ${commitCount} commit groups)`);
console.log(`  Lines: ${formatNum(latestLines)}`);
