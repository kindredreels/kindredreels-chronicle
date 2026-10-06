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

// Page by page with an explicit page number: `gh api --paginate` follows GitHub's
// Link headers, which name the repo by numeric id, and the session proxy refuses those.
function ghPages(path) {
  const all = [];
  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = JSON.parse(gh(`api "${path}${sep}per_page=100&page=${page}"`));
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const slug = getRepoSlug();
  console.log(`Extracting PRs from ${slug}...`);

  // Fetch all merged PRs in one call
  // REST, not `gh pr list`/`gh pr view`: those use GraphQL, which Claude Code
  // cloud sessions block. The records keep the GraphQL shape the rest of the
  // pipeline reads (camelCase fields, files capped at 100 as GraphQL returned them).
  console.log('Fetching merged PR list...');
  const pulls = ghPages(`repos/${slug}/pulls?state=closed`);
  const merged = pulls.filter(p => p.merged_at);
  console.log(`Found ${merged.length} merged PRs`);
  merged.sort((a, b) => new Date(a.merged_at) - new Date(b.merged_at));

  console.log('Fetching details, files and commits for each PR...');
  const enrichedPRs = [];

  for (let i = 0; i < merged.length; i++) {
    const p = merged[i];
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${merged.length}`);
    const detail = JSON.parse(gh(`api repos/${slug}/pulls/${p.number}`));
    const pr = {
      additions: detail.additions,
      body: detail.body,
      changedFiles: detail.changed_files,
      deletions: detail.deletions,
      files: [],
      headRefName: detail.head?.ref,
      labels: (detail.labels || []).map(l => ({ id: l.node_id, name: l.name, description: l.description, color: l.color })),
      mergedAt: detail.merged_at,
      number: detail.number,
      title: detail.title,
    };
    try {
      const files = JSON.parse(gh(`api "repos/${slug}/pulls/${p.number}/files?per_page=100"`));
      pr.files = files.slice(0, 100).map(f => ({ path: f.filename, additions: f.additions, deletions: f.deletions }));
    } catch (err) {
      console.warn(`    Warning: Could not fetch files for PR #${p.number}: ${err.message}`);
    }
    try {
      const commits = ghPages(`repos/${slug}/pulls/${p.number}/commits`);
      pr.commits = commits.map(c => {
        const [headline, ...rest] = c.commit.message.split('\n');
        return {
          authoredDate: c.commit.author?.date,
          authors: [{ email: c.commit.author?.email, login: c.author?.login ?? null, name: c.commit.author?.name }],
          committedDate: c.commit.committer?.date,
          messageBody: rest.join('\n').replace(/^\n+/, ''),
          messageHeadline: headline,
          oid: c.sha,
        };
      });
    } catch (err) {
      console.warn(`    Warning: Could not fetch commits for PR #${p.number}: ${err.message}`);
      pr.commits = [];
    }

    enrichedPRs.push(pr);
    if (i < merged.length - 1) await sleep(100);
  }

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedPRs, null, 2));
  console.log(`\nWrote ${enrichedPRs.length} PRs to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
