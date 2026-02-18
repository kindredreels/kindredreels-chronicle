import type { GrowthChartPoint } from '../../types'
import CategoryBadge from '../shared/CategoryBadge'

interface GrowthTooltipProps {
  active?: boolean
  payload?: { payload: GrowthChartPoint }[]
  label?: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatLines(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export default function GrowthTooltip({ active, payload }: GrowthTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0].payload

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
      <div className="text-gray-400 mb-1">{formatDate(point.date)}</div>
      <div className="text-white font-medium">{formatLines(point.totalLines)} lines</div>
      {point.entryId && (
        <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
          <div className="flex items-center gap-2">
            {point.entryCategory && <CategoryBadge category={point.entryCategory} />}
          </div>
          <div className="text-white font-medium text-xs">{point.entryTitle}</div>
          <div className="text-gray-400 text-xs line-clamp-2">{point.entrySummary}</div>
        </div>
      )}
    </div>
  )
}
