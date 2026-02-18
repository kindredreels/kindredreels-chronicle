import type { SnapshotsData } from '../../types'
import StatsCards from './StatsCards'
import TimeSeriesChart from './TimeSeriesChart'
import GrowthRateChart from './GrowthRateChart'
import CategoryDonut from './CategoryDonut'
import DateComparison from './DateComparison'
import CategoryTable from './CategoryTable'

interface CodeStatsViewProps {
  data: SnapshotsData
}

export default function CodeStatsView({ data }: CodeStatsViewProps) {
  return (
    <div className="space-y-8">
      <StatsCards data={data} />
      <TimeSeriesChart data={data} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthRateChart data={data} />
        <CategoryDonut data={data} />
      </div>
      <DateComparison data={data} />
      <CategoryTable data={data} />
    </div>
  )
}
