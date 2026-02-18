/**
 * Cache and persistence utilities for CodeChronicle
 * Handles reading/writing snapshots and tracking processed commits
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createEmptyCounts, getCategoryNames } from './categorizer.js';

// Data directory
const DATA_DIR = join(import.meta.dirname, '../data');
const SNAPSHOTS_FILE = join(DATA_DIR, 'snapshots.json');
const CACHE_FILE = join(DATA_DIR, 'cache.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load snapshots from disk
 * @returns {Object} Snapshots data
 */
export function loadSnapshots() {
  ensureDataDir();

  if (!existsSync(SNAPSHOTS_FILE)) {
    return {
      schemaVersion: 1,
      generatedAt: null,
      repoStartDate: null,
      days: {}
    };
  }

  try {
    const content = readFileSync(SNAPSHOTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading snapshots:', error.message);
    return {
      schemaVersion: 1,
      generatedAt: null,
      repoStartDate: null,
      days: {}
    };
  }
}

/**
 * Save snapshots to disk
 * @param {Object} snapshots - Snapshots data
 */
export function saveSnapshots(snapshots) {
  ensureDataDir();

  snapshots.generatedAt = new Date().toISOString();

  writeFileSync(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2));
}

/**
 * Load cache (processed commits tracking)
 * @returns {Object} Cache data
 */
export function loadCache() {
  ensureDataDir();

  if (!existsSync(CACHE_FILE)) {
    return {
      lastProcessedCommit: null,
      lastProcessedDate: null,
      processedDates: []
    };
  }

  try {
    const content = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading cache:', error.message);
    return {
      lastProcessedCommit: null,
      lastProcessedDate: null,
      processedDates: []
    };
  }
}

/**
 * Save cache to disk
 * @param {Object} cache - Cache data
 */
export function saveCache(cache) {
  ensureDataDir();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Clear all cached data (for --force flag)
 */
export function clearCache() {
  ensureDataDir();

  if (existsSync(SNAPSHOTS_FILE)) {
    writeFileSync(SNAPSHOTS_FILE, JSON.stringify({
      schemaVersion: 1,
      generatedAt: null,
      repoStartDate: null,
      days: {}
    }, null, 2));
  }

  if (existsSync(CACHE_FILE)) {
    writeFileSync(CACHE_FILE, JSON.stringify({
      lastProcessedCommit: null,
      lastProcessedDate: null,
      processedDates: []
    }, null, 2));
  }

  console.log('Cache cleared.');
}

/**
 * Create an empty day snapshot
 * @param {string} commit - Commit hash
 * @returns {Object} Empty snapshot
 */
export function createEmptyDaySnapshot(commit) {
  return {
    commit,
    totals: createEmptyCounts(),
    fileCount: createEmptyCounts()
  };
}

/**
 * Get summary stats from snapshots
 * @param {Object} snapshots - Snapshots data
 * @returns {Object} Summary statistics
 */
export function getSummaryStats(snapshots) {
  const days = Object.keys(snapshots.days);
  if (days.length === 0) {
    return {
      totalDays: 0,
      firstDate: null,
      lastDate: null,
      totalLines: 0,
      totalFiles: 0,
      byCategory: createEmptyCounts()
    };
  }

  const latestDay = snapshots.days[days[days.length - 1]];
  const categories = getCategoryNames();

  const totalLines = categories.reduce((sum, cat) => sum + (latestDay.totals[cat] || 0), 0);
  const totalFiles = categories.reduce((sum, cat) => sum + (latestDay.fileCount[cat] || 0), 0);

  return {
    totalDays: days.length,
    firstDate: days[0],
    lastDate: days[days.length - 1],
    totalLines,
    totalFiles,
    byCategory: latestDay.totals
  };
}
