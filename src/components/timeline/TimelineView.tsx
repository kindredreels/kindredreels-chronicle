import { useState, useMemo } from 'react'
import type { EntryCategory, EntrySignificance } from '../../types'
import type { ChronicleDataWithLookup } from '../../hooks/useChronicleData'
import { filterEntries, groupEntriesByMonth, groupEntriesByWeek, formatMonthLabel, formatWeekLabel, getGroupStats } from '../../utils/chronicleProcessing'
import StatsBar from '../shared/StatsBar'
import TimelineFilterBar from './TimelineFilterBar'
import ZoomControls from './ZoomControls'
import type { ZoomLevel } from './ZoomControls'
import TimelineGroup from './TimelineGroup'

interface TimelineViewProps {
  data: ChronicleDataWithLookup
}

export default function TimelineView({ data }: TimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month')
  const [activeCategories, setActiveCategories] = useState<Set<EntryCategory>>(new Set())
  const [significance, setSignificance] = useState<EntrySignificance | null>(null)
  const [searchText, setSearchText] = useState('')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  const filtered = useMemo(() =>
    filterEntries(data.entries, {
      categories: activeCategories,
      minSignificance: significance ?? undefined,
      searchText: searchText || undefined
    }),
    [data.entries, activeCategories, significance, searchText]
  )

  const groups = useMemo(() => {
    if (zoomLevel === 'month') return groupEntriesByMonth(filtered)
    return groupEntriesByWeek(filtered)
  }, [filtered, zoomLevel])

  const formatLabel = zoomLevel === 'month' ? formatMonthLabel : formatWeekLabel
  const totalStats = useMemo(() => getGroupStats(filtered), [filtered])

  const toggleEntry = (id: string) => {
    setExpandedEntryId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <ZoomControls value={zoomLevel} onChange={setZoomLevel} />
      </div>

      <StatsBar
        count={totalStats.count}
        additions={totalStats.additions}
        deletions={totalStats.deletions}
        categories={totalStats.categories}
      />

      <TimelineFilterBar
        activeCategories={activeCategories}
        onCategoriesChange={setActiveCategories}
        significance={significance}
        onSignificanceChange={setSignificance}
        onSearchChange={setSearchText}
      />

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([key, entries]) => (
          <TimelineGroup
            key={key}
            label={formatLabel(key)}
            entries={entries}
            compact={zoomLevel === 'month'}
            expandedEntryId={expandedEntryId}
            onToggleEntry={toggleEntry}
          />
        ))}
      </div>

      {groups.size === 0 && (
        <div className="text-center py-12 text-gray-500">
          No entries match the current filters.
        </div>
      )}
    </div>
  )
}
