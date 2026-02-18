import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { SnapshotsData, PeriodView } from '../../types'
import { aggregateTimeSeries, formatNumber } from '../../utils/dataProcessing'
import { COLORS, CATEGORY_NAMES, CATEGORY_KEYS } from '../../constants/categories'
import Card from '../shared/Card'
import PeriodToggle from '../shared/PeriodToggle'

interface TimeSeriesChartProps {
  data: SnapshotsData
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const [view, setView] = useState<PeriodView>('daily')
  const chartData = useMemo(() => aggregateTimeSeries(data, view), [data, view])

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Lines of Code Over Time</h2>
        <PeriodToggle value={view} onChange={setView} />
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#E5E7EB' }}
              formatter={(value: number, name: string) => [formatNumber(value) + ' lines', name]}
            />
            <Legend wrapperStyle={{ color: '#E5E7EB' }} />
            {CATEGORY_KEYS.map(cat => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                name={CATEGORY_NAMES[cat]}
                stackId="1"
                fill={COLORS[cat] + '60'}
                stroke={COLORS[cat]}
                strokeWidth={1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
