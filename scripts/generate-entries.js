/**
 * Generate entries.json from raw-prs.json with enriched metadata.
 * This is a one-time generation script — enrichments are hand-crafted.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const prs = JSON.parse(readFileSync(join(DATA_DIR, 'raw-prs.json'), 'utf8'));

// Enrichment data keyed by PR number
const enrichments = {
  3: {
    summary: "Shareable contribution links let family members record voice memories without authentication",
    detail: "Built the entire contribution flow from database to UI: share codes with DynamoDB GSI lookups, four REST endpoints for code lifecycle, and a mobile-first recording page. Contributors land on a public URL, enter their name (persisted in localStorage), see the photo, and record a 30-second voice memory. Hosts generate share links with QR codes from the project dashboard. Also fixed a critical EC2 Spot instance issue where missing IAM permissions caused an infinite auto-stop retry loop for 8+ hours.",
    category: "frontend",
    tags: ["share-codes", "voice-recording", "contributor-flow", "mobile-first", "DynamoDB"],
    significance: "major"
  },
  4: {
    summary: "Video creation pipeline with progress tracking, background music upload, and backend test infrastructure",
    detail: "A large batch of foundational work spanning video processing, music handling, and testing. Added progress tracking to video generation, background music upload via pre-signed S3 URLs, and set up Jest testing infrastructure for the backend. The processing module got significant improvements to the Python video creation pipeline, including a local processor script for development.",
    category: "processing",
    tags: ["video-generation", "music-upload", "testing", "S3", "progress-tracking"],
    significance: "major"
  },
  5: {
    summary: "Beat-synced slideshow transitions that time photo changes to music rhythm",
    detail: "Implemented audio analysis using librosa to detect beats in background music, then synchronize photo transitions to those beats. The system analyzes uploaded music files, identifies beat positions, and generates a timing map that the video renderer uses for slide transitions. This creates a much more cinematic feel where visual changes align with musical rhythm. Includes comprehensive beat detection testing.",
    category: "processing",
    tags: ["beat-sync", "music-analysis", "librosa", "video-timing", "audio"],
    significance: "major"
  },
  6: {
    summary: "Contributors can now upload their own photos and contribute to multiple photos at once",
    detail: "Extended the contribution flow so contributors can upload photos directly, not just record voice memories. Fixed a significant bug where removing HEIC photos from the upload UI didn't actually delete them from the server, resulting in deselected photos still appearing in the final project. Also added the ability to contribute recordings to multiple photos in a single session.",
    category: "frontend",
    tags: ["contributor-flow", "photo-upload", "HEIC", "bug-fix"],
    significance: "moderate"
  },
  7: {
    summary: "Introduced a marketing landing page and refactored application routing structure",
    detail: "Created the first landing page for Kindred Reels, separating the public marketing presence from the authenticated application. Refactored the routing system to support both public and protected routes cleanly. The landing page introduces the value proposition of creating cinematic video memories from family photos and recordings.",
    category: "frontend",
    tags: ["landing-page", "routing", "marketing", "UX"],
    significance: "moderate"
  },
  8: {
    summary: "Minor responsive layout fix for main content container widths and padding",
    detail: "Adjusted max-width and added responsive padding to the main containers on the project dashboard and projects list pages. A small but necessary followup to the landing page work.",
    category: "frontend",
    tags: ["responsive", "CSS", "layout"],
    significance: "minor"
  },
  9: {
    summary: "Extract EXIF date and GPS location metadata from uploaded photos including HEIC",
    detail: "Added automatic extraction of EXIF metadata when photos are uploaded, pulling out the original capture date and GPS coordinates. This enables chronological photo ordering and potential location-based features. Handles both standard JPEG EXIF and Apple's HEIC format, which required additional parsing logic. Includes troubleshooting documentation for EXIF edge cases.",
    category: "backend",
    tags: ["EXIF", "metadata", "HEIC", "geolocation", "photo-upload"],
    significance: "moderate"
  },
  10: {
    summary: "Filmstrip photo ordering, toast notifications, and rebrand from Loomed Memories to Kindred Reels",
    detail: "A significant UI overhaul that introduced a filmstrip-style photo ordering interface, allowing hosts to drag photos into their preferred sequence. Added a toast notification system for user feedback. Most notably, this PR executed the rebrand from 'Loomed Memories' to 'Kindred Reels' across the entire codebase — updating component names, API endpoints, documentation, and branding assets.",
    category: "frontend",
    tags: ["filmstrip", "drag-and-drop", "rebrand", "toast-notifications", "UX"],
    significance: "major"
  },
  11: {
    summary: "Video generation progress tracking UI with contributor overlay and backend video status updates",
    detail: "Enhanced the video generation experience with real-time progress tracking. The frontend now shows a progress modal during generation, and the backend streams status updates. Also added contributor name overlays to the generated videos so viewers can see who recorded each memory.",
    category: "frontend",
    tags: ["progress-tracking", "video-generation", "contributor-overlay", "real-time"],
    significance: "moderate"
  },
  12: {
    summary: "GitHub Actions CI/CD workflow for deploying the Python video processing service to EC2",
    detail: "Created the first deployment automation for the video processing pipeline. The GitHub Actions workflow packages the Python processing code and deploys it to the EC2 instance that handles video generation. This was a key step in moving from manual SSH deployments to automated CI/CD.",
    category: "devops",
    tags: ["GitHub-Actions", "CI/CD", "EC2", "deployment"],
    significance: "moderate"
  },
  13: {
    summary: "Fix EC2 font compatibility and remove tracked binary files from git",
    detail: "Fixed video text overlays failing on EC2 by switching from Arial (not installed on Amazon Linux) to Noto Sans. Also cleaned up accidentally tracked .DS_Store and .pyc files from the repository.",
    category: "processing",
    tags: ["EC2", "fonts", "git-cleanup"],
    significance: "minor"
  },
  14: {
    summary: "Complete multi-method authentication system with Cognito account linking across providers",
    detail: "Built a comprehensive authentication system supporting email/password, Google OAuth, and Apple Sign-In, all unified through AWS Cognito. The key challenge was account linking — when a user signs in with Google after previously using email, the system detects the existing account and links the providers automatically. Includes Cognito pre-signup and post-confirmation triggers for seamless provider merging.",
    category: "backend",
    tags: ["authentication", "Cognito", "OAuth", "account-linking", "security"],
    significance: "major"
  },
  15: {
    summary: "Switch music uploads to use pre-signed S3 URLs for direct browser-to-S3 transfer",
    detail: "Replaced the server-proxied music upload flow with pre-signed S3 URLs. Instead of streaming music files through the backend Lambda (which has size and timeout limits), the frontend now requests a pre-signed URL and uploads directly to S3. This removes the file size constraint and improves upload reliability.",
    category: "backend",
    tags: ["S3", "pre-signed-URLs", "music-upload", "performance"],
    significance: "minor"
  },
  16: {
    summary: "Comprehensive admin area with user management, project oversight, content moderation, and system stats",
    detail: "Built an entire admin panel with four major sections: user management (view/search users, see their projects), project administration (browse all projects, view details), content management (moderate photos and recordings), and system statistics (storage usage, active users, processing queue). Protected behind admin role checks. The admin area provides essential operational visibility into the platform.",
    category: "frontend",
    tags: ["admin-panel", "user-management", "moderation", "analytics", "RBAC"],
    significance: "major"
  },
  17: {
    summary: "Upgrade video processing to GPU-accelerated g6.xlarge EC2 instance type",
    detail: "Migrated the video processing infrastructure from CPU-based instances to NVIDIA GPU-accelerated g6.xlarge instances. This enables hardware-accelerated video encoding via NVENC, dramatically reducing processing time for video generation.",
    category: "infrastructure",
    tags: ["GPU", "EC2", "NVENC", "performance"],
    significance: "moderate"
  },
  18: {
    summary: "Fix missing systemd service setup in the GitHub Actions EC2 deployment workflow",
    detail: "The processing deployment workflow was missing the systemd service configuration step, causing the video processor to not auto-start after deployment. Added the systemd setup to ensure the processing service starts automatically.",
    category: "devops",
    tags: ["systemd", "GitHub-Actions", "deployment-fix"],
    significance: "minor"
  },
  19: {
    summary: "Migrated from MoviePy to parallel FFmpeg for 10x video processing speedup",
    detail: "A major performance breakthrough in video processing. Replaced the MoviePy-based pipeline with direct FFmpeg calls, rendering each photo as a separate segment in parallel then concatenating them. This reduced processing time from ~15 minutes to ~39 seconds for a 10-photo video. The journey involved debugging NVENC compatibility issues — MoviePy's bundled ffmpeg lacked GPU support, so the system was configured to use the system ffmpeg with NVENC encoding. Added phase-based progress tracking with ETA calculations.",
    category: "processing",
    tags: ["FFmpeg", "parallel-processing", "performance", "NVENC", "10x-speedup"],
    significance: "major"
  },
  20: {
    summary: "Modular video processing refactor with resolution selector and improved Ken Burns effects",
    detail: "Refactored the monolithic video creation script into a clean modular architecture: models (settings, constants, resolution presets), audio processing, Ken Burns effects using cv2.warpAffine, and slide generation. Added a resolution selector in the UI so users can choose video quality. Significantly reduced code complexity by eliminating 6,736 lines of the old implementation.",
    category: "processing",
    tags: ["refactor", "modularity", "Ken-Burns", "resolution", "video-architecture"],
    significance: "major"
  },
  21: {
    summary: "Fix deployment to include the video package directory on EC2",
    detail: "Quick fix to the GitHub Actions deployment workflow — the newly refactored video processing package directory wasn't being included in the EC2 deployment bundle.",
    category: "devops",
    tags: ["deployment-fix", "EC2"],
    significance: "minor"
  },
  22: {
    summary: "Major frontend reorganization: split 1,374-line API file into domain modules, add hooks and testing",
    detail: "A comprehensive frontend cleanup that split the monolithic 1,374-line api.ts into domain-based modules (photos, recordings, projects, videos, share, music, user, admin), each with its own focused API client. Extracted custom hooks (useToast, useAsync, useAsyncEffect) into a dedicated hooks directory. Reorganized components into logical subdirectories (audio, photos, modals, etc.). Set up Vitest and React Testing Library infrastructure. Maintains backward compatibility through re-exports.",
    category: "frontend",
    tags: ["refactor", "API-modules", "custom-hooks", "testing-infrastructure", "code-organization"],
    significance: "major"
  },
  23: {
    summary: "AWS Rekognition face detection to guide Ken Burns camera movements toward faces",
    detail: "Integrated AWS Rekognition to detect faces in uploaded photos and use the face bounding box coordinates as focal points for Ken Burns camera movements. Instead of random zoom/pan, the camera now gravitates toward detected faces, creating more emotionally engaging video segments. The face detection runs asynchronously during photo upload processing.",
    category: "ai",
    tags: ["Rekognition", "face-detection", "Ken-Burns", "computer-vision"],
    significance: "major"
  },
  24: {
    summary: "Smart face selection algorithm that picks the most prominent face for adaptive Ken Burns zoom",
    detail: "Built on the initial face detection to add intelligence about which face to focus on. When multiple faces are detected, the algorithm selects the most prominent one based on size and centrality. The Ken Burns effect now uses adaptive zoom levels — closer zoom for distant faces, wider for close-ups — creating more natural camera movements.",
    category: "processing",
    tags: ["face-selection", "adaptive-zoom", "Ken-Burns", "algorithm"],
    significance: "moderate"
  },
  25: {
    summary: "Backend codebase cleanup removing 1,135 lines of dead code and reorganizing module structure",
    detail: "Spring cleaning for the backend: removed obsolete test scripts, consolidated handler files, cleaned up unused imports and dead code paths, and reorganized the admin handler structure. Reduced the codebase by over 1,100 lines while maintaining all functionality.",
    category: "backend",
    tags: ["refactor", "cleanup", "dead-code-removal"],
    significance: "minor"
  },
  26: {
    summary: "Music normalization pipeline with loudness analysis and admin music library management UI",
    detail: "Built an audio normalization system that analyzes uploaded music tracks for loudness (using LUFS measurement) and normalizes them to a consistent level. This ensures background music plays at an even volume regardless of the source file. Added an admin UI for managing the global music library — uploading, categorizing, and previewing tracks. The normalization runs as part of the music upload pipeline.",
    category: "backend",
    tags: ["audio-normalization", "LUFS", "music-library", "admin-UI"],
    significance: "moderate"
  },
  27: {
    summary: "Remove unused showControlsLeft prop from PhotoGallery component",
    detail: "One-line cleanup removing a prop that was no longer used after the frontend reorganization.",
    category: "frontend",
    tags: ["cleanup"],
    significance: "minor"
  },
  28: {
    summary: "Documentation update for the music normalization feature and overall progress tracking",
    detail: "Updated CLAUDE.md, progress.md, and README with documentation covering the music normalization system, its technical approach (LUFS-based analysis), and admin management capabilities.",
    category: "docs",
    tags: ["documentation", "music-normalization"],
    significance: "minor"
  },
  29: {
    summary: "Contributor recording flow improvements with guidance prompts and volume feedback",
    detail: "Enhanced the contributor experience with pre-recording guidance ('find a quiet spot' reminder), expandable help prompts personalized to the context, and post-recording volume feedback using the Web Audio API. Added a focused recording mode that hides distractions during active recording, showing only the photo and recording controls.",
    category: "frontend",
    tags: ["contributor-UX", "recording-guidance", "Web-Audio-API", "focused-mode"],
    significance: "moderate"
  },
  30: {
    summary: "Compact mobile recording UI with inline audio player and real-time volume visualization",
    detail: "Redesigned the mobile recording interface to be more compact and touch-friendly. Added an inline audio player for reviewing recordings without leaving the page, and real-time volume visualization during recording so contributors can see their audio levels. The compact design ensures the full interface fits on mobile screens without scrolling.",
    category: "frontend",
    tags: ["mobile-UI", "audio-player", "volume-visualization", "compact-design"],
    significance: "moderate"
  },
  31: {
    summary: "Mobile-responsive layout overhaul for header, dashboard, photo gallery, and video list",
    detail: "Systematic mobile responsiveness pass across the core application surfaces. The header collapses into a hamburger menu, the dashboard adapts its grid layout, the photo gallery uses touch-friendly sizing, and the video list stacks vertically on narrow screens. Ensures the core user journey works well on phones and tablets.",
    category: "frontend",
    tags: ["mobile-responsive", "CSS", "layout", "touch-friendly"],
    significance: "moderate"
  },
  32: {
    summary: "Photo grouping system allowing shared voice recordings across multiple related photos",
    detail: "Introduced the concept of photo groups — collections of 1-5 related photos that share a single voice recording. This was a key conceptual shift: instead of one recording per photo, a contributor narrates a story that spans multiple images. The backend manages group membership and ordering, while the frontend provides drag-and-drop group creation. Groups become the atomic unit for video segments.",
    category: "backend",
    tags: ["photo-groups", "data-model", "drag-and-drop", "video-segments"],
    significance: "major"
  },
  33: {
    summary: "Group contributor flow with compact recording interface and auto-playing slideshow preview",
    detail: "Extended the contributor experience to work with photo groups. Contributors now see an auto-playing slideshow of the grouped photos while recording, giving them visual context for their narration. The recording UI was made more compact to accommodate the slideshow. Share links were updated to support group-level contribution.",
    category: "frontend",
    tags: ["group-recording", "slideshow-preview", "contributor-flow"],
    significance: "moderate"
  },
  34: {
    summary: "Decouple recordings from photos, add Contributors section, and create tabbed dashboard layout",
    detail: "A significant data model evolution: recordings are now tied to groups (later 'memories') rather than individual photos, enabling the multi-photo narration model. Added a Contributors section to the dashboard showing all contributors and their recordings. Refactored the project dashboard into a tabbed layout (Photos, Memories, Contributors, Videos) for better organization as the feature set grew. Includes a database migration script.",
    category: "frontend",
    tags: ["data-model", "recording-decoupling", "tabbed-dashboard", "contributors-section"],
    significance: "major"
  },
  35: {
    summary: "Production CI/CD workflow with email and SMS invitation system for contributors",
    detail: "Two major additions: a complete production deployment workflow using GitHub Actions (frontend to S3/CloudFront, backend via Serverless, processing to EC2), and an email/SMS invitation system for inviting family members to contribute. Contributors receive personalized links via AWS SES (email) or SNS (SMS) with a direct path to the recording flow. This was a critical milestone for making the platform usable by real families.",
    category: "devops",
    tags: ["CI/CD", "production-deployment", "email-invitations", "SMS", "SES", "SNS"],
    significance: "major"
  },
  36: {
    summary: "Fix missing Cognito environment variables in the production deployment workflow",
    detail: "Quick fix to add Cognito user pool and client ID environment variables to the serverless info step in the deploy workflow. Without these, the backend couldn't authenticate users in production.",
    category: "devops",
    tags: ["deployment-fix", "Cognito", "env-vars"],
    significance: "minor"
  },
  37: {
    summary: "Add .env.production to repository for CI/CD frontend builds",
    detail: "Committed the production environment configuration file so the CI/CD pipeline can build the frontend with the correct API endpoints and configuration values. Updated .gitignore to allow this specific env file.",
    category: "devops",
    tags: ["deployment-fix", "env-config", "CI/CD"],
    significance: "minor"
  },
  38: {
    summary: "Add Kindred Reels favicon and update browser tab title",
    detail: "Added a branded SVG favicon and updated the HTML page title from the default Vite title to 'Kindred Reels'. A small branding touch that completes the rebrand started in PR #10.",
    category: "design",
    tags: ["branding", "favicon", "polish"],
    significance: "minor"
  },
  39: {
    summary: "Replace the Groups data model with Memories — a recording attached to 1-5 photos",
    detail: "Major conceptual refactor renaming and evolving 'Groups' into 'Memories'. A Memory is now the core unit: a voice recording attached to 1-5 photos that plays while those photos display in the video. The Memory has a lifecycle (pending → complete) and tracks its assigned contributor. This refactor touched 46 files, replacing the entire groups infrastructure with the more intuitive memories model. Includes a database migration script for existing data.",
    category: "backend",
    tags: ["data-model", "memories", "refactor", "migration", "core-concept"],
    significance: "major"
  },
  40: {
    summary: "Documentation reorganization moving all docs to /docs/ folder with updated progress tracking",
    detail: "Moved all documentation files into a centralized /docs/ directory, keeping only README.md and CLAUDE.md at the root. Created structured documentation with separate files for local setup, deployment, production, HTTPS, coding guidelines, and progress tracking. This established a clean documentation architecture as the project's complexity grew.",
    category: "docs",
    tags: ["documentation", "organization", "project-structure"],
    significance: "minor"
  },
  41: {
    summary: "Draft memories workflow with visual state management and improved Photo Library UX",
    detail: "Introduced a three-state memory lifecycle: Draft (host groups photos), Pending (assigned to contributor), and Complete (recording done). Hosts can now create draft memories to group photos before assigning contributors, record memories themselves, or dissolve drafts. Added visual state indicators throughout the Photo Library and Video Builder. Significantly improved the photo library interaction patterns.",
    category: "frontend",
    tags: ["draft-memories", "state-management", "Photo-Library", "UX"],
    significance: "moderate"
  },
  42: {
    summary: "AI Producer prototype using Gemini to automatically organize photos into a narrative timeline",
    detail: "The first version of the AI Producer — a groundbreaking feature that uses Google's Gemini model to analyze uploaded photos and automatically organize them into a narrative timeline. The system examines photo content, identifies people and settings, clusters related images, and generates a chronological story structure with section titles. This was a pivotal moment for the product, transforming it from a manual curation tool into an AI-assisted storytelling platform. The initial prototype included content filtering, Gemini integration, and a multi-step processing pipeline.",
    category: "ai",
    tags: ["AI-Producer", "Gemini", "photo-analysis", "narrative-generation", "prototype"],
    significance: "major"
  },
  43: {
    summary: "Backend handler test suite for project CRUD operations with Jest test infrastructure",
    detail: "Added comprehensive unit tests for the project handler covering getProjectById (success and error cases), createProject, and deleteProject operations. Built test helper utilities for mocking DynamoDB operations. Written by a second contributor (Sadie), representing the first collaborative development on the codebase.",
    category: "backend",
    tags: ["testing", "Jest", "unit-tests", "project-handler"],
    significance: "minor"
  },
  44: {
    summary: "Memory-based video architecture where each memory becomes an atomic video segment",
    detail: "Refactored video creation to use Memories as the atomic unit. Each memory (1-5 photos + recording) becomes a video segment with cross-fade transitions between its photos. Standalone photos (without recordings) render for 5 seconds with background music only. The new videoItems payload replaces the separate photos/recordings arrays, simplifying the video generation pipeline. Also fixed recording duration tracking.",
    category: "processing",
    tags: ["video-architecture", "memory-segments", "cross-fade", "refactor"],
    significance: "major"
  },
  45: {
    summary: "Standardize the color scheme with CSS custom properties for consistent theming",
    detail: "Extracted hardcoded colors throughout the frontend into CSS custom properties (variables), establishing a consistent design system. This enables future theme support and ensures visual consistency across all components.",
    category: "design",
    tags: ["CSS-variables", "theming", "design-system", "consistency"],
    significance: "moderate"
  },
  46: {
    summary: "Continue color scheme standardization across remaining components",
    detail: "Follow-up to the initial color scheme work, applying the CSS variable system to additional components that were missed in the first pass. Ensures complete coverage of the design system.",
    category: "design",
    tags: ["CSS-variables", "theming", "completeness"],
    significance: "minor"
  },
  47: {
    summary: "Complete the color scheme standardization with full UI consistency across all surfaces",
    detail: "Final pass of the color scheme standardization, covering auth components, admin panels, and remaining edge cases. Every visual surface now uses the centralized CSS variables, making the application look cohesive and enabling easy theme changes.",
    category: "design",
    tags: ["CSS-variables", "theming", "UI-consistency", "polish"],
    significance: "minor"
  },
  48: {
    summary: "Mobile experience overhaul with slideshow recorder and touch-optimized memory creation",
    detail: "Comprehensive mobile UX improvements focused on the memory creation flow. Added a slideshow recorder mode where contributors see photos cycling while they narrate. Touch targets were enlarged, spacing optimized for thumbs, and the overall mobile flow was streamlined. The add-photos modal was redesigned for mobile, and contributors section was made scrollable.",
    category: "frontend",
    tags: ["mobile-UX", "slideshow-recorder", "touch-optimization", "memory-creation"],
    significance: "moderate"
  },
  49: {
    summary: "Unified contributor flows, share project modal, and delete functionality across entities",
    detail: "Consolidated the various contributor entry points into a unified flow — whether a contributor arrives via direct link, share code, or invitation, they get the same streamlined experience. Added a share project modal for generating and managing share links. Implemented delete buttons across memories, recordings, and share codes with confirmation dialogs.",
    category: "frontend",
    tags: ["unified-flows", "share-modal", "delete-functionality", "UX-consistency"],
    significance: "moderate"
  },
  50: {
    summary: "Video Builder with sections — a drag-and-drop timeline editor for organizing video segments",
    detail: "Built the Video Builder, a major new interface for organizing video content. Introduces Sections as a grouping layer: title slides, memory segments, and standalone photos can be arranged into named sections. The builder provides a visual timeline with drag-and-drop reordering, section headers, and preview capabilities. This gives hosts fine-grained control over the story arc of their generated video. Includes a backend migration script for the sections data model.",
    category: "frontend",
    tags: ["Video-Builder", "sections", "drag-and-drop", "timeline-editor", "story-arc"],
    significance: "major"
  },
  51: {
    summary: "Comprehensive frontend test suite with 1,742 tests covering all components and hooks",
    detail: "Massive testing effort adding 1,742 unit tests across 54 test files, covering every React component, custom hook, and utility function in the frontend. Built with Vitest and React Testing Library. This established a robust safety net for the rapidly evolving frontend codebase, catching regressions as features were added. The test suite was generated in a single session — a showcase of AI-assisted test generation at scale.",
    category: "frontend",
    tags: ["testing", "Vitest", "React-Testing-Library", "1742-tests", "coverage"],
    significance: "major"
  },
  52: {
    summary: "Multi-track music timeline with ducking when voice recordings play over music",
    detail: "Built a sophisticated music timeline system supporting multiple background tracks. The key feature is automatic audio ducking — when a voice recording starts playing, the background music volume smoothly decreases, then rises again when the voice ends. This creates a professional audio mix where narration is always clearly audible over music. Also improved Ken Burns effect timing and smoothness.",
    category: "processing",
    tags: ["multi-track", "audio-ducking", "music-timeline", "audio-mixing", "Ken-Burns"],
    significance: "major"
  },
  53: {
    summary: "AI Producer with batched Gemini filtering, project story/persons settings, and pre-signed uploads",
    detail: "Significant AI Producer evolution: photos are now processed in batches through Gemini's content filtering (avoiding rate limits), project-level story and persons metadata guides the AI's narrative decisions, and photo uploads use pre-signed URLs for reliability. Added project settings UI for configuring the AI Producer's behavior — story description, key people, and event context.",
    category: "ai",
    tags: ["AI-Producer", "batch-processing", "project-settings", "Gemini", "pre-signed-URLs"],
    significance: "major"
  },
  54: {
    summary: "AI Producer v2 with Rekognition face clustering, Gemini Files API, and safety filtering",
    detail: "A complete AI Producer overhaul integrating multiple AI services. AWS Rekognition now clusters faces across the photo library, identifying unique individuals. Google's Gemini Files API enables sending full-resolution photos for richer analysis. Added safety content filtering to flag inappropriate images. The face clustering data feeds into the AI's narrative decisions, grouping photos by the people in them. At 14,779 additions, this was one of the largest single PRs in the project's history.",
    category: "ai",
    tags: ["AI-Producer-v2", "Rekognition", "face-clustering", "Gemini-Files-API", "safety-filter"],
    significance: "major"
  },
  55: {
    summary: "AI Producer refinements — Gemini pre-upload, face deduplication, and improved prompts",
    detail: "Iterative improvements to the AI Producer: pre-uploading photos to Gemini before the analysis session (reducing latency), deduplicating face clusters to merge near-duplicate detections, and refined prompts that produce better narrative structures. Also improved the face detection pipeline to handle edge cases and reduce false positives.",
    category: "ai",
    tags: ["AI-Producer", "Gemini-pre-upload", "face-deduplication", "prompt-engineering"],
    significance: "moderate"
  },
  56: {
    summary: "Add missing API keys to deployment workflows for AI service integration",
    detail: "Quick fix adding GOOGLE_API_KEY and OPENAI_API_KEY to the backend and production deployment GitHub Actions workflows. Without these, the AI Producer features couldn't function in deployed environments.",
    category: "devops",
    tags: ["deployment-fix", "API-keys", "GitHub-Actions"],
    significance: "minor"
  },
  57: {
    summary: "Gemini 2.0 Flash upgrade, music timing fixes, memory captions, and AI Producer UX improvements",
    detail: "A wide-ranging update touching multiple systems: upgraded from Gemini 1.5 to 2.0 Flash for faster and cheaper AI analysis, fixed music timeline timing issues that caused audio desync, added caption support to memories so hosts can add text descriptions, and improved the AI Producer's user-facing progress indicators and error handling. A significant cross-cutting improvement sprint.",
    category: "ai",
    tags: ["Gemini-2.0-Flash", "music-timing", "captions", "AI-Producer-UX"],
    significance: "moderate"
  },
  58: {
    summary: "Integrate Google Analytics 4 for user behavior tracking and product insights",
    detail: "Added GA4 tracking across the application to understand how users interact with the platform. Configured both development and production measurement IDs with appropriate event tracking for key user actions.",
    category: "frontend",
    tags: ["Google-Analytics", "GA4", "product-analytics"],
    significance: "minor"
  },
  59: {
    summary: "Landing page legitimacy overhaul with team photos, social proof, and clearer value proposition",
    detail: "Redesigned the landing page to build trust and credibility. Added team member photos and bios, social proof elements, a clearer explanation of the product's value, and professional visual design. Updated the meta tags and Open Graph image for better social media sharing. This was driven by the need to present Kindred Reels as a legitimate, trustworthy platform for families.",
    category: "design",
    tags: ["landing-page", "social-proof", "team-photos", "trust", "Open-Graph"],
    significance: "moderate"
  },
  60: {
    summary: "Update team member photo on landing page",
    detail: "Quick update to replace a team member's photo with a better image on the landing page.",
    category: "design",
    tags: ["landing-page", "team-photo"],
    significance: "minor"
  },
  61: {
    summary: "Fix OG image and additional landing page photo updates",
    detail: "Follow-up fixes to the landing page legitimacy work: updated the Open Graph preview image and fixed team photo references.",
    category: "design",
    tags: ["Open-Graph", "landing-page", "fixes"],
    significance: "minor"
  },
  62: {
    summary: "Fix Google Analytics not actually sending tracking requests",
    detail: "Resolved a bug where GA4 was configured but not actually sending collect requests due to an initialization timing issue in the analytics utility.",
    category: "frontend",
    tags: ["Google-Analytics", "bug-fix"],
    significance: "minor"
  },
  63: {
    summary: "Major state management refactor replacing prop drilling with React Query and Zustand",
    detail: "Transformed the frontend's state architecture from deeply nested prop drilling to a modern stack of React Query (server state/caching) and Zustand (client state). This eliminated prop chains that were 5-6 levels deep, enabled automatic background data refetching, and centralized UI state management. The refactor touched 67 files and established patterns that all subsequent features would follow. A critical architectural evolution that made the growing codebase maintainable.",
    category: "frontend",
    tags: ["React-Query", "Zustand", "state-management", "refactor", "architecture"],
    significance: "major"
  },
  64: {
    summary: "AI-guided Ken Burns camera movements, editable memory titles, and Rekognition cost optimization",
    detail: "Extended the AI integration to guide Ken Burns camera movements using AI-analyzed photo composition (not just face detection). Added editable memory titles so hosts can customize how memories appear in the video. Optimized Rekognition API calls to reduce costs — caching face detection results and skipping redundant analyses.",
    category: "ai",
    tags: ["AI-Ken-Burns", "memory-titles", "Rekognition-optimization", "cost-reduction"],
    significance: "moderate"
  },
  65: {
    summary: "CodeChronicle codebase analytics dashboard — the precursor to this very project",
    detail: "Added a vanilla JavaScript dashboard that visualizes the Kindred Reels codebase growth over time. Shows lines of code by category, file counts, and growth trends. This was the original code-chronicle tool that lived inside the main repo before being extracted into the standalone React application that became this project.",
    category: "docs",
    tags: ["CodeChronicle", "analytics", "meta", "codebase-visualization"],
    significance: "moderate"
  },
  66: {
    summary: "Photo enhancement pipeline with GCS, Gemini analysis, orientation detection, and Cloud Run restoration",
    detail: "A seven-phase feature spanning multiple AI services: Google Cloud Storage integration for photo processing, Gemini-powered photo analysis (identifying content, quality, and composition), automatic photo orientation correction based on Gemini's detection, a restoration scoring system, before/after comparison viewer in the UI, a backend restoration API, and a Cloud Run GPU service for running AI photo restoration models. This brought sophisticated photo enhancement capabilities to the platform.",
    category: "ai",
    tags: ["photo-enhancement", "GCS", "Gemini-analysis", "Cloud-Run", "restoration", "orientation"],
    significance: "major"
  },
  67: {
    summary: "Timeline Contributor Flow enabling contributors to browse and record across an entire timeline",
    detail: "Built a new contributor experience where invited family members can browse the entire project timeline (not just individual photos) and choose which memories to contribute to. Three phases: timeline browsing view, integrated recording interface within the timeline, and navigation between memories. This made the contribution process more engaging and context-rich.",
    category: "frontend",
    tags: ["timeline-flow", "contributor-experience", "browsing", "navigation"],
    significance: "major"
  },
  68: {
    summary: "Landing page overhaul highlighting AI Producer feature and clearer product value proposition",
    detail: "Redesigned the landing page to lead with the AI Producer as the hero feature — the idea that AI automatically organizes your photos into a cinematic narrative. Restructured the feature sections to tell a clearer story about the product's value: upload photos, AI organizes them, family records memories, get a professional video.",
    category: "design",
    tags: ["landing-page", "AI-Producer", "value-proposition", "marketing"],
    significance: "moderate"
  },
  69: {
    summary: "Memory invitations with optional timeline browsing access for invited contributors",
    detail: "Extended the invitation system so hosts can grant contributors access to browse the full timeline (not just their assigned memory). This creates a more immersive contribution experience where family members can see the whole story being told, not just their isolated recording assignment. Configurable per-invitation so hosts control the level of access.",
    category: "backend",
    tags: ["invitations", "timeline-access", "permissions", "contributor-flow"],
    significance: "moderate"
  },
  70: {
    summary: "Bug fixes and UX improvements for the contributor flow and Video Builder interface",
    detail: "Collection of targeted fixes: contributor flow navigation issues, Video Builder section tab interaction bugs, music timeline modal improvements, and documentation updates for the flow architecture.",
    category: "frontend",
    tags: ["bug-fixes", "contributor-flow", "Video-Builder", "UX"],
    significance: "minor"
  },
  71: {
    summary: "Updated flow documentation and backend improvements for photo management and project handling",
    detail: "Updated the comprehensive FLOWS.md documentation to reflect the current contributor and host workflows. Backend improvements to photo and project handlers for better data consistency. Added Google Photos integration documentation.",
    category: "docs",
    tags: ["documentation", "flows", "photo-management"],
    significance: "minor"
  },
  72: {
    summary: "Google Photos integration using the Picker API for importing photos from Google accounts",
    detail: "Integrated Google Photos Picker API, allowing users to import photos directly from their Google Photos library without downloading and re-uploading. The Picker opens in a modal, users select albums or individual photos, and the selected images are imported into the project with their metadata preserved. This dramatically simplifies the photo upload experience for users who store their photos in Google Photos.",
    category: "frontend",
    tags: ["Google-Photos", "Picker-API", "photo-import", "OAuth", "UX"],
    significance: "major"
  },
  73: {
    summary: "AI Producer refactored into a 4-stage workflow with dramatically improved Gemini prompts",
    detail: "Complete AI Producer refactor from a monolithic pipeline into four distinct stages: photo analysis, person identification, chronology detection, and narrative generation. Each stage uses carefully crafted Gemini prompts optimized for their specific task. The prompt engineering work was extensive — each prompt includes examples, constraints, and output format specifications. This produced significantly better narrative structures and more accurate photo groupings.",
    category: "ai",
    tags: ["AI-Producer-refactor", "4-stage-workflow", "prompt-engineering", "Gemini"],
    significance: "major"
  },
  74: {
    summary: "HTML-based slides, multi-track music rendering, comprehensive video processing test suite",
    detail: "Replaced image-based title/credits slides with HTML templates rendered via Playwright, enabling rich typography and dynamic layouts. Implemented multi-track music rendering in the video pipeline so background music can change between sections. Added a comprehensive video processing test suite. Also fixed various video rendering bugs including audio sync issues. A major evolution of the video output quality.",
    category: "processing",
    tags: ["HTML-slides", "Playwright-rendering", "multi-track-music", "video-testing"],
    significance: "major"
  },
  75: {
    summary: "Landing page updates with screenshots for Google for Startups application",
    detail: "Updated the landing page with product screenshots and refined messaging for a Google for Startups cloud credits application. Shows the AI Producer, Photo Library, Video Builder, and Video Preview in action.",
    category: "design",
    tags: ["landing-page", "screenshots", "Google-for-Startups"],
    significance: "minor"
  },
  77: {
    summary: "Comprehensive backend test expansion covering all project handler operations",
    detail: "Extended backend test suite with thorough testing of all project handler functions. Written by Sadie as part of ongoing collaborative test coverage expansion. Tests cover success cases, error handling, authentication checks, and edge cases.",
    category: "backend",
    tags: ["testing", "project-handler", "collaboration"],
    significance: "minor"
  },
  78: {
    summary: "AI Producer async processing via Lambda worker for long-running analysis jobs",
    detail: "Moved the AI Producer's heavy processing from synchronous API calls to asynchronous Lambda worker invocations. The frontend starts a job, receives a session ID, and polls for progress. This eliminates API Gateway timeouts for large photo sets and allows the AI Producer to process 100+ photos without the user's browser needing to stay open.",
    category: "backend",
    tags: ["Lambda-worker", "async-processing", "AI-Producer", "scalability"],
    significance: "moderate"
  },
  79: {
    summary: "Timeline UX improvements across six stages — navigation, editing, visual polish",
    detail: "A systematic six-stage UX improvement sprint for the timeline view. Improved memory card layouts, section navigation, drag-and-drop interactions, inline editing for memory titles and descriptions, visual indicators for pending/complete states, and overall visual polish. Also added a migration script for standalone photos and updated the flow documentation.",
    category: "frontend",
    tags: ["timeline-UX", "drag-and-drop", "inline-editing", "visual-polish"],
    significance: "moderate"
  },
  80: {
    summary: "Editable project and memory titles with Photo Library UX refinements",
    detail: "Added inline editing for project titles and memory titles, plus several Photo Library UX improvements: better photo selection behavior, improved thumbnail loading, and more intuitive organization interactions.",
    category: "frontend",
    tags: ["inline-editing", "Photo-Library", "UX-refinements"],
    significance: "minor"
  },
  81: {
    summary: "Fix memory location tracking and status update bugs in the timeline view",
    detail: "Fixed two bugs in the timeline memory handler: memory location coordinates weren't being saved correctly, and status transitions had edge cases where pending memories could get stuck.",
    category: "backend",
    tags: ["bug-fix", "memory-status", "timeline"],
    significance: "minor"
  },
  82: {
    summary: "Cross-section memory dragging and contributor recording fix in timeline view",
    detail: "Added the ability to drag memories between sections in the Video Builder (not just within a section), enabling more flexible story organization. Also fixed a bug where contributor recordings weren't being associated correctly with memories in certain timeline browsing scenarios.",
    category: "frontend",
    tags: ["cross-section-drag", "Video-Builder", "recording-fix"],
    significance: "moderate"
  },
  83: {
    summary: "Multiple deployment and rendering fixes — EC2 staging, race conditions, Playwright, thumbnails",
    detail: "A collection of targeted fixes: added --stage support to the EC2 deploy script for prod/dev separation, fixed a race condition in parallel section title rendering, resolved Playwright not being fork-safe in multiprocessing workers, switched the VideoBuilder filmstrip to use thumbnails for better performance, and fixed EC2 credential loading at startup.",
    category: "infrastructure",
    tags: ["EC2-deploy", "race-condition", "Playwright", "thumbnails", "bug-fixes"],
    significance: "minor"
  },
  84: {
    summary: "Stop tracking generated .env.ec2 file and add thumbnail URLs to Video Builder endpoint",
    detail: "Housekeeping: added .env.ec2 to .gitignore and removed it from tracking (it's generated at deploy time), and ensured the VideoBuilder endpoint returns thumbnail URLs for the filmstrip view.",
    category: "infrastructure",
    tags: ["gitignore", "thumbnails", "cleanup"],
    significance: "minor"
  },
  85: {
    summary: "Production video generation fix and timeline browsing recording support",
    detail: "Fixed video generation in the production environment and added the ability for contributors with timeline browsing access to create recordings directly from the timeline view (previously they could only browse).",
    category: "frontend",
    tags: ["production-fix", "timeline-recordings", "contributor-flow"],
    significance: "minor"
  },
  86: {
    summary: "Fix music track selection in video generation and section height rendering",
    detail: "Fixed a bug where the selected music track wasn't being passed correctly to the video processor, and fixed section height calculations for non-photo sections (title slides, credits) in the Video Builder layout.",
    category: "processing",
    tags: ["music-fix", "section-height", "video-generation"],
    significance: "minor"
  },
  87: {
    summary: "Fix EC2 deployment to include HTML templates, fonts, and Playwright for slide rendering",
    detail: "The EC2 deployment was missing the HTML template files, custom fonts, and Playwright browser binary needed for rendering HTML-based title and credits slides. Added these to both the processing and production deployment workflows. Also added admin stats handler improvements.",
    category: "devops",
    tags: ["EC2-deployment", "HTML-templates", "Playwright", "fonts"],
    significance: "minor"
  },
  88: {
    summary: "Music track metadata fields (title/artist) and admin table UI for library management",
    detail: "Added title and artist metadata fields to music tracks in both the global library and user-uploaded tracks. Built a table-based admin UI for browsing and managing the music library with sortable columns, search, and inline editing. The metadata is displayed during track selection in the Video Builder.",
    category: "frontend",
    tags: ["music-metadata", "admin-table-UI", "music-library"],
    significance: "moderate"
  },
  89: {
    summary: "Video improvements — timeline settings panel, noir-elegant theme, caption rendering",
    detail: "Added a timeline settings panel for configuring video output options (resolution, caption style, music volume). Introduced the first video theme: 'noir-elegant' with stylized dark-mode title slides, credits, and transition effects. Implemented caption rendering in the video output, displaying memory captions as text overlays during playback. This was the beginning of the theme system.",
    category: "processing",
    tags: ["timeline-settings", "noir-elegant-theme", "captions", "video-quality"],
    significance: "moderate"
  },
  90: {
    summary: "Unify EC2 deployment structure across GitHub Actions, SSH deploy, and production workflows",
    detail: "Resolved inconsistencies between the three different ways code gets deployed to EC2 (GitHub Actions for processing, SSH deploy script, production workflow). All three now use the same directory structure and file set, preventing bugs where manual deploys worked but CI/CD didn't.",
    category: "devops",
    tags: ["EC2-deployment", "consistency", "CI/CD"],
    significance: "minor"
  },
  92: {
    summary: "Remove outdated pending memories exclusion message from video generation modal",
    detail: "Cleaned up the GenerateVideoModal by removing a message about pending memories being excluded — this logic was changed and the message was no longer accurate.",
    category: "frontend",
    tags: ["cleanup", "UI-copy"],
    significance: "minor"
  },
  91: {
    summary: "Extensive backend handler test suite covering auth, AI Producer, music, and more",
    detail: "Major testing contribution by Sadie adding tests for authHandler, aiProducerHandler, backgroundMusicHandler, googlePhotosHandler, memoryHandler, and multiple admin handlers. At 12,175 lines added, this significantly expanded backend test coverage across all major API surfaces. The tests cover authentication flows, AI Producer session management, music operations, and admin functionality.",
    category: "backend",
    tags: ["testing", "handler-tests", "comprehensive-coverage", "collaboration"],
    significance: "moderate"
  },
  93: {
    summary: "Video processing reliability improvements and contributor name inline editing",
    detail: "Improved video processing error handling and retry logic for more reliable generation. Added inline editing for contributor names in the Video Builder, so hosts can correct or update how contributors are credited in the video without going through a separate editing flow.",
    category: "frontend",
    tags: ["video-reliability", "inline-editing", "contributor-names"],
    significance: "minor"
  },
  94: {
    summary: "Closed captions via Whisper AI transcription of voice recordings",
    detail: "Integrated OpenAI's Whisper model to automatically transcribe voice recordings into text, then render those transcriptions as closed captions in the generated video. The transcription runs as part of the recording processing pipeline, and the resulting segments are stored with timestamps for accurate caption timing. Users can toggle captions on/off in the Video Builder settings.",
    category: "ai",
    tags: ["Whisper", "transcription", "closed-captions", "accessibility"],
    significance: "major"
  },
  95: {
    summary: "Editable transcript segments and S3 video bucket permission fix",
    detail: "Added a transcript editor modal where hosts can review and correct the AI-generated transcription segments before video generation. Each segment shows the text with its timestamp, and hosts can edit the text to fix transcription errors. Also fixed an S3 bucket permission issue preventing video file access.",
    category: "frontend",
    tags: ["transcript-editor", "S3-permissions", "caption-editing"],
    significance: "moderate"
  },
  96: {
    summary: "Upgrade production EC2 to m6i.4xlarge with 16 parallel video processing workers",
    detail: "Scaled up the production video processing instance to m6i.4xlarge (16 vCPU, 64GB RAM) and configured 16 parallel FFmpeg workers. This enables processing multiple video segments simultaneously, further reducing generation time for larger projects.",
    category: "infrastructure",
    tags: ["EC2-upgrade", "parallel-workers", "scaling"],
    significance: "minor"
  },
  97: {
    summary: "Update development EC2 documentation to match production m6i.4xlarge instance",
    detail: "Documentation consistency update to reflect the same m6i.4xlarge instance type for development, matching the production configuration.",
    category: "docs",
    tags: ["documentation", "EC2", "consistency"],
    significance: "minor"
  },
  98: {
    summary: "Add delayed audio start for attribution slide and fade-to-black video outro",
    detail: "Refined the video's opening and closing: the attribution slide now has a brief silence before music begins (letting viewers read the credits), and the video ends with a smooth fade-to-black effect instead of an abrupt cut. Small touches that significantly improve the professional feel of generated videos.",
    category: "processing",
    tags: ["video-polish", "attribution", "fade-to-black", "audio-timing"],
    significance: "minor"
  },
  99: {
    summary: "Move attribution to top-left corner and remove the audio delay",
    detail: "Iterative refinement: moved the attribution text to a less intrusive top-left position and removed the audio delay that was added in the previous PR after user testing showed it felt awkward.",
    category: "processing",
    tags: ["attribution", "layout", "iteration"],
    significance: "minor"
  },
  100: {
    summary: "Make credits slide text legible with better contrast and sizing",
    detail: "Improved the noir-elegant theme's credits slide HTML template to ensure text is readable — better font sizing, increased contrast, and proper spacing.",
    category: "design",
    tags: ["credits", "typography", "legibility"],
    significance: "minor"
  },
  101: {
    summary: "Update parking lot document with future feature ideas and priorities",
    detail: "Updated the PARKING_LOT.md document with accumulated feature ideas, bug notes, and prioritized improvements gathered during development. This serves as a living backlog for the project.",
    category: "docs",
    tags: ["parking-lot", "backlog", "planning"],
    significance: "minor"
  },
  102: {
    summary: "Event project type with AI-driven organization and fix for large HEIC photo processing",
    detail: "Introduced a new project type: Events (alongside the existing Tribute type). Event projects are designed for gatherings like weddings, parties, and reunions where multiple people contribute photos in real-time. The AI organizer automatically clusters event photos by time and content. Also fixed a critical bug where large HEIC files (common from iPhones) were causing the image processor to crash due to memory limits. Significant codebase refactoring to support multiple project types.",
    category: "ai",
    tags: ["event-projects", "project-types", "HEIC-fix", "AI-organization"],
    significance: "major"
  },
  103: {
    summary: "Two-phase crossfade video rendering and beat-sync timing improvements",
    detail: "Implemented a two-phase crossfade rendering approach for smoother transitions between video segments, and refined the beat-sync algorithm for more natural timing. The crossfade renders overlapping frames from adjacent segments, creating seamless visual transitions. Also includes improvements to the AI Producer prompts for better narrative coherence.",
    category: "processing",
    tags: ["crossfade", "beat-sync", "rendering", "transitions"],
    significance: "moderate"
  },
  104: {
    summary: "Improve Google Photos Picker UX with larger window size and album selection",
    detail: "Made the Google Photos Picker modal larger for easier photo browsing and added album-level selection so users can import entire albums at once instead of selecting photos individually.",
    category: "frontend",
    tags: ["Google-Photos", "Picker-UX", "album-selection"],
    significance: "minor"
  },
  106: {
    summary: "End-to-end Playwright tests for the home page and user login flow",
    detail: "Added end-to-end tests using Playwright covering the home/landing page rendering and user authentication flows. Written by Sadie as part of the E2E testing initiative. Includes test configuration and helper utilities for authentication state management.",
    category: "frontend",
    tags: ["E2E-tests", "Playwright", "authentication", "collaboration"],
    significance: "minor"
  },
  107: {
    summary: "Event Organizer flow — AI-powered timeline creation for event-type projects",
    detail: "Built the complete Event Organizer experience: when a host creates an event project, the AI analyzes all uploaded photos to detect temporal clusters (moments), identifies key people using face detection, and generates a timeline with named sections. The flow guides hosts through reviewing and customizing the AI-generated organization before generating a video. Also includes comprehensive documentation updates across the entire project. At 10,747 additions, this was a massive feature delivery.",
    category: "ai",
    tags: ["Event-Organizer", "AI-timeline", "temporal-clustering", "event-flow"],
    significance: "major"
  },
  108: {
    summary: "Deferred Rekognition for event projects and image processor reliability improvements",
    detail: "Changed the Rekognition face detection to run on-demand during AI organization rather than at upload time for event projects. This is more efficient because event projects may have hundreds of photos uploaded quickly, and running Rekognition on each one at upload time was slow and expensive. The deferred approach analyzes faces only when the organizer needs them. Also improved the image processor Lambda's error handling and retry logic.",
    category: "ai",
    tags: ["deferred-Rekognition", "event-optimization", "image-processor", "cost-reduction"],
    significance: "moderate"
  },
  110: {
    summary: "Theme system with 28 HTML templates for title slides, credits, and section dividers",
    detail: "Built a comprehensive theming system with 28 unique visual templates spanning five aesthetic families (elegant, modern, warm, playful, cinematic). Each theme includes HTML/CSS templates for title slides, credits screens, and section dividers — all rendered via Playwright into video frames. Hosts can preview themes in the Video Builder and the AI Producer can recommend themes based on project content. Also added credits customization so hosts can edit the end-of-video text. This was the largest single PR at 16,832 additions across 128 files.",
    category: "design",
    tags: ["theme-system", "28-templates", "HTML-slides", "credits-customization", "Playwright"],
    significance: "major"
  },
  111: {
    summary: "Remove the review modal from AI Event Organizer for a more streamlined flow",
    detail: "Simplified the Event Organizer UX by removing the intermediate review modal. Users now go directly from AI organization to the Video Builder where they can make adjustments, eliminating a redundant step that user testing showed was confusing.",
    category: "frontend",
    tags: ["UX-simplification", "Event-Organizer", "flow-streamlining"],
    significance: "minor"
  },
  109: {
    summary: "End-to-end Playwright tests for project creation, deletion, and authenticated flows",
    detail: "Extended E2E test coverage with Playwright tests for the full project lifecycle: creating a project, navigating to it, and deleting it. Added authentication setup so tests run against an authenticated user session. Written by Sadie.",
    category: "frontend",
    tags: ["E2E-tests", "Playwright", "project-lifecycle", "collaboration"],
    significance: "minor"
  },
  112: {
    summary: "Organization mode UX overhaul — lightbox, comparison view, clustering visualization, and photo management",
    detail: "A major redesign of the photo organization experience within the AI-powered flow. Added a full-screen lightbox for detailed photo review, a side-by-side comparison view for choosing between similar photos, visualization of AI-detected photo clusters, and comprehensive photo management tools (swap, remove, reorder). The organization mode now feels like a professional photo curation tool. Also updated deployment workflows and integrated new AI service endpoints.",
    category: "frontend",
    tags: ["organization-mode", "lightbox", "comparison-view", "clustering-UI", "photo-curation"],
    significance: "major"
  },
  113: {
    summary: "Technology page showcasing the platform's engineering architecture and AI integration",
    detail: "Added a public-facing Technology page that presents the Kindred Reels architecture to visitors: the AI pipeline, video processing system, cloud infrastructure, and the story of building a production platform through AI-assisted development. Includes an interactive architecture diagram component. This page serves both marketing (demonstrating technical sophistication) and transparency purposes.",
    category: "frontend",
    tags: ["technology-page", "architecture-diagram", "marketing", "public-facing"],
    significance: "moderate"
  },
  115: {
    summary: "Optimistic photo replacement in organization mode with instant UI swap and rollback",
    detail: "Implemented optimistic updates for the photo replace action in organization mode. When a user swaps a photo, the UI updates instantly while the backend processes the change in the background. If the backend fails, the UI rolls back to the previous state. This eliminates the perceived latency of photo swaps, making the organization experience feel snappy and responsive.",
    category: "frontend",
    tags: ["optimistic-updates", "organization-mode", "photo-replacement", "UX-performance"],
    significance: "moderate"
  },
  118: {
    summary: "Eliminate N+1 DynamoDB queries on project load, reducing page load from ~13s to ~1-2s",
    detail: "A critical performance fix that resolved extremely slow project page loads. The project handler was making separate DynamoDB queries for each photo, memory, and recording (N+1 problem), resulting in hundreds of sequential database calls. Refactored to use batch queries and parallel fetching, reducing the page load time from ~13 seconds to ~1-2 seconds. Also cleaned up old specification documents and added a security spec.",
    category: "backend",
    tags: ["N+1-fix", "DynamoDB", "performance", "batch-queries", "10x-speedup"],
    significance: "major"
  },
  117: {
    summary: "Fix photo orientation by applying EXIF rotation during thumbnail creation",
    detail: "Added rotation correction based on EXIF orientation data when generating thumbnails. Previously, photos taken in portrait mode on phones would appear rotated in thumbnail views. Written by Sadie.",
    category: "backend",
    tags: ["EXIF-rotation", "thumbnails", "photo-orientation", "collaboration"],
    significance: "minor"
  },
  119: {
    summary: "Unified project creation flow, AI prompt refactor, and improved Create Timeline experience",
    detail: "Unified the project creation experience so both Tribute and Event project types follow the same streamlined flow. Refactored the AI prompts across the Event Organizer and AI Producer to use shared prompt building utilities, improving consistency and making prompts easier to iterate on. Improved the Create Timeline modal with better guidance and progress indication.",
    category: "ai",
    tags: ["unified-flow", "prompt-refactor", "Create-Timeline", "UX-improvements"],
    significance: "moderate"
  },
  120: {
    summary: "Visual clustering pipeline, redesigned photo upload, EXIF fix, and narrative section naming",
    detail: "Implemented a visual clustering pipeline that groups photos by visual similarity (not just temporal proximity), enabling better automatic organization of event photos. Redesigned the photo upload experience with progress indicators and batch handling. Fixed an EXIF parsing edge case. Improved the AI's narrative section naming to produce more evocative, story-like titles instead of generic labels.",
    category: "ai",
    tags: ["visual-clustering", "photo-upload-redesign", "EXIF-fix", "narrative-naming"],
    significance: "major"
  },
  121: {
    summary: "Music system overhaul — curated library, AI auto-selection, and repository org migration",
    detail: "Rebuilt the music management system with a curated library of tracks organized by mood and genre. The AI can now automatically select appropriate background music based on project content and mood analysis. Also migrated the repository from a personal account to the kindredreels organization on GitHub. This was the most recent PR, reflecting the continued evolution of the AI-assisted features.",
    category: "ai",
    tags: ["music-library", "AI-music-selection", "curated-tracks", "org-migration"],
    significance: "major"
  },
  122: {
    summary: "Consolidated settings modals, removed dead features, and restyled header buttons",
    detail: "Merged Timeline Settings into Project Settings as collapsible sections (Video Settings, Sections). Removed dead code including the AI Producer route/tab, blocked photos section, visual signature display, and stale spec docs. Restyled the Edit button as the primary blue CTA with larger sizing. A net deletion of ~1,000 lines — focused cleanup that removed wiring for features that had been superseded.",
    category: "frontend",
    tags: ["settings-consolidation", "dead-code-removal", "UX-cleanup"],
    significance: "moderate"
  },
  123: {
    summary: "Navigation overhaul — desktop sidebar, mobile bottom nav, and dedicated mobile timeline",
    detail: "Complete navigation redesign with a full-height collapsible ProjectSidebar for desktop and a fixed MobileBottomNav with tabs for Photos, Timeline, Videos, and Settings. Added a dedicated MobileTimelineView with read-only timeline, photo grids, section-scoped lightbox, and Generate Video button. Created an inline SettingsTab replacing modal-based settings. Redesigned Video Settings with 16:9 cover photo preview and fixed the broken cover photo picker. Removed all mobile conditionals from VideoBuilder for a clean desktop-only component. Full-viewport project workspace layout with no navbar/footer inside projects. Route renames from /library to /photos and /contributors to /people.",
    category: "frontend",
    tags: ["sidebar", "mobile-nav", "mobile-timeline", "navigation-redesign", "responsive"],
    significance: "major"
  },
  124: {
    summary: "Video sharing with public watch page, QR codes, and YouTube upload integration",
    detail: "Full video sharing feature across four phases: a public watch page at /watch/:shareCode with video player and download, ShareVideoModal with copy link, Web Share API, QR code, and download button. Integrated YouTube OAuth (connect/disconnect/token refresh) with an async Lambda worker that streams S3 to YouTube via resumable upload. Added YouTube upload panel in the share modal with polling status and YouTube badges on video cards linking to uploaded videos.",
    category: "frontend",
    tags: ["video-sharing", "YouTube-upload", "QR-codes", "public-watch-page", "OAuth"],
    significance: "major"
  },
  125: {
    summary: "Optional section customization in Create Timeline flow for guided AI organization",
    detail: "Users can now specify section count (1-8) and per-section descriptions to guide the AI architect when creating timelines. Added a collapsible panel in Step 3 of the Create Timeline modal — full version for 40+ photos with per-section descriptions, simpler single-description for 20-39 photos. Backend validates sectionConfig, threads it through the architect prompt, and respects the user's exact section count.",
    category: "ai",
    tags: ["section-customization", "Create-Timeline", "AI-architect", "user-guidance"],
    significance: "moderate"
  },
  126: {
    summary: "Tribute flow reintegration with deferred Rekognition, people setup, and face matching",
    detail: "Reintegrated the tribute/multi-person face recognition from the AI Producer into the main Create Timeline flow with major cost optimizations. Phase 1 deferred all Rekognition calls from upload time to video generation or analysis, achieving ~60-80% cost reduction. Phase 2 added a 'Is this a tribute?' question in Step 1, a full-screen TributeSetup overlay with two-panel people management, reference photo picker, and inline face identification. Phase 3 implemented a face matching stage with batch DetectFaces + SearchFacesByImage, AI-powered chronology estimation for date ordering of scanned photos, and atomic draft transitions to prevent concurrent race conditions.",
    category: "ai",
    tags: ["tribute-flow", "Rekognition", "face-matching", "cost-optimization", "deferred-processing"],
    significance: "major"
  },
  127: {
    summary: "Security audit — signed S3 URLs, error sanitization, PITR, and S3 versioning",
    detail: "Initial security audit work by Sadie covering four areas: switched to signed S3 URLs for all bucket access, sanitized API error messages by removing err.message from 63 error response calls across 8 handler files to prevent leaking internal details. Enabled DynamoDB Point-in-Time Recovery on both tables and S3 versioning with 30-day lifecycle on both uploads buckets. Server-side console.error logging retained for debugging.",
    category: "backend",
    tags: ["security-audit", "signed-URLs", "error-sanitization", "PITR", "S3-versioning"],
    significance: "major"
  },
  128: {
    summary: "Route ownership middleware, CloudFront + OAC, and risky change reverts",
    detail: "Chunks 1-3 of the security audit: migrated all project-scoped routes to per-router ownership middleware, eliminating redundant getProjectById calls. Added CloudFront with Origin Access Control for S3 uploads so buckets are now fully private. Reverted the async getFileUrl and in-memory rate limiting from PR #127 as they introduced issues. Updated tests and removed stale spec docs. A net deletion of ~3,800 lines through cleanup.",
    category: "backend",
    tags: ["ownership-middleware", "CloudFront", "OAC", "security-audit", "route-auth"],
    significance: "major"
  },
  129: {
    summary: "Complete backend code hardening across 5 phases — validation, testing, and refactoring",
    detail: "Comprehensive backend quality improvement: Phase 1 added CI gates, removed 4 unused deps, deleted dead files, added ESLint config. Phase 2 created a shared validation utility and standardized requireAuth across all handlers. Phase 3 added handler test coverage for photoHandler, eventOrganizer, videoShare, and YouTube. Phase 4 added middleware, shared utility, and DB layer tests. Phase 5 split the monolithic photoHandler into 3 files and organizeStage into 4 files, added service error handling, standardized DB null-return patterns, and cleaned up dead exports. Ended with 660 tests passing at 32% coverage with 0 lint errors.",
    category: "backend",
    tags: ["code-hardening", "testing", "refactoring", "CI-gates", "validation"],
    significance: "major"
  },
  130: {
    summary: "Fixed all 45 failing backend tests and made tests a hard CI gate",
    detail: "Fixed env var issues across 4 test suites, error message mismatches, response shape mismatches, mock ordering, and dead tests. Found and fixed a real bug in statsHandler where 'complete' should have been 'completed' in the video status filter. Removed continue-on-error from CI workflows so tests now block deploys. Rewrote googlePhotosHandler import test for the async job pattern. Ended with 699 tests passing, 0 failures, 52 skipped (AI Producer tests deferred).",
    category: "backend",
    tags: ["test-fixes", "CI-gates", "bug-fix", "test-reliability"],
    significance: "moderate"
  },
  131: {
    summary: "Upgraded Node.js to 22 across local dev, CI, and Lambda runtime",
    detail: "Added .nvmrc pinning Node 22 for local development consistency. Updated all GitHub Actions workflows to use node-version 22. Updated serverless.yml Lambda runtime to nodejs22.x. A small but important infrastructure change ensuring consistency across all environments.",
    category: "devops",
    tags: ["Node-upgrade", "Node-22", "Lambda-runtime", "CI"],
    significance: "minor"
  },
  132: {
    summary: "Fixed exit code 1 from open handles after tests pass",
    detail: "The Google Photos import test was using the local dev path which did a real dynamic import of the worker file, creating unmocked AWS clients that left open handles. Switched to the Lambda path with mocked clients. Added --forceExit to the jest command as a safety net for ESM open handle issues that can occur with dynamic imports.",
    category: "backend",
    tags: ["test-fix", "open-handles", "ESM", "jest"],
    significance: "minor"
  },
  133: {
    summary: "Frontend code hardening — CI gates, dead code removal, route-level code splitting, and mega-component decomposition across all 5 phases",
    detail: "A sweeping frontend cleanup that removed ~2,400 lines of dead code and unused dependencies while adding CI gates to run lint and tests before every deploy. It introduced route-level code splitting via React.lazy for admin, contributor, and public pages, plus Vite manual chunks for vendor splitting. The centerpiece was decomposing the codebase's largest components: VideoBuilder shrank from 3,118 to 936 lines, CreateTimelineModal from 1,444 to ~300, and MusicTimelineModal from 1,301 to 624, with logic extracted into focused hooks like useTimelineDragDrop and useTimelineItemActions. Rounded out with onError handlers on all 17 mutation hooks and staleTime tuning across 14 query hooks — landing with 1,127 tests passing and zero lint errors.",
    category: "frontend",
    tags: ["code-splitting", "React.lazy", "component-decomposition", "CI-gates", "dead-code-removal", "react-query"],
    significance: "major"
  },
  134: {
    summary: "Python video-processing pipeline hardening — module split, error resilience, structured logging, and 92 pytest tests",
    detail: "The counterpart hardening pass for the Python side of the video pipeline. It purged dead code (photo-restoration/, slides_legacy.py, legacy lambda_handler.py), patched a Pillow CVE, and fixed bare excepts and unused imports. Error handling was toughened with download validation, S3 retry-with-backoff, EC2 poison-pill protection, and phase-aware error messages surfaced in DynamoDB. The monolithic process_queue.py (1,514 lines) was split into four focused modules — orchestrator, db_client, and music_resolver — and 297 stray print() calls were replaced with structured logging. Capped off with 32 type-hinted public functions, a ruff linter config, 92 pytest tests across 5 files, and a CI pipeline gate.",
    category: "processing",
    tags: ["module-split", "pytest", "structured-logging", "ruff", "error-handling", "CI-gates"],
    significance: "major"
  },
  135: {
    summary: "Video clips — a full pipeline bringing Google Photos and device videos through Gemini clip analysis into rendered timelines",
    detail: "A landmark feature expanding Kindred Reels beyond stills into video. Videos import from Google Photos into GCS with S3 thumbnails, and a new Cloud Run video-processor service runs FFmpeg plus Gemini analysis to identify clip candidates, with a separate clip-extractor service cutting the chosen segments. The Create Timeline flow was taught to work with mixed media: cached VI metadata means zero API calls during creation, the architect and curator receive clip candidates alongside photos with proportional per-section targeting, and the EC2 renderer downloads clips from GCS and re-encodes them with music ducking for clips carrying significant audio. Organization mode gained excluded-clip stub records (filterStatus 'rejected') so rejected footage remains visible in the lightbox with metadata.",
    category: "processing",
    tags: ["video-clips", "Cloud-Run", "clip-extraction", "Gemini", "FFmpeg", "mixed-media"],
    significance: "major"
  },
  136: {
    summary: "Resolve CI lint errors and add a required pre-push checklist to CLAUDE.md",
    detail: "A small follow-up to the video clips work that unblocked CI. It added a `/* global AbortSignal */` directive for ESLint in clipExtractionService.js and replaced a ternary statement with an if/else in StandalonePhotoModal.tsx. It also codified a required pre-push checklist (lint + tests + build) into CLAUDE.md to prevent future CI breakage.",
    category: "devops",
    tags: ["lint-fix", "ESLint", "CI", "pre-push-checklist"],
    significance: "minor"
  },
  137: {
    summary: "Language audit for mixed-media, excluded-clip visibility fixes, and org-mode clip playback support",
    detail: "With video now in the product, this PR reconciled the UI's vocabulary with reality — updating 38+ files to say \"Library\" instead of \"Photos\" and \"items\" instead of \"photos\" in mixed-media contexts, including the architect, curator, and quickCurator AI prompts. It fixed excluded clip stubs being invisible in org mode by removing the server-side filter and moving filtering client-side into PhotoLibraryTab. It also added a ClipPreviewPlayer component for clip playback in the org-mode lightbox, fixed video sizing overflow within the lightbox container, and extended OrganizationLightbox with a video_clip variant surfacing mood, duration, and audio for excluded clips.",
    category: "frontend",
    tags: ["language-audit", "mixed-media", "excluded-clips", "org-mode", "clip-player", "ai-prompts"],
    significance: "moderate"
  },
  138: {
    summary: "Device video upload, clip-extraction deferral to render time, draggable clip boundary editing, and a unified ClipPlayer",
    detail: "This PR let users upload videos directly from their devices via GCS signed URLs and Cloud Run processing, enforcing 1GB / 2-minute limits. Architecturally, it deleted the standalone clip-extractor service entirely, deferring FFmpeg clip cutting to EC2 render time — echoing the same defer-until-generation cost pattern used elsewhere. It added clip boundary editing through a PATCH endpoint and merged ClipPreviewPlayer and ClipEditor into a single self-fetching ClipPlayer with draggable in/out handles. Along the way it fixed StandalonePhotoModal passing photo.id instead of sourceVideoId for playback and swept away completed spec docs (the deletion-heavy diff reflects ~8,600 lines of retired specs and dead services).",
    category: "processing",
    tags: ["device-upload", "clip-extraction", "deferred-processing", "clip-editing", "Cloud-Run", "GCS-signed-urls"],
    significance: "major"
  },
  139: {
    summary: "Post-credits sections with per-section music volume, per-clip music ducking, and assorted timeline/audio fixes",
    detail: "This PR introduced post-credits sections — segments designated to play after the credits slide, each with its own music volume control — and a per-clip duck-music toggle that persists correctly across every view. It fixed the sign-off field silently failing to save in Settings, gave the music track library a two-tab layout with placed-track playback, and corrected several rendering issues: clip audio sync drift, outro fade timing, and draft clip IDs leaking into exclusion reason text. The bulk of the diff is retired spec documentation cleanup.",
    category: "frontend",
    tags: ["post-credits", "music-ducking", "audio-sync", "timeline", "music-library"],
    significance: "moderate"
  },
  140: {
    summary: "Fix Google Photos import counting bugs — duplicate items and progress exceeding 100%",
    detail: "A targeted fix for import accounting. It added 'total' to the allowedFields in importJobs so the worker could write the true item count, deduplicated media items returned by the Picker API across overlapping pages, and capped the progress bar at 100%. Small but user-visible correctness fix for the import experience.",
    category: "backend",
    tags: ["google-photos", "import", "deduplication", "bugfix", "progress-bar"],
    significance: "minor"
  },
  141: {
    summary: "Fix AI-selected project cover photo never saving, plus video-aware thumbnail preferences and PATCH CORS",
    detail: "This PR fixed a bug where the AI's chosen projectCoverPhotoId was extracted but never persisted during draft apply. It hardened cover selection to validate the pick is an actual photo rather than a video or video_clip (with fallback), updated AI prompts to specify photo IDs over clip IDs, and made getPhotoCountAndFirst() prefer real photos over video records for card thumbnails — now using full-res storagePath for sharper cards. It also added PATCH to the API Gateway CORS allowedMethods, unblocking clip-boundary saves in dev.",
    category: "backend",
    tags: ["cover-photo", "ai-selection", "thumbnails", "CORS", "bugfix"],
    significance: "minor"
  },
  142: {
    summary: "Video duration validation, streaming GCS imports, centralized API_BASE_URL config, and Gemini JSON-repair fallback",
    detail: "A grab-bag of resilience improvements for the video pipeline. Videos shorter than 1s or longer than 2min are now rejected before processing, and video imports stream directly to GCS rather than buffering in memory. The API base URL was centralized behind an environment variable, replacing scattered stage conditionals, and a jsonrepair fallback now salvages malformed Gemini JSON responses. It also had the EC2 video processor load its .env via a systemd EnvironmentFile and split the import progress UI into separate photo and video counters with deterministic (non-retryable) error display.",
    category: "backend",
    tags: ["video-validation", "streaming-upload", "GCS", "json-repair", "Gemini", "config"],
    significance: "moderate"
  },
  143: {
    summary: "GCP environment isolation — stage-specific Cloud Run services, Cloud Tasks queues, and CDN buckets",
    detail: "This PR removed hardcoded GCP values so dev and prod no longer share infrastructure. The video processor now reads GCS_CDN_BUCKET, GCS_VIDEOS_BUCKET, and CDN_BASE_URL from environment variables, and the backend resolves stage-specific Cloud Run URLs, Cloud Tasks queue paths, and GCS CDN bucket names. It also swept out the last lingering clip-extractor reference, completing that service's retirement.",
    category: "infrastructure",
    tags: ["gcp", "env-isolation", "Cloud-Run", "Cloud-Tasks", "CDN", "stage-config"],
    significance: "moderate"
  },
  144: {
    summary: "Fix deploy-prod.yml Cloud Run job using stale service name and env vars",
    detail: "A one-file deploy-workflow fix ensuring production deploys target video-processor-prod with the correct stage-specific GCS_CDN_BUCKET, CDN_BASE_URL, and 8Gi memory — bringing deploy-prod.yml into alignment with deploy-cloud-run.yml.",
    category: "devops",
    tags: ["deploy-workflow", "Cloud-Run", "prod", "config-fix"],
    significance: "minor"
  },
  145: {
    summary: "Per-project cost tracking across all AI/compute services, cancellable Google Photos imports, and bug fixes",
    detail: "This PR instrumented every Gemini, Rekognition, Whisper, Cloud Run, and EC2 call with fire-and-forget cost events written to a dedicated DynamoDB table, then surfaced per-project cost breakdowns in the admin UI with a sortable column and detail modal — giving the first real visibility into what each project actually costs to produce. It added cooperative cancellation for Google Photos imports, where the worker checks job status between batches and a cancel endpoint triggers background cleanup of already-imported photos. It also fixed a video-processor callback 404 (a /dev suffix incompatible with HTTP API v2), broken timeline clip thumbnails (hardcoded cdn.kindredreels.com replaced with the stage-aware bucket), and bumped Cloud Run max-instances from 5 to 100.",
    category: "backend",
    tags: ["cost-tracking", "DynamoDB", "import-cancellation", "admin-ui", "observability", "Cloud-Run-scaling"],
    significance: "major"
  },
  146: {
    summary: "Admin dashboard performance — shared server-side caches, batch cost endpoint, and React Query on the frontend",
    detail: "This PR eliminated redundant DynamoDB scans and Cognito API calls that made the admin dashboard slow. Previously each admin tab independently triggered a full table scan and Cognito pagination; now a shared adminDataLoader and cognitoCache serve a single cached scan and Cognito listing across all admin handlers (30s/60s TTL). The frontend adopted React Query hooks with 60s staleTime so tab switches became instant, and the change also folded in a batch cost endpoint and a video re-analyze button. The deletion-heavy diff reflects handlers shedding their duplicated scan logic.",
    category: "backend",
    tags: ["admin-dashboard", "caching", "DynamoDB", "Cognito", "react-query", "performance"],
    significance: "moderate"
  },
  147: {
    summary: "Deterministic project classification and composable architect prompts for the video organization pipeline",
    detail: "Added a classification step that categorizes every project (single_event, multi_day_trip, multi_year_montage, highlights_reel, tribute, miscellaneous) purely from date distribution and title keywords — no Gemini call required, saving latency and cost. Architect prompts were decomposed into composable blocks with per-category addendums and section objectives that flow downstream to the curator, and chronology handling was expanded to all project types with EXIF sanity checks and a visual era estimation fallback. Bundled fixes cleaned up AddPhotosModal stale state on reopen, video clip thumbnail fallbacks, cover-photo defaulting to video records, and a float-to-Decimal conversion bug in EC2 cost tracking.",
    category: "ai",
    tags: ["project-classification", "prompt-engineering", "event-organizer", "chronology", "cost-optimization"],
    significance: "major"
  },
  148: {
    summary: "Three-layer fix eliminating clip audio sync drift by keeping audio in segments and rebuilding the timeline from probed durations",
    detail: "Attacked a bug where clip audio drifted 2-4 seconds out of sync by the end of an 8-minute video. Clip audio is now embedded directly in segments at the correct sample rate (aresample=44100) so it syncs by construction, silent audio is remuxed onto slideshow segments for stream consistency, and the timeline is rebuilt from actual ffprobe'd segment durations rather than model predictions — eliminating cumulative rounding errors in music ducking positions. The final layer always mixes video audio with ducked music, removing a conditional that could silently drop all clip audio. Also introduced a new speech_detection service, three-level ducking, and a Claude Code pre-push hook that runs lint, tests, and build before every push.",
    category: "processing",
    tags: ["audio-sync", "ffmpeg", "audio-ducking", "speech-detection", "timeline", "pre-push-hook"],
    significance: "major"
  },
  149: {
    summary: "Landing page refresh with rewritten copy, micro-animated How It Works cards, and removal of the Technology page",
    detail: "Rewrote the landing page around broader product positioning (no longer tribute-only), stripping every user-facing 'AI' reference and adding fresh Hero, How It Works, Features, Voice Memories, FAQ, Pricing, and Final CTA sections. The How It Works cards gained CSS micro-animations — drifting photos, a curation filter, equalizer bars, and a film frame with a play pulse — plus framer-motion whileInView entrance animations. The Technology page, its architecture diagram, route, nav/footer links, and now-unused screenshot PNGs were removed, and a useIsDesktop hook was added.",
    category: "design",
    tags: ["landing-page", "framer-motion", "micro-animations", "copywriting", "positioning"],
    significance: "moderate"
  },
  150: {
    summary: "Fix for broken production email/password signup caused by stage-unaware Cognito triggers",
    detail: "Production signups were silently failing because the Cognito PreSignUp and PostConfirmation Lambda triggers were hardcoded to the dev user pool, creating unconfirmed users that never auto-logged in. Made the pool references stage-aware, added a confirmation-code fallback flow for when auto-confirm isn't available, and switched signup validation to inline field errors (red border plus text below the field) rather than a top-level banner that was invisible on mobile.",
    category: "backend",
    tags: ["cognito", "signup", "auth", "stage-config", "form-validation"],
    significance: "moderate"
  },
  151: {
    summary: "Admin permanent user deletion with cascading cleanup across every storage system",
    detail: "Added a delete button to the admin users page that permanently removes a user and all associated data — projects, photos, videos, recordings, music, Rekognition collections, S3/GCS files, DynamoDB records, and the Cognito account — guarded by a double-confirmation dialog for users with projects. A follow-up fix caught a missing barrel export in admin/index.js that crashed server startup, prompting the addition of `node --check src/server.js` to the pre-push hook and CLAUDE.md checklist to guard against a class of bug that ESLint and Jest miss.",
    category: "backend",
    tags: ["admin", "user-deletion", "cascading-cleanup", "data-cleanup", "pre-push-hook"],
    significance: "moderate"
  },
  152: {
    summary: "Tier 1 friends-and-family feedback fixes spanning landing, upload flow, and video sharing",
    detail: "Shipped three phases of polish from early user feedback. Landing and About copy dropped jargon like 'Ken Burns' and vague 'Unlimited' pricing in favor of concrete benefit-oriented messaging. The upload flow gained a disabled Done button during active uploads, cancel confirmations, and desktop/mobile guidance callouts. Timeline and sharing improvements auto-play the video on mount, toast after drag-reorder saves, stop the public video view from leaking the project's story field, and give videos real cover-photo thumbnails and friendly names ('Video 1/2/3' instead of hex IDs) with corrected recording counts.",
    category: "frontend",
    tags: ["user-feedback", "upload-flow", "copywriting", "video-sharing", "ux-polish"],
    significance: "moderate"
  },
  153: {
    summary: "Smart audio ducking driven by a new Gemini audioSignificance rating combined with Whisper classification",
    detail: "Introduced a three-tier music ducking model that fuses Whisper's audio classification with a new Gemini visual audioSignificance field (high/medium/low). Concerts and performances now get near-silent background music even when no speech is detected, while wind noise and traffic let the music stay prominent. The change also threaded actionCenterY through the render pipeline to enable smart cropping for vertical video.",
    category: "ai",
    tags: ["audio-ducking", "gemini", "whisper", "audio-significance", "vertical-video"],
    significance: "moderate"
  },
  154: {
    summary: "Unified lightbox merging Timeline detail and Organization mode viewers into one metadata-rich component",
    detail: "Consolidated the separate Timeline detail view and Organization mode lightbox into a single UnifiedLightbox with filmstrip navigation, keyboard arrows, and a full metadata side panel — extracted into LightboxMetadataPanel and LightboxActions and wired through TimelineTab, MobileTimelineView, and OrganizationModeView. Org-mode section items gained the same rich metadata alongside Remove/Move actions, and clip info was split into distinct Audio Analysis and Clip Details sections. The PR also deleted nine spec documents for fully-implemented features, netting a large deletion count (~3,900 lines removed).",
    category: "frontend",
    tags: ["lightbox", "component-consolidation", "metadata-panel", "timeline", "refactor"],
    significance: "major"
  },
  155: {
    summary: "Unified cover-photo handling with a picker in the generate modal and a sweep of emoji-to-SVG icon cleanup",
    detail: "Established a single source of truth for cover photos across all views via shared fallback utilities (last photo in the last section, never the first) and added a cover-photo picker to GenerateVideoModal. Video clips became eligible as cover photos through FFmpeg frame extraction at render time, and the Gemini architect prompt was tuned to prefer group photos from later sections. Smart re-create behavior preserves an existing cover when it survives into the new timeline and picks fresh when excluded, and the projects list now pulls thumbnails via titleCoverPhotoId through React Query. All 19 emoji icons were replaced with flat single-color lucide-react SVGs for visual consistency.",
    category: "frontend",
    tags: ["cover-photo", "generate-modal", "lucide-icons", "react-query", "ffmpeg"],
    significance: "moderate"
  },
  156: {
    summary: "YouTube API compliance fixes adding policy disclosures and the official two-tone icon",
    detail: "Brought the app into YouTube API Services compliance by adding a YouTube ToS reference to the Terms of Service and a dedicated YouTube API Services section to the Privacy Policy covering data storage, access revocation instructions, and a Google Privacy Policy link. Also swapped the monochrome YouTube SVGs for the official two-tone icon (red #FF0000 with a white play triangle) across the Share modal, upload panel, and video card badge.",
    category: "frontend",
    tags: ["youtube-api", "compliance", "privacy-policy", "terms-of-service", "branding"],
    significance: "minor"
  },
  157: {
    summary: "Graceful handling of revoked Google Photos tokens instead of a 500 error",
    detail: "When a user revoked Google Photos access from Google's side, API calls failed with a 500 because the service layer never inspected 401/403 responses. The fix detects revoked tokens, clears the stored credentials, and returns a 401 so the frontend can surface the reconnect prompt rather than an opaque server error.",
    category: "backend",
    tags: ["google-photos", "oauth", "token-revocation", "error-handling"],
    significance: "minor"
  },
  158: {
    summary: "Comprehensive branded email system with seven email types plus a full login page rewrite",
    detail: "Built a shared dark-theme branded email template and seven email types — welcome, verification, password reset, invitation, reminder, video ready, and contributor recorded — with Cognito wired to send through SES (noreply@kindredreels.com) via a CustomMessage Lambda trigger. Email verification is now required for native signups (auto-confirm removed), with welcome emails sent post-verification for native users and immediately for Google OAuth, while video-ready notifications fire from an EC2 orchestrator callback to a new internal endpoint. The login page was rewritten with Sign In / Create Account tabs and forgot-password now detects Google-only accounts, and the deploy pipeline auto-restores the Cognito SES config after each serverless deploy.",
    category: "backend",
    tags: ["email", "ses", "cognito", "notifications", "login", "transactional-email"],
    significance: "major"
  },
  159: {
    summary: "Sweeping semantic token refactor plus a full light mode for the frontend",
    detail: "A three-phase theming overhaul that migrated ~2,500 raw Tailwind gray-scale classes into 27 semantic CSS variable tokens defined via @theme in index.css, covering surfaces, borders, text hierarchy, and component tokens. A .light class override with inverted token values means every component themes automatically through the CSS cascade thanks to Tailwind v4's runtime var(--color-*) utilities. The PR added a ThemeContext/ThemeProvider, a Sun/Moon ThemeToggle, FOUC-prevention inline script, and localStorage persistence — touching 167 files and fixing latent bugs like bg-gray-750 hover breakage, ~120 text-white-on-light instances, and a pre-existing bg-primary-600 bug on the Google Photos button.",
    category: "design",
    tags: ["semantic-tokens", "light-mode", "tailwind-v4", "theming", "design-tokens", "refactor"],
    significance: "major"
  },
  160: {
    summary: "Fix to surface the theme toggle on mobile headers",
    detail: "The ThemeToggle had been living only inside hidden md:flex desktop nav containers, leaving mobile users with no way to switch themes. This added it next to the hamburger/menu button on both the app header and the landing page navbar.",
    category: "design",
    tags: ["light-mode", "theme-toggle", "mobile", "responsive"],
    significance: "minor"
  },
  161: {
    summary: "GCP cost exploration correcting Vertex pricing rates and disabling idle-CPU billing",
    detail: "Corrected costTracker.js Gemini Flash rates to actual Vertex AI pricing ($0.30 in / $2.50 out per 1M tokens, previously using Developer API rates) and removed --no-cpu-throttling from the video-processor deploy configs across CLAUDE.md and both GitHub Actions workflows to stop idle-CPU billing between requests. A new docs/gcp-cost-exploration-2026-04.md captured the full investigation — billing snapshot, where Gemini is called from, Vertex pricing, tracker-vs-bill reconciliation, and notes toward an open-weights/self-hosting decision — and orphaned Cloud Run services were cleaned up via gcloud.",
    category: "infrastructure",
    tags: ["gcp", "cost-tracking", "vertex-ai", "cloud-run", "cpu-throttling"],
    significance: "minor"
  },
  162: {
    summary: "GCS bucket names moved onto stage-aware env vars, plus a silent prod callback URL bug fixed",
    detail: "Phase 1 of the GCS region consolidation: GCS_PHOTOS_BUCKET, GCS_VIDEOS_BUCKET, and VIDEO_PROCESSOR_CALLBACK_URL were lifted out of hardcoded STAGE construction and into stage-aware custom: mappings in serverless.yml, so Phase 2 could move buckets to us-east4 as a pure data move with zero code changes. Both gcsService.js and imageProcessor.py now read bucket names from env with cold-start assertions. The branch also caught a latent bug where prod inherited the dev VIDEO_PROCESSOR_CALLBACK_URL from .env because .env.prod never overrode it — silently stranding every prod device-video upload at videoProcessingStatus=pending. The unused gcsBucket field write was also cleaned out of five files.",
    category: "infrastructure",
    tags: ["GCS", "env-vars", "serverless", "callback-url", "prod-fix"],
    significance: "moderate"
  },
  163: {
    summary: "GCS bucket region migration to us-east4 (Phase 2)",
    detail: "The three remaining us-east1 buckets (kindred-reels-photos-dev, kindred-reels-videos-dev, kindred-reels-videos-prod) were migrated to us-east4, co-locating all six kindred-reels-* buckets with Cloud Run, Vertex AI, Cloud Tasks, and the CDN buckets. Because Phase 1 had already moved bucket names onto env vars, the move required no code or config changes — just a GCP-side data move with roughly 2-3 minutes of downtime per bucket. New buckets were recreated with original UBLA, storage class, soft-delete, CORS, and the critical IAM bindings (including compute SA:objectUser on the videos buckets to prevent Cloud Run 403s), verified against byte and object counts before the source buckets were hard-deleted.",
    category: "infrastructure",
    tags: ["GCS", "region-migration", "us-east4", "cloud-run"],
    significance: "minor"
  },
  164: {
    summary: "Timeline-v2 drag-and-drop redesign — a full merged-timeline editing surface with multi-select and multi-drag",
    detail: "The largest PR in the project at +23,966/-7,697 across 157 files, wrapping a long-running multi-feature branch. The centerpiece is the Timeline-v2 DnD redesign at /timeline-v2: a merged-timeline view with live-rearrange within-section reorder, cursor-positional drops via a phantom system, cross-section drag with 700ms collapsed-section auto-expand and auto-scroll, left-to-right drag-to-remove, multi-select (cmd/shift-click, Escape to clear), and multi-drag with a stacked overlay, count badge, 40% source-dim, and drops across all four surfaces — plus a floating action bar. Riding alongside: a cost-tracking gap fix that finally instruments per-photo upload Gemini analysis (revealed to be 29% of a project's cost) and multimodal embedding end-to-end, validated at $0.667 fully-loaded for an 88-photo/27-video project; and a thematic-stage model revert from gemini-3-flash-preview back to gemini-2.5-flash after the preview model's drifting safety calibration began randomly tripping PROHIBITED_CONTENT on photos already cleared upstream.",
    category: "frontend",
    tags: ["timeline-v2", "drag-and-drop", "multi-select", "cost-tracking", "curation", "gemini"],
    significance: "major"
  },
  165: {
    summary: "Secrets hardening to AWS Secrets Manager, plus timeline onboarding, section music, and manual photo rotate",
    detail: "A broad batch on the misc-fixes branch anchored by secrets hardening: VIDEO_PROCESSOR_CALLBACK_SECRET moved into AWS Secrets Manager with distinct rotated per-stage values via a new shared loader backend/src/shared/secrets.js, with plaintext scrubbed from serverless.yml, GitHub workflows, the deploy script, and dotenv injection; validators, senders, and the EC2 renderer all read from it. OPENAI_API_KEY was descoped and revoked (transcription parked). The branch also delivered curation-quality fixes, timeline onboarding and section-music modals, a manual photo-rotate control, and storage-migration and cloud-inventory recon docs, landing green at 1054 backend and 1149 frontend tests.",
    category: "backend",
    tags: ["secrets-manager", "security-hardening", "section-music", "photo-rotate", "curation"],
    significance: "moderate"
  },
  166: {
    summary: "Deterministic temporal segmentation replaces the AI architect for chronological projects, with a balanced DP partitioner",
    detail: "A pivotal shift in how timelines get their structure: deterministic temporal segmentation now handles chronological projects, demoting the Gemini architect to fallback-only, with global section naming drawn from curator summary fragments. A new balanced DP partitioner — event atoms fed through a linear-partition dynamic program — fixes pathological section splits like the 348/70/70/36 imbalance on Outer Banks 2012. Thematic hardening raised maxOutputTokens to 65536 and capped sequential chunked calls at 100 reps to stay out of the PROHIBITED_CONTENT zone. The batch also added orientation auto-detect via head-direction observable on gemini-3.5-flash (94% validated), a pipeline swap to gemini-3.1-flash-lite, and Security batch 1: share-code validation on the public recordings endpoint, API Gateway throttling, HTML-escaped branded emails, and Jinja2 autoescape in the slide renderer.",
    category: "ai",
    tags: ["segmentation", "dp-partitioner", "curator", "thematic-stage", "security", "gemini"],
    significance: "major"
  },
  167: {
    summary: "Documentation overhaul: ground-truth verification, distillation ledgers, and rewritten reference docs",
    detail: "A seven-phase documentation rebuild grounded in live AWS/GCP inspection and code-surface maps. Phase C distilled 277 entries mined from progress logs, recons, and old reference docs; Phase D rewrote the full reference set — ARCHITECTURE, DATA_MODEL, API, INFRASTRUCTURE, PIPELINES, VIDEO_RENDERING, DEPLOYMENT, OPERATIONS, LOCAL_SETUP, FRONTEND — behind a new authoritative docs/INDEX.md. Phase E ran 11 adversarial checkers against 600 claims and applied 79 fixes, catching drift like EC2 SSH open to 0.0.0.0/0 and inbound mail actually served by Google Workspace rather than SES. Phase F archived ~35 historical docs with dated banners, trimmed progress.md to a rolling two-month window, and shrank the root README from ~904 to ~80 lines — dropping CLAUDE.md's always-loaded doc context from ~1970 to 46 lines.",
    category: "docs",
    tags: ["docs-overhaul", "adversarial-verification", "INDEX", "archive", "ground-truth"],
    significance: "moderate"
  },
  168: {
    summary: "Curation overhaul: image-aware cover selection, a content-value gate, merit scoring, and the clip pipeline",
    detail: "A deep quality pass on Create Timeline curation. Clip analysis in the Cloud Run video-processor flipped to gemini-3.1-flash-lite with safety-off and a full-video Whisper transcript feeding a rewritten clip-selection prompt. A content-value gate at upload analysis assigns each photo a contentRole (people/place/detail/functional) that hard-excludes functional captures before curation, plus a four-dimension highlightMerit surfaced to the curator for ranking. The curator moved to an index-based response contract (item numbers, not hex) with a target-sliced fallback, and adopted a merit floor where per-call targets are an aim rather than a quota — any theme may keep nothing if all items are weak. Cover-photo selection became curator-nominated, image-aware, and last-section-biased with five-dimension scoring, fixing a bug where projectCoverPhotoId was silently dropped across draft write, allowlist, and read-transform. A screen-time-driven photo/clip split with a balance slider rounds it out.",
    category: "ai",
    tags: ["curation", "content-role", "merit-scoring", "cover-photo", "clip-pipeline", "whisper"],
    significance: "major"
  },
  169: {
    summary: "Photo library flattened to individual tiles, warm-voice copy pass, cluster dedup, and an org-mode toggle",
    detail: "The photo library was flattened to individual item tiles with video clips folded into their source video, every tile opening the UnifiedLightbox in timeline mode; deleting an in-timeline item now cascades memory cleanup so no dangling memory is left behind. A user-facing copy pass vendored the avoid-ai-writing skill into the project and wired it into the CLAUDE.md checklist, then stripped literal \"AI\"/model names and em dashes from live copy with a warm-voice rewrite of the landing and about pages. Curation now keeps exactly one photo per embedding cluster (enforced in both prompt and validateClusterResult), and a new organization-mode toggle defaults to chronological — running the architect only for tributes, explicit theme mode, or user-supplied section descriptions.",
    category: "frontend",
    tags: ["photo-library", "unified-lightbox", "copy-pass", "cluster-dedup", "org-mode"],
    significance: "moderate"
  },
  170: {
    summary: "Music section-timing fixes plus a video-pending resilience fix with a scheduled stuck-video sweep",
    detail: "Two related repairs. First, single-section highlights videos were rendering with no background music because the renderer derived sections from section-title card items — which highlights lack — so both timeline builders now derive section boundaries from each item's section_id via shared, card-independent helpers; music-chain duration estimates also switched from a flat 4s-per-photo guess to summing real item durations so clip-heavy sections stop under-chaining. Second, a race where both video-confirm handlers sent the HTTP response before awaiting callVideoProcessor — unreliable under serverless-http, which ends the Lambda when the response flushes — could strand contributor videos at pending forever, blocking Create Timeline. The fix enqueues before responding, backed by a scheduled sweepStuckVideos Lambda (every 10 minutes) that finds stale pendings via a new sparse VideoPendingIndex GSI, re-dispatches up to three times, then marks them failed to unblock the user.",
    category: "backend",
    tags: ["music-timing", "video-pending", "stuck-video-sweep", "dynamodb-gsi", "serverless"],
    significance: "moderate"
  },
  171: {
    summary: "Timezone-aware timestamps: honest EXIF-offset ingest plus naive-clock interpretation to stop phantom section splits",
    detail: "Cross-source clock skew had been splitting single events into phantom sections — the Outer Banks wild-horse case saw Lumix stills store local wall-clock as if UTC, landing 4 hours off Google Photos items of the same moment. imageProcessor.py now reads OffsetTimeOriginal for true UTC (tagged exif-offset), marks naive times none, and extracts camera make/model, while Google imports are tagged import and device videos container-utc. A new organize-time naiveClockInterpretation.js derives the project's local offset from trusted items and shifts naive-domain effectiveDates by one constant per-device offset, no-opping without evidence. New photo fields (tz_evidence, exif_tz_offset, camera_make, camera_model) were wired through. The branch also bumped google-auth-library v9 to v10 and fixed the YouTube share panel's unreachable Connect button.",
    category: "backend",
    tags: ["timezone", "exif-offset", "naive-clock", "segmentation", "photo-metadata"],
    significance: "moderate"
  },
  172: {
    summary: "Zero-warning lint enforcement: 1728 warnings cleaned and max-warnings 0 enforced before push",
    detail: "CI had been annotating PRs with eslint warnings that local checks never surfaced, because pre-push ran --quiet while CI ran the warning-inclusive lint — this closed that gap. On the backend, no-console was turned off (console logging is the house style, and the rule alone produced 1612 useless warnings), with 51 unused-var fixes across 34 files and three dead legacy functions deleted. On the frontend, all 35 react-hooks/exhaustive-deps warnings were resolved case by case, uncovering a real bug where PhotoUpload's callback omitted shareCode/contributorName deps and could route contributor uploads through the wrong endpoint with stale attribution. Both sides now run --max-warnings 0, and all five GitHub Actions workflows were bumped to current majors to clear Node 20 deprecation annotations.",
    category: "devops",
    tags: ["eslint", "max-warnings", "react-hooks", "ci", "github-actions"],
    significance: "moderate"
  },
  173: {
    summary: "Contributor chips in the library grid, a unified tile-badge system, and file-mtime timezone evidence",
    detail: "Contributed items now surface their provenance: the photos API returns contributorName/uploadedViaShareCode (the handler had been dropping them), a contributor chip renders first name at larger sizes and initials at small with the full name in tooltip, and the filter dropdown gains per-contributor options with counts. The tile-badge system was reworked into a single TileBadge component with documented corner semantics — top-left controls, top-right warnings, and a single bottom bar splitting provenance/membership from media facts — with clip count merged into one neutral \"1 clip · 0:13\" chip and a density policy that strips facts and names on 20px thumbnails. A timezone follow-up tags direct-upload videos file-mtime from their lastModified epoch (true UTC by construction), since iOS browser uploads often strip container creation_time; the naive-clock interpreter trusts and never shifts these.",
    category: "frontend",
    tags: ["contributor-chips", "tile-badge", "photo-library", "timezone", "file-mtime"],
    significance: "minor"
  },
  175: {
    summary: "Three-step project stepper, library cleanup, button standardization, and section music picker fixes",
    detail: "Added a state-aware desktop stepper (Add Photos & Videos, Create Timeline, Create Video) with mobile step checkmarks in the bottom nav, extracting the triplicated 10-item threshold into utils/timelineGate.ts. Standardized to one solid-blue primary per header cluster, retiring the gradient/sparkle treatment app-wide and renaming Generate to Create Timeline. Fixed the section music picker Save (the PATCH was missing its JSON content-type; authenticatedFetch now defaults it for string bodies), made selected tracks reorderable via dnd-kit, and moved the projectUserPrefs setter from a full put to an update expression so sibling flags can't clobber each other.",
    category: "frontend",
    tags: ["project-stepper", "library", "button-standardization", "music-picker", "dnd-kit"],
    significance: "moderate"
  },
  176: {
    summary: "Photo rotation everywhere, group-first lightbox redesign, and video clips inside memories",
    detail: "A sweeping UX and rendering pass: restored left/right photo rotation across all detail views via a shared RotateControls, deleting the dead 1,335-line StandalonePhotoModal. The lightbox side panel was rebuilt group-first at 480px wide, leading with a MEMORY block (recorded-by row, inline name edit, items grid, transcript) above the individual item's fields, with a frameReady-gated ClipPlayer that shows spinner-on-black until the clip's true start frame is displayable. On the pipeline side, render_memory_segment gained muted, letterboxed, freeze-at-end clip slides with orchestrator wiring, and memoryHandler's four hydration spots were fixed to use the clip-safe cdn_thumbnail_url chain (clips are virtual and have no storage_path).",
    category: "frontend",
    tags: ["lightbox", "photo-rotation", "video-clips", "memories", "clip-player"],
    significance: "major"
  },
  177: {
    summary: "Removed the voice-memories question from Create Timeline in favor of user-created multi-photo memories",
    detail: "The Create Timeline modal's voice-memories question only served to let Gemini pre-group 2-5 related photos into multi-photo memories with suggested prompts, and the groupings weren't good enough to keep. The modal now asks only the tribute question and always sends includeVoiceMemories: false; the backend grouping plumbing is kept but dormant, and voice recording on memories is unaffected, leaving multi-photo memories entirely user-created.",
    category: "ai",
    tags: ["curation", "gemini", "voice-memories", "create-timeline", "grouping"],
    significance: "minor"
  },
  178: {
    summary: "Retired admin-dashboard and music-library full-table scans behind a shared sparse AdminIndex GSI",
    detail: "Replaced the scan({})-backed admin dashboard and music library with a shared sparse GSI (AdminIndex) keyed by a type discriminator: createProject writes adminPk='PROJECT' and createMusic writes adminPk='MUSIC'. The adminDataLoader now queries the index with per-project SK-scoped COUNT and video queries (never reading the EMBEDDING# range), and getAllMusic queries plus batchGets, retiring four MUSIC scans that also sat on video generation, auto-music, and the background-music picker. Shipped with an addAdminIndex.js migration (create + backfill, stage-safe with typed confirmation) and a serverless.yml grant scoping the api Lambda role to the index ARN; dev backfilled 46 projects and 54 music records.",
    category: "backend",
    tags: ["dynamodb", "gsi", "performance", "full-table-scan", "migration"],
    significance: "major"
  },
  179: {
    summary: "Signature animated hero on the landing page that demonstrates the whole curation-to-video story",
    detail: "Replaced the abstract How It Works cards with HeroTransformation: contributor chips (You / Mom / Uncle Dave) pile in 14 real photos, a whimsical logo-faced curation machine swallows them, spits out duplicates and blurry rejects while floating date chips, then emits the 10 keepers into a film strip behind a faithful Timeless-theme title slide, ending on a pulsing play button. Built as a 969-line component driven by a typed choreography manifest, with geometry computed from measured band size in two orientations (horizontal on desktop, vertical gravity layout under 768px), a prefers-reduced-motion static composition, and 12 Unsplash-sourced WebP assets totaling 276KB. How It Works moved to a new public /how-it-works page.",
    category: "design",
    tags: ["landing-page", "hero-animation", "choreography", "responsive", "reduced-motion"],
    significance: "major"
  },
  180: {
    summary: "Repositioned the transformation-band captions and rebalanced mobile spacing",
    detail: "A polish pass on the new hero animation: phase captions moved to the top of the panel on both layouts, with a fixed two-line height on mobile so longer captions never bounce the band below them, and the replay button relocated to the panel's top-right. Mobile vertical spacing was rebalanced so the machine chute sits right at the player's top edge, reclaiming space for more air above the chips and between the chips and the tray.",
    category: "design",
    tags: ["landing-page", "hero-animation", "mobile-layout", "polish", "captions"],
    significance: "minor"
  },
  181: {
    summary: "End-to-end feedback capture: a global header button, an admin triage loop, and proactive failure prompts",
    detail: "Built a full feedback loop from a new FEEDBACK entity that writes adminPk='FEEDBACK' as a third discriminator into the existing AdminIndex, exposed via POST /api/feedback and GET/PUT /api/admin/feedback, with an SES notification to feedback@kindredreels.com awaited in try/catch so an unawaited promise can't silently drop. The frontend added a zustand useFeedbackStore and a single FeedbackDialog that captures rich context at the trigger — route, user, version, viewport, plus a project bundle of media makeup, memories, music, theme, and render status — surfaced through an auth-gated header button and a newest-first /admin/feedback triage page. Part 2 wired proactive prompts that reuse the same opener: render-fail-while-watching auto-opens the dialog, already-failed videos get a Report this chip, and upload failures get a Report pill.",
    category: "frontend",
    tags: ["feedback-capture", "triage", "zustand", "admin", "instrumentation"],
    significance: "major"
  },
  182: {
    summary: "Beta instrumentation suite: media attribution, share-view counters, failure alerts, and a conversion funnel",
    detail: "A five-phase instrumentation push toward beta. Phase 1 stamped uploader/contributor attribution on every media path (uploaderId on authenticated uploads and Google imports, client-generated contributorId + shareCode on share paths, clip inheritance from source video) plus is_tribute and timeline_first_applied_at at draft apply. Phase 2 added an atomic fire-and-forget view counter on VIDEO_SHARE# records from the public watch page; Phase 3 sent founder failure emails on import/clip/render failures and swept silent render hangs via a RENDER#PENDING partition. Phase 4 introduced a daily funnelSnapshot Lambda writing immutable FUNNEL_SNAPSHOT# records with stage counts split by strangers/tribute/multi-contributor/voice (with a stranger-exclusion list of the 16 pre-beta prod accounts), and Phase 5 shipped the /admin/funnel page. Verification also uncovered fixes: the tribute chronology was ported to chunked fail-open Gemini calls after a single PROHIBITED_CONTENT response was killing whole tribute runs.",
    category: "backend",
    tags: ["instrumentation", "conversion-funnel", "attribution", "failure-alerts", "gemini-fail-open"],
    significance: "major"
  },
  183: {
    summary: "Watch-page conversion loop with make-your-own CTAs, Netflix-style credits mode, link previews, and signup attribution",
    detail: "The public watch page became a conversion surface: distinct ?ref=watch-* CTAs across an end-of-video overlay, a below-player block, the header, and the footer, plus a Netflix-style credits mode that shrinks the video to a corner tile two seconds in (timing driven by a new creditsDuration in the public payload) while a CTA card fills the space. A new watchPreview Lambda serves /watch/* HTML with each reel's real title and thumbnail in OG/Twitter tags so crawlers that never run JS get proper unfurls — exposed as ANY /watch/{shareCode} rather than a Function URL (blocked account-wide) and fronted by a CloudFront origin group with S3 failover. Signup ref attribution captures ?ref= into sessionStorage, survives the OAuth round trip, and reports once via POST /api/users/signup-source (first ref wins, accounts under 7 days), feeding signups-by-ref into the funnel.",
    category: "frontend",
    tags: ["conversion-funnel", "watch-page", "link-previews", "cloudfront", "signup-attribution"],
    significance: "major"
  },
  184: {
    summary: "Funnel v2 with a people-based user funnel and Tailwind bar visualizations on /admin/funnel",
    detail: "Made the admin funnel two-part by adding computeUserFunnel() to the snapshot Lambda — a people-based funnel (signed up, created a project, generated a video, shared a video) computed over the AdminIndex USER partition with zero new queries by grouping the existing per-project fan-out rows, carrying {overall, strangers} per stage. The frontend gained a chart-library-free FunnelBars component rendering Tailwind horizontal bars with share-of-first-stage percentages and green/red trend deltas versus the previous snapshot, plus an Overall/Strangers toggle driving both funnels. Share-of-first was chosen deliberately: because timeline_first_applied_at only exists on projects touched since Jul 13, stage-to-stage ratios produced a 360% artifact. Shipped with the first-ever funnelSnapshot test suite (6 cases including a payload regression lock).",
    category: "frontend",
    tags: ["conversion-funnel", "admin", "data-visualization", "analytics", "tailwind"],
    significance: "moderate"
  },
  185: {
    summary: "Warm \"photo album\" retheme and a full landing overhaul spanning 153 files",
    detail: "An eight-phase retheme that replaced the app's look with a warm photo-album palette: self-hosted Karla/Lora/Caveat fonts, warm dark and light token sets with light as the new default, mood/role/tint tokens, animation glows via color-mix on --color-primary, a force-dark overlay for always-dark surfaces, and a full palette-literal sweep to classified exceptions. A shared BrandMark component rolled the new Solid Weave logo everywhere with an adaptive favicon, per-theme theme-color meta, and an /og-image.png that finally closed the broken social-preview bug. The landing page was overhauled with a serif headline, a polaroid-cluster hero promoting HeroTransformation to centerpiece, a SampleVideosSection, and an inline-playing vacation sample that grows into the persistent brown panel with native controls; a standing copy rule (input = clips, output = video/reel) threaded clip visibility through the manifest, headline, and meta descriptions.",
    category: "design",
    tags: ["retheme", "theming", "landing-page", "design-tokens", "branding", "fonts"],
    significance: "major"
  }
};

// Build entries
const entries = prs.map((pr, index) => {
  const enrichment = enrichments[pr.number];
  if (!enrichment) {
    console.warn(`No enrichment for PR #${pr.number}: ${pr.title}`);
    return null;
  }

  const commitMessages = pr.commits.map(c => {
    const parts = [c.messageHeadline];
    if (c.messageBody) parts.push(c.messageBody);
    return parts.join('\n\n');
  });

  const filesChanged = pr.files.map(f => ({
    path: f.path,
    additions: f.additions,
    deletions: f.deletions
  }));

  return {
    id: `pr-${pr.number}`,
    prNumber: pr.number,
    date: pr.mergedAt.split('T')[0],
    mergedAt: pr.mergedAt,
    title: pr.title,
    branch: pr.headRefName,
    summary: enrichment.summary,
    detail: enrichment.detail,
    category: enrichment.category,
    tags: enrichment.tags,
    significance: enrichment.significance,
    stats: {
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles
    },
    filesChanged,
    commitMessages
  };
}).filter(Boolean);

writeFileSync(join(DATA_DIR, 'entries.json'), JSON.stringify(entries, null, 2));
console.log(`Generated ${entries.length} entries`);

// Validation
const categories = new Set(entries.map(e => e.category));
const significances = new Set(entries.map(e => e.significance));
console.log('Categories:', [...categories].sort().join(', '));
console.log('Significances:', [...significances].sort().join(', '));
console.log('Major PRs:', entries.filter(e => e.significance === 'major').length);
console.log('Moderate PRs:', entries.filter(e => e.significance === 'moderate').length);
console.log('Minor PRs:', entries.filter(e => e.significance === 'minor').length);
