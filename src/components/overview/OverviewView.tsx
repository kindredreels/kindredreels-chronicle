import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ResponsiveContainer
} from 'recharts'
import type { SnapshotsData } from '../../types'
import type { ChronicleDataWithLookup } from '../../hooks/useChronicleData'
import { getLatestStats, formatNumber } from '../../utils/dataProcessing'
import { getPhaseCodeStats, formatDateRange } from '../../utils/chronicleProcessing'
import Card from '../shared/Card'

interface OverviewViewProps {
  data: SnapshotsData
  chronicleData: ChronicleDataWithLookup
}

function formatLines(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

function snapToDataDate(target: string, dates: string[]): string | undefined {
  let best: string | undefined
  for (const d of dates) {
    if (d <= target) best = d
    else break
  }
  return best ?? dates[0]
}

export default function OverviewView({ data, chronicleData }: OverviewViewProps) {
  const stats = getLatestStats(data)
  const { metadata, phases, entries, codeStats } = chronicleData

  // Compute days building
  const startDate = new Date(metadata.dateRange.start + 'T00:00:00')
  const endDate = new Date(metadata.dateRange.end + 'T00:00:00')
  const daysBuilding = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1

  // Count major milestones
  const majorMilestones = entries.filter(e => e.significance === 'major').length

  // Growth chart data — full timeline
  const allStatDates = Object.keys(codeStats).sort()
  const chartData = allStatDates.length > 0
    ? getPhaseCodeStats(codeStats, allStatDates[0], allStatDates[allStatDates.length - 1])
    : []

  const heroStats = [
    { label: 'Total Lines', value: stats ? formatNumber(stats.totalLines) : '—', color: 'text-blue-400' },
    { label: 'Total PRs', value: formatNumber(metadata.totalEntries), color: 'text-emerald-400' },
    { label: 'Chapters', value: String(phases.length), color: 'text-amber-400' },
    { label: 'Days Building', value: formatNumber(daysBuilding), color: 'text-violet-400' },
    { label: 'Major Milestones', value: String(majorMilestones), color: 'text-rose-400' },
    { label: 'Avg Lines/Day', value: stats ? formatNumber(stats.avgGrowth) : '—', color: 'text-cyan-400' },
  ]

  const chartDates = chartData.map(p => p.date)

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {heroStats.map(stat => (
          <Card key={stat.label}>
            <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Codebase Growth Chart */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">Codebase Growth</h2>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="overviewAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              {phases.map(phase => {
                const x1 = snapToDataDate(phase.dateRange.start, chartDates)
                const x2 = snapToDataDate(phase.dateRange.end, chartDates)
                if (!x1 || !x2) return null
                return (
                  <ReferenceArea
                    key={phase.id}
                    x1={x1}
                    x2={x2}
                    fill={phase.color}
                    fillOpacity={0.07}
                    stroke={phase.color}
                    strokeOpacity={0.25}
                    strokeWidth={1}
                  />
                )
              })}
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(d: string) => {
                  const parts = d.split('-')
                  return `${parts[1]}/${parts[2]}`
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(v: number) => formatLines(v)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: number) => [formatNumber(value) + ' lines', 'Total']}
              />
              <Area
                type="monotone"
                dataKey="totalLines"
                fill="url(#overviewAreaGradient)"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chapters at a Glance */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">The Story So Far</h2>
        <div className="space-y-3">
          {phases.map(phase => (
            <div
              key={phase.id}
              className="border-l-4 pl-3 sm:pl-4 py-1"
              style={{ borderColor: phase.color }}
            >
              <div className="font-semibold text-sm sm:text-base">{phase.title}</div>
              <div className="text-gray-400 text-sm">{phase.subtitle}</div>
              <div className="text-gray-500 text-xs mt-1">
                {formatDateRange(phase.dateRange.start, phase.dateRange.end)} · {phase.entryIds.length} entries
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
