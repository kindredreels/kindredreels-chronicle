import { useState, useMemo } from 'react'
import type { ChronicleDataWithLookup } from '../../hooks/useChronicleData'
import { buildGrowthChartData, filterEntriesByDateRange } from '../../utils/chronicleProcessing'
import GrowthChart from './GrowthChart'
import GrowthEntryList from './GrowthEntryList'

interface GrowthViewProps {
  data: ChronicleDataWithLookup
}

export default function GrowthView({ data }: GrowthViewProps) {
  const [dateRange, setDateRange] = useState<[number, number] | null>(null)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  const chartData = useMemo(
    () => buildGrowthChartData(data.codeStats, data.entries),
    [data.codeStats, data.entries]
  )

  const visibleEntries = useMemo(() => {
    if (!dateRange) return data.entries
    const startDate = chartData[dateRange[0]]?.date
    const endDate = chartData[dateRange[1]]?.date
    if (!startDate || !endDate) return data.entries
    return filterEntriesByDateRange(data.entries, startDate, endDate)
  }, [data.entries, chartData, dateRange])

  const handleBrushChange = (startIndex: number, endIndex: number) => {
    setDateRange([startIndex, endIndex])
  }

  const handleMarkerClick = (entryId: string) => {
    setSelectedEntryId(entryId)
    setExpandedEntryId(entryId)
  }

  const toggleEntry = (id: string) => {
    setExpandedEntryId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <GrowthChart
        data={chartData}
        phases={data.phases}
        onBrushChange={handleBrushChange}
        onMarkerClick={handleMarkerClick}
      />
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Entries {dateRange ? `(${visibleEntries.length} in range)` : `(${visibleEntries.length} total)`}
        </h3>
        <GrowthEntryList
          entries={visibleEntries}
          selectedEntryId={selectedEntryId}
          expandedEntryId={expandedEntryId}
          onToggleEntry={toggleEntry}
        />
      </div>
    </div>
  )
}
