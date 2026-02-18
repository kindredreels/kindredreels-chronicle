/**
 * Utility functions for CodeChronicle
 * Git commands, file operations, and date helpers
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { shouldExclude } from './categorizer.js';

// Repository root — set via KINDRED_REELS_REPO_PATH env var
if (!process.env.KINDRED_REELS_REPO_PATH) {
  console.error('Error: KINDRED_REELS_REPO_PATH environment variable is required.');
  console.error('Set it to the path of your Kindred Reels repository.');
  process.exit(1);
}
export const REPO_ROOT = process.env.KINDRED_REELS_REPO_PATH;

/**
 * Execute a git command and return the output
 * @param {string} command - Git command (without 'git' prefix)
 * @param {Object} options - Options
 * @returns {string} Command output
 */
export function git(command, options = {}) {
  const { cwd = REPO_ROOT, silent = true } = options;
  try {
    return execSync(`git ${command}`, {
      cwd,
      encoding: 'utf-8',
      stdio: silent ? ['pipe', 'pipe', 'pipe'] : 'inherit'
    }).trim();
  } catch (error) {
    if (!silent) {
      console.error(`Git command failed: git ${command}`);
    }
    throw error;
  }
}

/**
 * Get all commits in a date range, ordered oldest first
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array<{hash: string, date: string, message: string}>}
 */
export function getCommitsInRange(startDate, endDate) {
  const format = '%H|%ci|%s';
  const output = git(`log --format="${format}" --after="${startDate} 00:00:00" --before="${endDate} 23:59:59" --reverse`);

  if (!output) return [];

  return output.split('\n').filter(Boolean).map(line => {
    const [hash, datetime, message] = line.split('|');
    const date = datetime.split(' ')[0]; // Extract YYYY-MM-DD
    return { hash, date, message };
  });
}

/**
 * Get the first commit date in the repository
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getFirstCommitDate() {
  const output = git('log --reverse --format="%ci" | head -1');
  return output.split(' ')[0];
}

/**
 * Get the current branch name
 * @returns {string} Branch name
 */
export function getCurrentBranch() {
  return git('rev-parse --abbrev-ref HEAD');
}

/**
 * Checkout a specific commit
 * @param {string} ref - Commit hash or branch name
 * @param {Object} options - Options
 * @param {boolean} options.force - Force checkout (overwrite local changes)
 */
export function checkout(ref, options = {}) {
  const { force = false } = options;
  const forceFlag = force ? '--force' : '';
  git(`checkout ${ref} ${forceFlag} --quiet`);
}

/**
 * Group commits by day
 * @param {Array<{hash: string, date: string, message: string}>} commits
 * @returns {Map<string, Array>} Map of date -> commits
 */
export function groupCommitsByDay(commits) {
  const groups = new Map();

  for (const commit of commits) {
    if (!groups.has(commit.date)) {
      groups.set(commit.date, []);
    }
    groups.get(commit.date).push(commit);
  }

  return groups;
}

/**
 * Count lines in a file
 * @param {string} filepath - Absolute path to file
 * @returns {number} Line count
 */
export function countLinesInFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    // Count non-empty lines
    return content.split('\n').filter(line => line.trim()).length;
  } catch {
    return 0;
  }
}

/**
 * Recursively walk a directory and yield file paths
 * @param {string} dir - Directory to walk
 * @param {string} rootDir - Root directory for relative paths
 * @yields {string} Relative file paths
 */
export function* walkDirectory(dir, rootDir = dir) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.slice(rootDir.length + 1);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (!shouldExclude(relativePath + '/')) {
        yield* walkDirectory(fullPath, rootDir);
      }
    } else if (entry.isFile()) {
      // Skip excluded files
      if (!shouldExclude(relativePath)) {
        yield relativePath;
      }
    }
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a number with commas
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Get all dates between two dates (inclusive)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {string[]} Array of dates
 */
export function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
