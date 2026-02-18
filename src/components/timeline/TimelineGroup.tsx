import { useState } from 'react'
import type { ChronicleEntry } from '../../types'
import { getGroupStats } from '../../utils/chronicleProcessing'
import TimelineEntryCard from './TimelineEntryCard'

interface TimelineGroupProps {
  label: string
  entries: ChronicleEntry[]
  compact: boolean
  expandedEntryId: string | null
  onToggleEntry: (id: string) => void
}

export default function TimelineGroup({ label, entries, compact, expandedEntryId, onToggleEntry }: TimelineGroupProps) {
  const [showMinor, setShowMinor] = useState(false)
  const stats = getGroupStats(entries)

  const majorModerate = compact
    ? entries.filter(e => e.significance !== 'minor')
    : entries
  const minorEntries = compact
    ? entries.filter(e => e.significance === 'minor')
    : []

  const visibleEntries = compact && !showMinor ? majorModerate : entries

  return (
    <div className="relative timeline-line">
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-200">{label}</h3>
        <span className="text-sm text-gray-500">
          {stats.count} entries &middot; +{stats.additions.toLocaleString()} lines
        </span>
      </div>

      <div className="space-y-2 ml-4">
        {visibleEntries.map(entry => (
          <TimelineEntryCard
            key={entry.id}
            entry={entry}
            compact={compact}
            expanded={expandedEntryId === entry.id}
            onToggle={() => onToggleEntry(entry.id)}
          />
        ))}

        {compact && minorEntries.length > 0 && !showMinor && (
          <button
            onClick={() => setShowMinor(true)}
            className="text-sm text-gray-500 hover:text-gray-400 transition pl-2"
          >
            +{minorEntries.length} other changes
          </button>
        )}

        {compact && showMinor && minorEntries.length > 0 && (
          <button
            onClick={() => setShowMinor(false)}
            className="text-sm text-gray-500 hover:text-gray-400 transition pl-2"
          >
            Hide minor changes
          </button>
        )}
      </div>
    </div>
  )
}
