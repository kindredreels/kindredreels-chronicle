import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { SnapshotsData } from '../../types'
import { formatNumber } from '../../utils/dataProcessing'
import { COLORS, CATEGORY_NAMES, CATEGORY_KEYS } from '../../constants/categories'
import Card from '../shared/Card'

interface CategoryDonutProps {
  data: SnapshotsData
}

export default function CategoryDonut({ data }: CategoryDonutProps) {
  const chartData = useMemo(() => {
    const days = Object.keys(data.days)
    if (days.length === 0) return []

    const latestDay = data.days[days[days.length - 1]]
    return CATEGORY_KEYS.map(cat => ({
      name: CATEGORY_NAMES[cat],
      value: latestDay.totals[cat] || 0,
      color: COLORS[cat]
    }))
  }, [data])

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              dataKey="value"
              stroke="#1F2937"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              formatter={(value: number, name: string) => [formatNumber(value) + ' lines', name]}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ color: '#E5E7EB', fontSize: '13px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
