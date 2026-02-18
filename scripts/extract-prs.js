/**
 * Extract all merged PRs from the Kindred Reels GitHub repo
 * Uses `gh` CLI to fetch PR data including commit messages
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const OUTPUT_FILE = join(DATA_DIR, 'raw-prs.json');

// Get repo path from env
const repoPath = process.env.KINDRED_REELS_REPO_PATH;
if (!repoPath) {
  console.error('Error: KINDRED_REELS_REPO_PATH environment variable is required.');
  process.exit(1);
}

// Determine owner/repo from git remote
function getRepoSlug() {
  const remoteUrl = execSync('git remote get-url origin', {
    cwd: repoPath,
    encoding: 'utf-8'
  }).trim();

  // Handle SSH: git@github.com:owner/repo.git
  // Handle HTTPS: https://github.com/owner/repo.git
  const sshMatch = remoteUrl.match(/git@github\.com:(.+\/.+?)(?:\.git)?$/);
  const httpsMatch = remoteUrl.match(/github\.com\/(.+\/.+?)(?:\.git)?$/);
  const slug = (sshMatch && sshMatch[1]) || (httpsMatch && httpsMatch[1]);

  if (!slug) {
    console.error(`Could not parse repo slug from remote URL: ${remoteUrl}`);
    process.exit(1);
  }

  return slug;
}

function gh(args) {
  return execSync(`gh ${args}`, {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large responses
  }).trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const slug = getRepoSlug();
  console.log(`Extracting PRs from ${slug}...`);

  // Fetch all merged PRs in one call
  console.log('Fetching merged PR list...');
  const prFields = [
    'number', 'title', 'body', 'mergedAt', 'additions', 'deletions',
    'changedFiles', 'files', 'labels', 'headRefName'
  ].join(',');

  const prListJson = gh(`pr list --repo ${slug} --state merged --json ${prFields} --limit 300`);
  const prs = JSON.parse(prListJson);
  console.log(`Found ${prs.length} merged PRs`);

  // Sort by mergedAt ascending (oldest first)
  prs.sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));

  // Fetch commits for each PR
  console.log('Fetching commits for each PR...');
  const enrichedPRs = [];

  for (let i = 0; i < prs.length; i++) {
    const pr = prs[i];
    console.log(`  [${i + 1}/${prs.length}] PR #${pr.number}: ${pr.title}`);

    try {
      const commitJson = gh(`pr view ${pr.number} --repo ${slug} --json commits`);
      const { commits } = JSON.parse(commitJson);
      pr.commits = commits;
    } catch (err) {
      console.warn(`    Warning: Could not fetch commits for PR #${pr.number}: ${err.message}`);
      pr.commits = [];
    }

    enrichedPRs.push(pr);

    // Rate limiting delay (skip after last PR)
    if (i < prs.length - 1) {
      await sleep(200);
    }
  }

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedPRs, null, 2));
  console.log(`\nWrote ${enrichedPRs.length} PRs to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
