import type { ChroniclePhase, ChronicleEntry } from '../../types'
import { formatDateRange, getChapterContext, getPhaseCodeStats, getPhaseEntries } from '../../utils/chronicleProcessing'
import type { ChronicleDataWithLookup } from '../../hooks/useChronicleData'
import PhaseCodeChart from './PhaseCodeChart'
import TimelineEntryCard from '../timeline/TimelineEntryCard'
import { isSadieEntry, SADIE_COLOR } from '../../utils/people'

interface ChapterContentProps {
  phase: ChroniclePhase
  data: ChronicleDataWithLookup
  expandedEntryId: string | null
  onToggleEntry: (id: string) => void
}

export default function ChapterContent({ phase, data, expandedEntryId, onToggleEntry }: ChapterContentProps) {
  const entries: ChronicleEntry[] = getPhaseEntries(phase, data.entriesById)
  const chartData = getPhaseCodeStats(data.codeStats, phase.dateRange.start, phase.dateRange.end)
  const { act, chapterNumber } = getChapterContext(phase.id, data.phases, data.story)
  const sadieEntries = entries.filter(isSadieEntry)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          {act ? `Act ${act.numeral} · ${act.title} · ` : ''}Chapter {chapterNumber}
        </div>
        <h2 className="text-2xl font-bold" style={{ color: phase.color }}>{phase.title}</h2>
        <p className="text-gray-400 mt-1">{phase.subtitle}</p>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateRange(phase.dateRange.start, phase.dateRange.end)} &middot; {entries.length} entries
        </p>
      </div>

      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
        {phase.narrative}
      </div>

      {(phase.sadieNote || sadieEntries.length > 0) && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: `${SADIE_COLOR}55`, backgroundColor: `${SADIE_COLOR}0D` }}
        >
          <h3 className="text-sm font-semibold" style={{ color: SADIE_COLOR }}>Sadie in this chapter</h3>
          {phase.sadieNote && <p className="text-gray-300 text-sm leading-relaxed">{phase.sadieNote}</p>}
          {sadieEntries.length > 0 && (
            <ul className="space-y-1.5">
              {sadieEntries.map(e => (
                <li key={e.id} className="text-sm text-gray-400">
                  <span className="text-gray-500 mr-2">
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {e.summary}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
