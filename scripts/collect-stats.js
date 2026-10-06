#!/usr/bin/env node

/**
 * CodeChronicle Collector
 * Walks git history and counts lines of code by category for each day
 *
 * Usage:
 *   node src/collector.js           # Incremental update
 *   node src/collector.js --force   # Full recollection
 */

import { join } from 'path';
import {
  git,
  getCommitsInRange,
  getFirstCommitDate,
  getCurrentBranch,
  checkout,
  groupCommitsByDay,
  countLinesInFile,
  walkDirectory,
  getTodayDate,
  formatNumber,
  REPO_ROOT
} from './utils.js';
import {
  loadSnapshots,
  saveSnapshots,
  loadCache,
  saveCache,
  clearCache,
  createEmptyDaySnapshot,
  getSummaryStats
} from './cache.js';
import { categorizeFile, createEmptyCounts } from './categorizer.js';

/**
 * Count lines by category for the current repo state
 * @returns {{totals: Object, fileCount: Object}}
 */
function countLinesByCategory() {
  const totals = createEmptyCounts();
  const fileCount = createEmptyCounts();

  for (const filepath of walkDirectory(REPO_ROOT)) {
    const category = categorizeFile(filepath);

    if (category) {
      const lines = countLinesInFile(join(REPO_ROOT, filepath));
      totals[category] += lines;
      fileCount[category] += 1;
    }
  }

  return { totals, fileCount };
}

/**
 * Count the working tree as it is now and store it as today's snapshot, then save.
 */
function captureToday(snapshots, cache) {
  const today = getTodayDate();
  console.log(`📸 Capturing today's snapshot (${today})...`);
  const { totals, fileCount } = countLinesByCategory();
  snapshots.days[today] = {
    commit: git('rev-parse HEAD'),
    totals,
    fileCount
  };
  cache.lastProcessedDate = today;
  saveSnapshots(snapshots);
  saveCache(cache);
}

/**
 * Main collection function
 * @param {Object} options
 * @param {boolean} options.force - Force full recollection
 */
async function collect(options = {}) {
  const { force = false } = options;

  console.log('\n📊 CodeChronicle - Collecting codebase stats\n');

  // Clear cache if force flag is set
  if (force) {
    clearCache();
  }

  // Load existing data
  const snapshots = loadSnapshots();
  const cache = loadCache();

  // Get date range
  const startDate = cache.lastProcessedDate
    ? getNextDay(cache.lastProcessedDate)
    : getFirstCommitDate();
  const endDate = getTodayDate();

  // Set repo start date if not set
  if (!snapshots.repoStartDate) {
    snapshots.repoStartDate = getFirstCommitDate();
  }

  console.log(`📅 Repo started: ${snapshots.repoStartDate}`);
  console.log(`📅 Analyzing: ${startDate} to ${endDate}`);

  // Get commits in range
  const commits = getCommitsInRange(startDate, endDate);

  if (commits.length === 0) {
    // Nothing new on earlier days, but today's count is still refreshed: a second
    // run on the same day used to stop here and keep the morning's numbers.
    console.log('\n✅ No earlier days to fill in.');
    captureToday(snapshots, cache);
    printSummary(snapshots);
    return;
  }

  console.log(`📝 Found ${commits.length} new commits\n`);

  // Group commits by day
  const dayGroups = groupCommitsByDay(commits);
  const totalDays = dayGroups.size;
  let processedDays = 0;

  // Save current branch to restore later
  const originalBranch = getCurrentBranch();
  const originalRef = originalBranch === 'HEAD'
    ? git('rev-parse HEAD')
    : originalBranch;

  // Stash any uncommitted changes (including untracked files)
  console.log('📦 Stashing local changes...');
  let hasStash = false;
  try {
    git('stash push --include-untracked -m "CodeChronicle: temporary stash"');
    hasStash = true;
  } catch {
    // No changes to stash, that's fine
  }

  try {
    // Process each day
    for (const [date, dayCommits] of dayGroups) {
      processedDays++;
      const lastCommit = dayCommits[dayCommits.length - 1];

      process.stdout.write(`\r⏳ Processing ${date} (${processedDays}/${totalDays})...`);

      // Checkout the last commit of the day (force to handle untracked files)
      checkout(lastCommit.hash, { force: true });

      // Count lines
      const { totals, fileCount } = countLinesByCategory();

      // Store snapshot
      snapshots.days[date] = {
        commit: lastCommit.hash,
        totals,
        fileCount
      };

      // Update cache
      cache.lastProcessedCommit = lastCommit.hash;
      cache.lastProcessedDate = date;
      if (!cache.processedDates.includes(date)) {
        cache.processedDates.push(date);
      }
    }

    console.log('\n');
  } finally {
    // Always restore original branch
    console.log('🔄 Restoring original branch...');
    checkout(originalRef);

    // Restore stashed changes if any
    if (hasStash) {
      console.log('📦 Restoring stashed changes...');
      try {
        git('stash pop');
      } catch {
        console.log('⚠️  Could not restore stash automatically. Run "git stash pop" manually.');
      }
    }
  }

  // Always capture today's current working directory state
  captureToday(snapshots, cache);
  saveCache(cache);

  console.log('💾 Data saved!\n');

  // Print summary
  printSummary(snapshots);
}

/**
 * Get the next day after a given date
 * @param {string} date - YYYY-MM-DD
 * @returns {string} Next day in YYYY-MM-DD format
 */
function getNextDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Print summary statistics
 * @param {Object} snapshots
 */
function printSummary(snapshots) {
  const stats = getSummaryStats(snapshots);

  console.log('═══════════════════════════════════════════════════════');
  console.log('                    CodeChronicle Summary               ');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`📆 Days tracked:    ${stats.totalDays}`);
  console.log(`📅 Date range:      ${stats.firstDate || 'N/A'} → ${stats.lastDate || 'N/A'}`);
  console.log(`📄 Total lines:     ${formatNumber(stats.totalLines)}`);
  console.log(`📁 Total files:     ${formatNumber(stats.totalFiles)}`);

  console.log('\n📊 Lines by Category:\n');

  const categories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, lines] of categories) {
    const percent = stats.totalLines > 0
      ? ((lines / stats.totalLines) * 100).toFixed(1)
      : '0.0';
    const bar = '█'.repeat(Math.round(parseFloat(percent) / 5));
    console.log(`  ${category.padEnd(12)} ${formatNumber(lines).padStart(8)} (${percent.padStart(5)}%) ${bar}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Run "npm run serve" to view the dashboard');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Parse CLI arguments
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

// Run collector
collect({ force }).catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
