import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { SnapshotsData, PeriodView } from '../../types'
import { calculateGrowth, formatNumber } from '../../utils/dataProcessing'
import Card from '../shared/Card'
import PeriodToggle from '../shared/PeriodToggle'

interface GrowthRateChartProps {
  data: SnapshotsData
}

const LABEL: Record<PeriodView, string> = {
  daily: 'Lines added per day',
  weekly: 'Lines added per week',
  monthly: 'Lines added per month'
}

export default function GrowthRateChart({ data }: GrowthRateChartProps) {
  const [view, setView] = useState<PeriodView>('daily')
  const chartData = useMemo(() => calculateGrowth(data, view), [data, view])

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-xl font-semibold">Growth Rate</h2>
        <PeriodToggle value={view} onChange={setView} />
      </div>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(v: number) => (v >= 0 ? '+' : '') + formatNumber(v)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#E5E7EB' }}
              formatter={(value: number) => [(value >= 0 ? '+' : '') + formatNumber(value) + ' lines', LABEL[view]]}
            />
            <Bar dataKey="delta" name={LABEL[view]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.delta >= 0 ? '#34D39960' : '#F8717160'}
                  stroke={entry.delta >= 0 ? '#34D399' : '#F87171'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
