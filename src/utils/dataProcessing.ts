import type { SnapshotsData, DaySnapshot, PeriodView, TimeSeriesPoint, GrowthPoint, CategoryStat, ComparisonResult } from '../types'
import { CATEGORY_KEYS } from '../constants/categories'

function getAllDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function fillMissingDays(daysData: Record<string, DaySnapshot>): Record<string, DaySnapshot> {
  const existingDays = Object.keys(daysData).sort()
  if (existingDays.length === 0) return daysData

  const firstDate = existingDays[0]
  const lastDate = existingDays[existingDays.length - 1]
  const allDates = getAllDatesBetween(firstDate, lastDate)

  const filledData: Record<string, DaySnapshot> = {}
  let lastKnownData: DaySnapshot | null = null

  for (const date of allDates) {
    if (daysData[date]) {
      filledData[date] = daysData[date]
      lastKnownData = daysData[date]
    } else if (lastKnownData) {
      filledData[date] = { ...lastKnownData }
    }
  }

  return filledData
}

export function formatNumber(num: number): string {
  return num.toLocaleString()
}

function sumTotals(day: DaySnapshot): number {
  return Object.values(day.totals).reduce((a, b) => a + b, 0)
}

function sumFiles(day: DaySnapshot): number {
  return Object.values(day.fileCount).reduce((a, b) => a + b, 0)
}

export function getLatestStats(data: SnapshotsData) {
  const days = Object.keys(data.days)
  if (days.length === 0) return null

  const latestDay = data.days[days[days.length - 1]]
  const firstDay = data.days[days[0]]

  const totalLines = sumTotals(latestDay)
  const totalFiles = sumFiles(latestDay)
  const firstDayLines = sumTotals(firstDay)
  const avgGrowth = Math.round((totalLines - firstDayLines) / days.length)

  return { totalLines, totalFiles, daysTracked: days.length, avgGrowth }
}

export function aggregateTimeSeries(data: SnapshotsData, view: PeriodView): TimeSeriesPoint[] {
  const days = Object.keys(data.days)

  if (view === 'daily') {
    return days.map(day => {
      const point: TimeSeriesPoint = { date: day }
      for (const cat of CATEGORY_KEYS) {
        point[cat] = data.days[day].totals[cat] || 0
      }
      return point
    })
  }

  const result: TimeSeriesPoint[] = []

  if (view === 'weekly') {
    let weekStart: string | null = null
    let lastDayInWeek: string | null = null

    for (let i = 0; i < days.length; i++) {
      const dayOfWeek = new Date(days[i]).getDay()

      if (weekStart === null) {
        weekStart = days[i]
      }
      lastDayInWeek = days[i]

      if (dayOfWeek === 0 || i === days.length - 1) {
        const point: TimeSeriesPoint = { date: weekStart }
        for (const cat of CATEGORY_KEYS) {
          point[cat] = data.days[lastDayInWeek].totals[cat] || 0
        }
        result.push(point)
        weekStart = null
      }
    }
  } else {
    // monthly
    let currentMonth: string | null = null
    let monthLabel: string | null = null
    let lastDayInMonth: string | null = null

    for (let i = 0; i < days.length; i++) {
      const date = new Date(days[i])
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (currentMonth === null) {
        currentMonth = monthKey
        monthLabel = days[i]
      }
      lastDayInMonth = days[i]

      const nextDate = i < days.length - 1 ? new Date(days[i + 1]) : null
      const nextMonthKey = nextDate ? `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}` : null

      if (nextMonthKey !== currentMonth || i === days.length - 1) {
        const point: TimeSeriesPoint = { date: monthLabel! }
        for (const cat of CATEGORY_KEYS) {
          point[cat] = data.days[lastDayInMonth!].totals[cat] || 0
        }
        result.push(point)
        currentMonth = nextMonthKey
        monthLabel = i < days.length - 1 ? days[i + 1] : null
      }
    }
  }

  return result
}

export function calculateGrowth(data: SnapshotsData, view: PeriodView): GrowthPoint[] {
  const days = Object.keys(data.days)
  const result: GrowthPoint[] = []

  if (view === 'daily') {
    for (let i = 1; i < days.length; i++) {
      const prevTotal = sumTotals(data.days[days[i - 1]])
      const currTotal = sumTotals(data.days[days[i]])
      result.push({ date: days[i], delta: currTotal - prevTotal })
    }
  } else if (view === 'weekly') {
    let weekStart: string | null = null
    let prevTotal = sumTotals(data.days[days[0]])

    for (let i = 1; i < days.length; i++) {
      const dayOfWeek = new Date(days[i]).getDay()
      const currTotal = sumTotals(data.days[days[i]])

      if (weekStart === null) {
        weekStart = days[i]
      }

      if (dayOfWeek === 0 || i === days.length - 1) {
        result.push({ date: weekStart, delta: currTotal - prevTotal })
        weekStart = null
        prevTotal = currTotal
      }
    }
  } else {
    // monthly
    let currentMonth: string | null = null
    let monthLabel: string | null = null
    let prevTotal = sumTotals(data.days[days[0]])

    for (let i = 1; i < days.length; i++) {
      const date = new Date(days[i])
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const currTotal = sumTotals(data.days[days[i]])

      if (currentMonth === null) {
        currentMonth = monthKey
        monthLabel = days[i]
      }

      if (monthKey !== currentMonth || i === days.length - 1) {
        result.push({ date: monthLabel!, delta: currTotal - prevTotal })
        currentMonth = monthKey
        monthLabel = days[i]
        prevTotal = currTotal
      }
    }
  }

  return result
}

export function getCategoryDetails(data: SnapshotsData): CategoryStat[] {
  const days = Object.keys(data.days)
  if (days.length === 0) return []

  const latestDay = data.days[days[days.length - 1]]
  const totalLines = sumTotals(latestDay)

  return CATEGORY_KEYS
    .map(category => {
      const lines = latestDay.totals[category] || 0
      const files = latestDay.fileCount[category] || 0
      return {
        category,
        lines,
        files,
        avgPerFile: files > 0 ? Math.round(lines / files) : 0,
        percent: totalLines > 0 ? parseFloat(((lines / totalLines) * 100).toFixed(1)) : 0
      }
    })
    .sort((a, b) => b.lines - a.lines)
}

export function compareDates(data: SnapshotsData, fromDate: string, toDate: string): ComparisonResult[] | null {
  if (!data.days[fromDate] || !data.days[toDate]) return null

  const fromDay = data.days[fromDate]
  const toDay = data.days[toDate]

  return CATEGORY_KEYS.map(category => ({
    category,
    fromLines: fromDay.totals[category] || 0,
    toLines: toDay.totals[category] || 0,
    delta: (toDay.totals[category] || 0) - (fromDay.totals[category] || 0)
  }))
}

export function getAvailableDates(data: SnapshotsData): string[] {
  return Object.keys(data.days)
}
