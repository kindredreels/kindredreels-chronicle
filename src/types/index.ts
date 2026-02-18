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
