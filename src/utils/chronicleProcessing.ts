import type { ChronicleEntry, ChroniclePhase, EntryCategory, EntrySignificance, CodeStatDay, GrowthChartPoint } from '../types'

export function groupEntriesByMonth(entries: ChronicleEntry[]): Map<string, ChronicleEntry[]> {
  const groups = new Map<string, ChronicleEntry[]>()
  for (const entry of entries) {
    const key = entry.date.slice(0, 7) // "YYYY-MM"
    const group = groups.get(key)
    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }
  return groups
}

export function groupEntriesByWeek(entries: ChronicleEntry[]): Map<string, ChronicleEntry[]> {
  const groups = new Map<string, ChronicleEntry[]>()
  for (const entry of entries) {
    const d = new Date(entry.date + 'T00:00:00')
    const year = d.getFullYear()
    const jan1 = new Date(year, 0, 1)
    const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
    const week = Math.ceil((days + jan1.getDay() + 1) / 7)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const group = groups.get(key)
    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }
  return groups
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
}

export function formatWeekLabel(key: string): string {
  const [year, weekPart] = key.split('-W')
  return `Week ${parseInt(weekPart, 10)}, ${year}`
}

interface FilterOptions {
  categories?: Set<EntryCategory>
  minSignificance?: EntrySignificance
  searchText?: string
}

const SIGNIFICANCE_ORDER: Record<EntrySignificance, number> = {
  major: 3,
  moderate: 2,
  minor: 1
}

export function filterEntries(entries: ChronicleEntry[], options: FilterOptions): ChronicleEntry[] {
  let filtered = entries

  if (options.categories && options.categories.size > 0) {
    filtered = filtered.filter(e => options.categories!.has(e.category))
  }

  if (options.minSignificance) {
    const minLevel = SIGNIFICANCE_ORDER[options.minSignificance]
    filtered = filtered.filter(e => SIGNIFICANCE_ORDER[e.significance] >= minLevel)
  }

  if (options.searchText) {
    const lower = options.searchText.toLowerCase()
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(lower) ||
      e.summary.toLowerCase().includes(lower) ||
      e.tags.some(t => t.toLowerCase().includes(lower))
    )
  }

  return filtered
}

export function getGroupStats(entries: ChronicleEntry[]): {
  count: number
  additions: number
  deletions: number
  categories: Set<EntryCategory>
} {
  let additions = 0
  let deletions = 0
  const categories = new Set<EntryCategory>()
  for (const e of entries) {
    additions += e.stats.additions
    deletions += e.stats.deletions
    categories.add(e.category)
  }
  return { count: entries.length, additions, deletions, categories }
}

export function getPhaseCodeStats(
  codeStats: Record<string, CodeStatDay>,
  start: string,
  end: string
): { date: string; totalLines: number }[] {
  const result: { date: string; totalLines: number }[] = []
  const dates = Object.keys(codeStats).sort()
  for (const date of dates) {
    if (date >= start && date <= end) {
      result.push({ date, totalLines: codeStats[date].totalLines })
    }
  }
  return result
}

export function getPhaseEntries(
  phase: ChroniclePhase,
  entriesById: Record<string, ChronicleEntry>
): ChronicleEntry[] {
  return phase.entryIds
    .map(id => entriesById[id])
    .filter((e): e is ChronicleEntry => e != null)
}

export function buildGrowthChartData(
  codeStats: Record<string, CodeStatDay>,
  entries: ChronicleEntry[]
): GrowthChartPoint[] {
  const statDates = Object.keys(codeStats).sort()
  const majorEntries = entries.filter(e => e.significance === 'major')

  // Build base points from codeStats
  const points: GrowthChartPoint[] = statDates.map(date => ({
    date,
    totalLines: codeStats[date].totalLines
  }))

  // For each major entry, find nearest codeStats date <= entry.date and attach
  const usedDates = new Set<string>()
  for (const entry of majorEntries) {
    let bestDate: string | null = null
    for (const sd of statDates) {
      if (sd <= entry.date) bestDate = sd
      else break
    }
    if (bestDate && !usedDates.has(bestDate)) {
      usedDates.add(bestDate)
      const point = points.find(p => p.date === bestDate)
      if (point) {
        point.markerLines = point.totalLines
        point.entryId = entry.id
        point.entryTitle = entry.title
        point.entrySummary = entry.summary
        point.entryCategory = entry.category
      }
    }
  }

  return points
}

export function filterEntriesByDateRange(
  entries: ChronicleEntry[],
  start: string,
  end: string
): ChronicleEntry[] {
  return entries.filter(e => e.date >= start && e.date <= end)
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sMonth = MONTH_NAMES[s.getMonth()]
  const eMonth = MONTH_NAMES[e.getMonth()]
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${sMonth} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${s.getFullYear()}`
  }
  return `${sMonth} ${s.getDate()}, ${s.getFullYear()} – ${eMonth} ${e.getDate()}, ${e.getFullYear()}`
}
