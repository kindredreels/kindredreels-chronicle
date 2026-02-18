import type { EntryCategory, EntrySignificance } from '../types'

export const ENTRY_COLORS: Record<EntryCategory, string> = {
  frontend: '#3B82F6',
  backend: '#10B981',
  processing: '#8B5CF6',
  ai: '#F59E0B',
  infrastructure: '#06B6D4',
  design: '#EC4899',
  docs: '#6366F1',
  devops: '#14B8A6'
}

export const ENTRY_CATEGORY_NAMES: Record<EntryCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  processing: 'Processing',
  ai: 'AI',
  infrastructure: 'Infrastructure',
  design: 'Design',
  docs: 'Docs',
  devops: 'DevOps'
}

export const ENTRY_CATEGORY_KEYS: EntryCategory[] = Object.keys(ENTRY_COLORS) as EntryCategory[]

export const SIGNIFICANCE_CONFIG: Record<EntrySignificance, { size: number; label: string }> = {
  major: { size: 12, label: 'Major' },
  moderate: { size: 8, label: 'Moderate' },
  minor: { size: 6, label: 'Minor' }
}
