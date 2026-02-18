import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PhaseCodeChartProps {
  data: { date: string; totalLines: number }[]
  color: string
}

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export default function PhaseCodeChart({ data, color }: PhaseCodeChartProps) {
  if (data.length === 0) return null

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(v: number) => formatNum(v)}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#E5E7EB' }}
            formatter={(value: number) => [formatNum(value) + ' lines', 'Total']}
          />
          <Line
            type="monotone"
            dataKey="totalLines"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
