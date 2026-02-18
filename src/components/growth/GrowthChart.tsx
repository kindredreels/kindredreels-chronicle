import {
  ComposedChart, Area, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Brush, ReferenceArea, ResponsiveContainer
} from 'recharts'
import type { GrowthChartPoint, ChroniclePhase } from '../../types'
import GrowthTooltip from './GrowthTooltip'
import Card from '../shared/Card'

interface GrowthChartProps {
  data: GrowthChartPoint[]
  phases: ChroniclePhase[]
  onBrushChange: (startIndex: number, endIndex: number) => void
  onMarkerClick: (entryId: string) => void
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

export default function GrowthChart({ data, phases, onBrushChange, onMarkerClick }: GrowthChartProps) {
  const dates = data.map(p => p.date)

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-2">Codebase Growth</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-gray-400">
        <span>Chapters:</span>
        {phases.map(phase => (
          <span key={phase.id} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: phase.color, opacity: 0.5 }}
            />
            {phase.title}
          </span>
        ))}
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

            {phases.map(phase => {
              const x1 = snapToDataDate(phase.dateRange.start, dates)
              const x2 = snapToDataDate(phase.dateRange.end, dates)
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
                  label={{
                    value: phase.title,
                    position: 'insideTop',
                    fill: phase.color,
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: 0.7,
                  }}
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
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(v: number) => formatLines(v)}
            />
            <Tooltip content={<GrowthTooltip />} />

            <Area
              type="monotone"
              dataKey="totalLines"
              fill="url(#areaGradient)"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />

            <Scatter
              dataKey="markerLines"
              fill="#F59E0B"
              stroke="#92400E"
              strokeWidth={1}
              cursor="pointer"
              onClick={(_data: unknown, _index: number, e: React.MouseEvent) => {
                // Recharts Scatter onClick gives (data, index, event)
                // but data typing is unreliable — extract from chart data
                const target = e?.currentTarget as SVGElement | undefined
                const idx = target?.getAttribute?.('data-index')
                if (idx != null) {
                  const point = data[Number(idx)]
                  if (point?.entryId) onMarkerClick(point.entryId)
                }
              }}
              shape={(props: unknown) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: GrowthChartPoint }
                if (payload.markerLines == null) return <></>
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#F59E0B"
                    stroke="#92400E"
                    strokeWidth={1}
                    cursor="pointer"
                    onClick={() => {
                      if (payload.entryId) onMarkerClick(payload.entryId)
                    }}
                  />
                )
              }}
            />

            <Brush
              dataKey="date"
              height={30}
              stroke="#4B5563"
              fill="#1F2937"
              tickFormatter={(d: string) => {
                const parts = d.split('-')
                return `${parts[1]}/${parts[2]}`
              }}
              onChange={(range) => {
                if (range && typeof range.startIndex === 'number' && typeof range.endIndex === 'number') {
                  onBrushChange(range.startIndex, range.endIndex)
                }
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
