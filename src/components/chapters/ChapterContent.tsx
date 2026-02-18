import type { ChroniclePhase, ChronicleEntry } from '../../types'
import { formatDateRange, getPhaseCodeStats, getPhaseEntries } from '../../utils/chronicleProcessing'
import type { ChronicleDataWithLookup } from '../../hooks/useChronicleData'
import PhaseCodeChart from './PhaseCodeChart'
import TimelineEntryCard from '../timeline/TimelineEntryCard'

interface ChapterContentProps {
  phase: ChroniclePhase
  data: ChronicleDataWithLookup
  expandedEntryId: string | null
  onToggleEntry: (id: string) => void
}

export default function ChapterContent({ phase, data, expandedEntryId, onToggleEntry }: ChapterContentProps) {
  const entries: ChronicleEntry[] = getPhaseEntries(phase, data.entriesById)
  const chartData = getPhaseCodeStats(data.codeStats, phase.dateRange.start, phase.dateRange.end)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: phase.color }}>{phase.title}</h2>
        <p className="text-gray-400 mt-1">{phase.subtitle}</p>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateRange(phase.dateRange.start, phase.dateRange.end)} &middot; {entries.length} entries
        </p>
      </div>

      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
        {phase.narrative}
      </div>

      {chartData.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Code Growth During Phase</h3>
          <PhaseCodeChart data={chartData} color={phase.color} />
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Entries ({entries.length})</h3>
        <div className="space-y-2">
          {entries.map(entry => (
            <TimelineEntryCard
              key={entry.id}
              entry={entry}
              compact={false}
              expanded={expandedEntryId === entry.id}
              onToggle={() => onToggleEntry(entry.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
