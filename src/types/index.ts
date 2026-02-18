export interface DaySnapshot {
  commit: string
  totals: Record<string, number>
  fileCount: Record<string, number>
}

export interface SnapshotsData {
  schemaVersion: number
  generatedAt: string
  repoStartDate: string
  days: Record<string, DaySnapshot>
}

export type PeriodView = 'daily' | 'weekly' | 'monthly'

export interface TimeSeriesPoint {
  date: string
  [category: string]: string | number
}

export interface GrowthPoint {
  date: string
  delta: number
}

export interface CategoryStat {
  category: string
  lines: number
  files: number
  avgPerFile: number
  percent: number
}

export interface ComparisonResult {
  category: string
  fromLines: number
  toLines: number
  delta: number
}

// Chronicle types

export type EntryCategory =
  | 'frontend'
  | 'backend'
  | 'processing'
  | 'infrastructure'
  | 'ai'
  | 'design'
  | 'docs'
  | 'devops'

export type EntrySignificance = 'major' | 'moderate' | 'minor'

export interface ChronicleEntry {
  id: string
  prNumber: number | null
  date: string
  mergedAt: string
  title: string
  branch: string
  summary: string
  detail: string
  category: EntryCategory
  tags: string[]
  significance: EntrySignificance
  stats: {
    additions: number
    deletions: number
    changedFiles: number
  }
  filesChanged: {
    path: string
    additions: number
    deletions: number
  }[]
  commitMessages: string[]
}

export interface ChroniclePhase {
  id: string
  title: string
  subtitle: string
  dateRange: {
    start: string
    end: string
  }
  narrative: string
  entryIds: string[]
  color: string
}

export interface CodeStatDay {
  totalLines: number
  totalFiles: number
  byCategory: Record<string, { lines: number; files: number }>
}

export interface GrowthChartPoint {
  date: string
  totalLines: number
  markerLines?: number
  entryId?: string
  entryTitle?: string
  entrySummary?: string
  entryCategory?: EntryCategory
}

export interface ChronicleData {
  entries: ChronicleEntry[]
  phases: ChroniclePhase[]
  codeStats: Record<string, CodeStatDay>
  metadata: {
    generatedAt: string
    totalEntries: number
    dateRange: {
      start: string
      end: string
    }
    repo: string
  }
}
