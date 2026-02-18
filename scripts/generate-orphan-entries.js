/**
 * Generate enriched entries from raw-orphan-commits.json.
 * Groups related same-day commits and applies hand-crafted enrichments.
 * Merges with existing entries.json and sorts chronologically.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const orphans = JSON.parse(readFileSync(join(DATA_DIR, 'raw-orphan-commits.json'), 'utf8'));
const existingEntries = JSON.parse(readFileSync(join(DATA_DIR, 'entries.json'), 'utf8'));

// Map orphans by 1-based index for easy grouping
const byIndex = {};
orphans.forEach((c, i) => { byIndex[i + 1] = c; });

// Group definitions: each group defines which orphan indices belong together
// and provides enrichment metadata
const groups = [
  // === EARLY ERA (Pre-PR, Oct 19 – Nov 21) ===
  {
    indices: [1, 2],
    id: "commits-2025-10-19-project-genesis",
    title: "Project genesis — initial repository and app skeleton",
    summary: "Initial repository setup with React/TypeScript frontend and Node.js backend scaffolding",
    detail: "Created the Kindred Reels repository (originally 'Loomed Memories') with the MIT LICENSE and initial application skeleton. The scaffolding included a Vite-powered React/TypeScript frontend and an Express.js backend, establishing the monorepo structure that would grow to over 100,000 lines. The initial commit included node_modules before a .gitignore was in place.",
    category: "infrastructure",
    tags: ["project-init", "scaffolding", "React", "Express", "monorepo"],
    significance: "major"
  },
  {
    indices: [3, 4, 5, 6],
    id: "commits-2025-11-09-first-working-app",
    title: "First working app — photo upload, voice recording, and database",
    summary: "Three weeks of rapid development delivering the first functional version with photo uploads, voice recording, and SQLite persistence",
    detail: "A massive leap from skeleton to working application: photo gallery with upload and HEIC support, voice recording attached to photos, project management CRUD, SQLite database with full schema, and a contributor-facing UI. This batch also established the Claude AI coding guidelines (.claude/CLAUDE.md), cleaned up accidentally committed binary files and database, removed node_modules from tracking, and documented the database setup.",
    category: "backend",
    tags: ["first-working-app", "photo-upload", "voice-recording", "SQLite", "HEIC"],
    significance: "major"
  },
  {
    indices: [7],
    id: "commit-21d3bc7",
    title: "Cloud migration — DynamoDB and S3 replace SQLite and local storage",
    summary: "Migrated from SQLite to DynamoDB and from local file storage to S3, preparing for serverless deployment",
    detail: "Rewrote all database operations from SQLite queries to DynamoDB single-table design with partition/sort key access patterns. Migrated photo and recording storage from the local filesystem to S3 with pre-signed URLs. Restructured handlers to work in both Express and Lambda contexts, preparing the backend for serverless deployment.",
    category: "infrastructure",
    tags: ["DynamoDB", "S3", "cloud-migration", "serverless-prep", "single-table-design"],
    significance: "major"
  },
  {
    indices: [8, 9, 14],
    id: "commits-2025-11-11-lambda-deploy",
    title: "Lambda deployment with GitHub Actions CI/CD pipeline",
    summary: "Backend deployed as AWS Lambda via Serverless Framework with automated GitHub Actions workflows for frontend and backend",
    detail: "Deployed the Express backend as an AWS Lambda function using the Serverless Framework, with API Gateway as the HTTP endpoint. Created two GitHub Actions workflows: one deploying the frontend to S3 with CloudFront distribution, another deploying the backend Lambda. Set up CloudFront distribution scripting, HTTPS configuration documentation, and environment variable management for production. Also configured GitHub Action secrets for OAuth integration.",
    category: "devops",
    tags: ["Lambda", "Serverless-Framework", "GitHub-Actions", "CI/CD", "CloudFront"],
    significance: "major"
  },
  {
    indices: [10, 11, 12, 13],
    id: "commits-2025-11-11-google-oauth",
    title: "Google OAuth authentication with Cognito integration",
    summary: "Complete authentication system with Google OAuth sign-in powered by AWS Cognito, plus frontend deployment fixes",
    detail: "Built the authentication layer: AWS Cognito user pool with Google OAuth integration, a login page, callback handler, AuthContext provider with token management, and protected routes. Created Cognito setup and configuration scripts. Fixed several frontend deployment issues including action workflow bugs, component import errors, and HTTPS proxy configuration for local development.",
    category: "backend",
    tags: ["Google-OAuth", "Cognito", "authentication", "AuthContext", "protected-routes"],
    significance: "major"
  },
  {
    indices: [15, 16, 17, 18, 19, 20, 21],
    id: "commits-2025-11-15-user-auth",
    title: "User authorization, per-user projects, and mobile photo view",
    summary: "JWT-based auth middleware, per-user project isolation, HEIC conversion, and a mobile-optimized photo detail view",
    detail: "Added three layers of backend auth middleware (required auth, optional auth, authorization), ensuring users can only access their own projects. Implemented Python-based HEIC-to-JPEG conversion, per-user project filtering, and a mobile-optimized photo detail view with audio playback. Fixed multiple Lambda deployment issues including secrets configuration, IAM permissions, and package builds across five targeted fix commits.",
    category: "backend",
    tags: ["auth-middleware", "user-isolation", "HEIC-conversion", "mobile-view", "Lambda-fixes"],
    significance: "major"
  },
  {
    indices: [22, 23],
    id: "commits-2025-11-19-video-generation",
    title: "Local video generation with Ken Burns effects and music",
    summary: "Python video creation pipeline generating cinematic slideshows with Ken Burns zoom/pan effects and background music",
    detail: "Built the core video generation system: a Python pipeline that downloads photos and recordings from S3, applies Ken Burns camera movements to each photo, overlays voice recordings, mixes in background music, and renders an MP4 video. The frontend gained a generate button, video status polling, a video player component, and a videos list. Also cleaned up accidentally committed video output files from git tracking.",
    category: "processing",
    tags: ["video-generation", "Ken-Burns", "Python", "video-player", "FFmpeg"],
    significance: "major"
  },
  {
    indices: [24, 25, 26],
    id: "commits-2025-11-19-video-cloud",
    title: "Cloud video processing with Lambda orchestration and SQS queue",
    summary: "Video processing moved to the cloud with SQS queue triggering Lambda-based processing in a Docker container",
    detail: "Extended the video pipeline for cloud execution: an SQS queue receives generation requests, a Docker-containerized Lambda function processes them, and results upload to S3. Created deployment scripts for ECR and Lambda, build scripts for the Docker image and Lambda layers, and added processing dependencies. Updated Claude guidelines and progress docs. Cleaned up large files and expanded gitignore patterns.",
    category: "infrastructure",
    tags: ["SQS", "Lambda-processing", "Docker", "ECR", "cloud-processing"],
    significance: "moderate"
  },
  {
    indices: [27, 28, 29],
    id: "commits-2025-11-21-ec2-spot",
    title: "EC2 Spot instances replace Lambda for video processing",
    summary: "Migrated video processing from Lambda containers to EC2 Spot instances for longer processing times and GPU access",
    detail: "Lambda's 15-minute timeout was insufficient for longer videos, so processing moved to EC2 Spot instances that auto-start when an SQS message arrives and auto-stop when idle. Built the EC2 controller with start/stop/status API, an admin dashboard for instance management, and comprehensive local setup documentation (LOCAL_SETUP.md). Modernized the README, removing bloated setup instructions and outdated SQLite references. Removed all Lambda/Docker video processing infrastructure in favor of the simpler EC2 approach.",
    category: "infrastructure",
    tags: ["EC2-Spot", "auto-scaling", "Lambda-removal", "admin-dashboard", "local-setup"],
    significance: "major"
  },

  // === HOTFIX ERA (Nov 24 – Feb 17) ===
  {
    indices: [31, 32],
    id: "commits-2025-11-25-landing-page",
    title: "Landing page update with examples section and video modal",
    summary: "Updated landing page with new hero text, example video cards, and a lightbox video modal",
    detail: "Refreshed the landing page with a new hero headline ('Your People. Their Voices. Woven Together.'), an examples section showcasing memorial, anniversary, and retirement use cases with interactive cards, and a video lightbox modal for viewing example reels hosted on CloudFront. Updated the example reel video reference.",
    category: "design",
    tags: ["landing-page", "hero-text", "examples", "video-modal", "CloudFront"],
    significance: "moderate"
  },
  {
    indices: [30, 33],
    id: "commits-2025-11-26-docs-infra",
    title: "Documentation updates for EC2 and CI/CD configuration",
    summary: "Updated EC2 instance documentation, CI/CD workflow docs, and font compatibility notes",
    detail: "Updated documentation to reflect the current EC2 instance ID and configuration, documented the GitHub Actions CI/CD deployment workflow, and noted the Noto Sans font requirement for EC2 video text rendering. Also updated photo metadata and video creation documentation.",
    category: "docs",
    tags: ["documentation", "EC2", "CI/CD", "fonts"],
    significance: "minor"
  },
  {
    indices: [34, 35],
    id: "commits-2025-11-27-video-fixes",
    title: "Fix EC2 font rendering and corrupted video record handling",
    summary: "Fixed font rendering failures on EC2 Linux and added defensive handling for video records missing their videoId",
    detail: "Resolved 'cannot open resource' errors on EC2 by switching from font names to full filesystem paths for Pillow compatibility across Linux and macOS. Adjusted title/credits slide animations. Added fallback logic for corrupted video records where DynamoDB update_item created incomplete records without a videoId — the backend now extracts videoId from the sort key as a fallback, and the frontend filters out entries without valid IDs.",
    category: "processing",
    tags: ["EC2-fonts", "Pillow", "video-records", "defensive-coding", "bug-fix"],
    significance: "minor"
  },
  {
    indices: [36, 37],
    id: "commits-2025-11-28-4k-rendering",
    title: "4K video rendering with hybrid Ken Burns and processing benchmarks",
    summary: "Upgraded video output to 4K resolution with improved Ken Burns effects and subprocess deadlock fix",
    detail: "Major video quality upgrade to 3840x2160 resolution. Implemented a hybrid Ken Burns effect using cv2.warpAffine for smoother frame generation. Fixed a critical subprocess deadlock caused by pipe buffer filling by switching stdout/stderr to DEVNULL. Added batch-aware ETA progress reporting. Also added 4K benchmark and stress test scripts, Ken Burns test utilities, and updated EC2 instance documentation to reflect c6i.2xlarge on-demand instances.",
    category: "processing",
    tags: ["4K-video", "Ken-Burns", "deadlock-fix", "benchmarks", "cv2"],
    significance: "moderate"
  },
  {
    indices: [38, 39, 40, 41, 42],
    id: "commits-2025-11-29-prod-fixes",
    title: "Production fixes — resolution verification, missing Lambda, and documentation",
    summary: "Fixed video resolution verification, added the missing image processor Lambda, and updated project documentation with architecture diagram",
    detail: "Five targeted fixes in one day: corrected the hardcoded 720p resolution check to use actual selected resolution parameters, committed the missing imageProcessor.py Lambda function (handles HEIC-to-JPEG conversion, EXIF extraction, and Rekognition face detection), added backend build artifacts to gitignore, updated the README project structure to match the current codebase layout, and added a Mermaid architecture diagram showing the full AWS resource topology from CloudFront to EC2.",
    category: "backend",
    tags: ["resolution-fix", "imageProcessor", "Lambda", "Rekognition", "architecture-diagram"],
    significance: "minor"
  },
  {
    indices: [43, 44],
    id: "commits-2025-12-08-maintenance",
    title: "Package lock fix and release script setup",
    summary: "Fixed missing package-lock entry lost during merge conflict and added a version release script",
    detail: "Restored the @epic-web/invariant entry in package-lock.json that was lost during merge conflict resolution (it's a transitive dependency of cross-env). Added a release script for streamlining version bumps and deployments.",
    category: "devops",
    tags: ["package-lock", "merge-conflict", "release-script", "maintenance"],
    significance: "minor"
  },
  {
    indices: [45, 46],
    id: "commits-2025-12-23-cleanup",
    title: "Repository cleanup and CodeChronicle daily tracking",
    summary: "Removed unused test data files and added all-days tracking to the CodeChronicle analytics tool",
    detail: "Cleaned up the repository by removing old test photos and audio files from the processing/data directory and resolving a merge conflict in the Claude configuration. Enhanced the CodeChronicle codebase analytics tool to track code statistics for every day of the project's history rather than just weekly snapshots.",
    category: "docs",
    tags: ["cleanup", "test-data-removal", "CodeChronicle", "daily-tracking"],
    significance: "minor"
  },
  {
    indices: [47],
    id: "commit-fcc9484",
    title: "Recording bug fixes for contributor flow",
    summary: "Fixed multiple issues with the voice recording flow affecting contributor experience",
    detail: "Addressed several recording-related bugs impacting the contributor experience: fixes to recording state management, audio playback issues, and recording association with the correct memory context across multiple components.",
    category: "frontend",
    tags: ["recording-bugs", "contributor-flow", "audio-playback", "bug-fix"],
    significance: "minor"
  },
  {
    indices: [48, 49],
    id: "commits-2026-01-05-tooling",
    title: "CodeChronicle weekly/monthly views and Cloud Run config",
    summary: "Enhanced CodeChronicle with weekly and monthly aggregation views, and added Cloud Run deployment configuration",
    detail: "Extended the CodeChronicle analytics dashboard with weekly and monthly views that aggregate code statistics into broader time periods for trend analysis. Also added Cloud Run configuration YAML files for deploying the photo enhancement AI service.",
    category: "infrastructure",
    tags: ["CodeChronicle", "weekly-monthly", "Cloud-Run", "analytics"],
    significance: "minor"
  },
  {
    indices: [50, 51],
    id: "commits-2026-01-06-prod-fixes",
    title: "Production fixes and content cleanup",
    summary: "Minor production bug fixes and removal of an outdated reference from team bios",
    detail: "Targeted production fixes addressing deployment configuration issues. Cleaned up the landing page by removing an outdated MetaCTF reference from a team member's bio.",
    category: "frontend",
    tags: ["production-fix", "content-cleanup", "landing-page"],
    significance: "minor"
  },
  {
    indices: [52, 53],
    id: "commits-2026-01-07-lambda-fixes",
    title: "S3 bucket debugging and sharp layer fix for AI Producer Lambda",
    summary: "Added S3 bucket logging to diagnose a production bucket mismatch, and fixed the AI Producer worker Lambda's missing sharp dependency",
    detail: "Added diagnostic logging to the project handler and storage module to track which S3 bucket the production Lambda was using at runtime, after discovering it appeared to be accessing the dev bucket instead of prod. Fixed the AI Producer worker Lambda failing with 'Cannot find package sharp' by adding the sharp Lambda layer to its configuration.",
    category: "backend",
    tags: ["S3-debugging", "sharp-layer", "Lambda-fix", "production-diagnosis"],
    significance: "minor"
  },
  {
    indices: [54],
    id: "commit-e207814",
    title: "Allow re-running AI Producer from applied status",
    summary: "Fixed AI Producer stages to accept 'applied' status for re-running the entire analysis flow",
    detail: "Updated the AI Producer's filter and chronology stages to accept 'applied' as a valid starting status, allowing hosts to re-run the AI analysis pipeline on a project that has already been organized. Previously, once a project's AI results were applied, the pipeline couldn't be re-triggered. Also added PARKING_LOT.md to track deferred issues.",
    category: "ai",
    tags: ["AI-Producer", "status-fix", "re-run", "parking-lot"],
    significance: "minor"
  },
  {
    indices: [55],
    id: "commit-e617eae",
    title: "Add Playwright test dependencies",
    summary: "Added Playwright npm package to the project for end-to-end testing infrastructure",
    detail: "Installed the Playwright npm package and updated package configuration to support the end-to-end testing infrastructure being built for authentication and project lifecycle tests.",
    category: "devops",
    tags: ["Playwright", "E2E-testing", "dependencies"],
    significance: "minor"
  },
  {
    indices: [56],
    id: "commit-9b45c5c",
    title: "Production GCS, Vertex AI, and auth reliability fixes",
    summary: "Fixed Vertex AI credentials in Lambda, stage-aware GCS bucket routing, and SQS queue URL configuration",
    detail: "Resolved three intertwined production issues: Vertex AI credentials weren't loading in Lambda because genai.Client ignores the credentials parameter — fixed by writing service account JSON to /tmp and setting GOOGLE_APPLICATION_CREDENTIALS so google.auth.default() finds it. Made the GCS service stage-aware instead of hardcoded to the dev bucket. Fixed the SQS photo processing queue URL not being set correctly in the production environment.",
    category: "infrastructure",
    tags: ["Vertex-AI", "GCS", "credentials", "SQS", "production-fix"],
    significance: "moderate"
  },
  {
    indices: [57, 58],
    id: "commits-2026-02-17-cleanup",
    title: "EXIF improvements and code-chronicle extraction",
    summary: "Added EXIF metadata change tracking and removed the code-chronicle tool from the main repository",
    detail: "Extended EXIF metadata handling to capture additional fields for better photo date and location tracking. Removed the entire code-chronicle directory (2,701 lines across 9 files) from the main Kindred Reels repository, as it was being extracted into this standalone Chronicle project.",
    category: "docs",
    tags: ["EXIF", "code-chronicle", "extraction", "cleanup"],
    significance: "minor"
  }
];

// Build entries from groups
function buildEntry(group) {
  const commits = group.indices.map(i => byIndex[i]);
  const latestCommit = commits.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
  const earliestCommit = commits.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b);

  // Aggregate stats (exclude node_modules for cleaner numbers)
  let totalAdditions = 0;
  let totalDeletions = 0;
  const fileMap = new Map(); // path -> { additions, deletions }

  for (const commit of commits) {
    for (const file of commit.filesChanged) {
      // Skip node_modules and package-lock for cleaner stats
      if (file.path.includes('node_modules/')) continue;

      const existing = fileMap.get(file.path);
      if (existing) {
        existing.additions += file.additions;
        existing.deletions += file.deletions;
      } else {
        fileMap.set(file.path, { path: file.path, additions: file.additions, deletions: file.deletions });
      }
    }
  }

  const filesChanged = [...fileMap.values()].sort((a, b) =>
    (b.additions + b.deletions) - (a.additions + a.deletions)
  );

  totalAdditions = filesChanged.reduce((s, f) => s + f.additions, 0);
  totalDeletions = filesChanged.reduce((s, f) => s + f.deletions, 0);

  // Build commit messages
  const commitMessages = commits.map(c => {
    const parts = [c.headline];
    if (c.body) parts.push(c.body);
    return parts.join('\n\n');
  });

  return {
    id: group.id,
    prNumber: null,
    date: earliestCommit.date.slice(0, 10),
    mergedAt: latestCommit.date,
    title: group.title,
    branch: "main",
    summary: group.summary,
    detail: group.detail,
    category: group.category,
    tags: group.tags,
    significance: group.significance,
    stats: {
      additions: totalAdditions,
      deletions: totalDeletions,
      changedFiles: filesChanged.length
    },
    filesChanged,
    commitMessages
  };
}

const orphanEntries = groups.map(buildEntry);

// Validate all orphan indices are covered
const coveredIndices = new Set();
for (const group of groups) {
  for (const idx of group.indices) {
    if (coveredIndices.has(idx)) {
      console.error(`ERROR: Orphan index ${idx} is in multiple groups!`);
      process.exit(1);
    }
    coveredIndices.add(idx);
  }
}
const allIndices = new Set(orphans.map((_, i) => i + 1));
const uncovered = [...allIndices].filter(i => !coveredIndices.has(i));
if (uncovered.length > 0) {
  console.warn(`Warning: ${uncovered.length} orphan commits not in any group: ${uncovered.join(', ')}`);
  uncovered.forEach(i => {
    const c = byIndex[i];
    console.warn(`  #${i}: ${c.date.slice(0, 10)} ${c.headline}`);
  });
}

// Merge with existing entries
const allEntries = [...existingEntries, ...orphanEntries];

// Sort chronologically by mergedAt
allEntries.sort((a, b) => new Date(a.mergedAt) - new Date(b.mergedAt));

// Write output
writeFileSync(join(DATA_DIR, 'entries.json'), JSON.stringify(allEntries, null, 2));

console.log(`\nGenerated ${orphanEntries.length} orphan entries`);
console.log(`Merged with ${existingEntries.length} existing entries`);
console.log(`Total: ${allEntries.length} entries`);
console.log(`\nOrphan entries by era:`);
const earlyEntries = orphanEntries.filter(e => new Date(e.mergedAt) < new Date('2025-11-22'));
const hotfixEntries = orphanEntries.filter(e => new Date(e.mergedAt) >= new Date('2025-11-22'));
console.log(`  Pre-PR (Oct 19 – Nov 21): ${earlyEntries.length} entries`);
console.log(`  Hotfixes (Nov 25 – Feb 17): ${hotfixEntries.length} entries`);
console.log(`\nCategories: ${[...new Set(orphanEntries.map(e => e.category))].sort().join(', ')}`);
