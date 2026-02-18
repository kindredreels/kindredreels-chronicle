/**
 * File categorization for CodeChronicle
 * Determines which category a file belongs to based on path and extension
 */

// Category definitions with patterns
// Order matters for priority (first match wins)
const CATEGORIES = [
  {
    name: 'tests',
    match: (filepath) => /\.(test|spec)\.(js|ts|tsx|jsx)$/.test(filepath) ||
                         filepath.includes('__tests__/')
  },
  {
    name: 'codeChronicle',
    match: (filepath) => filepath.startsWith('code-chronicle/') &&
                         (filepath.endsWith('.js') || filepath.endsWith('.html') || filepath.endsWith('.css'))
  },
  {
    name: 'claudePlans',
    match: (filepath) => filepath.startsWith('.claude/plans/') && filepath.endsWith('.md')
  },
  {
    name: 'cicd',
    match: (filepath) => filepath.startsWith('.github/workflows/') &&
                         (filepath.endsWith('.yml') || filepath.endsWith('.yaml'))
  },
  {
    name: 'frontend',
    match: (filepath) => filepath.startsWith('frontend/src/') &&
                         (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) &&
                         !filepath.includes('.test.')
  },
  {
    name: 'backend',
    match: (filepath) => filepath.startsWith('backend/src/') &&
                         filepath.endsWith('.js') &&
                         !filepath.startsWith('backend/src/scripts/') &&
                         !filepath.includes('__tests__')
  },
  {
    name: 'scripts',
    match: (filepath) => filepath.startsWith('backend/src/scripts/') &&
                         filepath.endsWith('.js')
  },
  {
    name: 'processing',
    match: (filepath) => filepath.startsWith('processing/') &&
                         filepath.endsWith('.py') &&
                         !filepath.includes('/venv/')
  },
  {
    name: 'docs',
    match: (filepath) => filepath.endsWith('.md') &&
                         (filepath.startsWith('docs/') ||
                          !filepath.includes('/'))
  }
];

// Directories to exclude entirely
export const EXCLUDE_DIRS = [
  'node_modules',
  'venv',
  '__pycache__',
  'dist',
  'build',
  '.git',
  'output',
  'certs',
  'uploads',
  '.next',
  'coverage',
  'DiffBIR'  // External library cloned locally
];

// Files to exclude
export const EXCLUDE_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
];

// Extensions to exclude (binary/media files)
export const EXCLUDE_EXTENSIONS = [
  '.zip', '.tar', '.gz',
  '.mp4', '.mp3', '.wav', '.m4a',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.pem', '.key', '.crt',
  '.woff', '.woff2', '.ttf', '.eot',
  '.pdf', '.doc', '.docx'
];

/**
 * Determine which category a file belongs to
 * @param {string} filepath - Relative path from repo root
 * @returns {string|null} Category name or null if uncategorized
 */
export function categorizeFile(filepath) {
  // Normalize path separators
  const normalizedPath = filepath.replace(/\\/g, '/');

  // Check each category in priority order
  for (const category of CATEGORIES) {
    if (category.match(normalizedPath)) {
      return category.name;
    }
  }

  return null;
}

/**
 * Check if a file should be excluded from analysis
 * @param {string} filepath - Relative path from repo root
 * @returns {boolean} True if file should be excluded
 */
export function shouldExclude(filepath) {
  const normalizedPath = filepath.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop();

  // Check excluded directories
  for (const dir of EXCLUDE_DIRS) {
    if (normalizedPath.includes(`/${dir}/`) || normalizedPath.startsWith(`${dir}/`)) {
      return true;
    }
  }

  // Check excluded files
  if (EXCLUDE_FILES.includes(filename)) {
    return true;
  }

  // Check excluded extensions
  for (const ext of EXCLUDE_EXTENSIONS) {
    if (normalizedPath.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Get all category names
 * @returns {string[]} Array of category names
 */
export function getCategoryNames() {
  return CATEGORIES.map(c => c.name);
}

/**
 * Create an empty counts object with all categories set to 0
 * @returns {Object} Empty counts object
 */
export function createEmptyCounts() {
  const counts = {};
  for (const category of CATEGORIES) {
    counts[category.name] = 0;
  }
  return counts;
}
