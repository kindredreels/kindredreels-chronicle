import type { SnapshotsData } from '../../types'
import { getLatestStats, formatNumber } from '../../utils/dataProcessing'

interface StatsCardsProps {
  data: SnapshotsData
}

export default function StatsCards({ data }: StatsCardsProps) {
  const stats = getLatestStats(data)
  if (!stats) return null

  const cards = [
    { label: 'Total Lines', value: formatNumber(stats.totalLines), color: 'text-blue-400' },
    { label: 'Total Files', value: formatNumber(stats.totalFiles), color: 'text-emerald-400' },
    { label: 'Days Tracked', value: String(stats.daysTracked), color: 'text-amber-400' },
    { label: 'Avg Lines/Day', value: `+${formatNumber(stats.avgGrowth)}`, color: 'text-violet-400' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">{card.label}</div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
        </div>
      ))}
    </div>
  )
}
