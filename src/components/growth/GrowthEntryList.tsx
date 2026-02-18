import { useRef, useEffect } from 'react'
import type { ChronicleEntry } from '../../types'
import { groupEntriesByMonth, formatMonthLabel } from '../../utils/chronicleProcessing'
import TimelineEntryCard from '../timeline/TimelineEntryCard'

interface GrowthEntryListProps {
  entries: ChronicleEntry[]
  selectedEntryId: string | null
  expandedEntryId: string | null
  onToggleEntry: (id: string) => void
}

export default function GrowthEntryList({ entries, selectedEntryId, expandedEntryId, onToggleEntry }: GrowthEntryListProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (selectedEntryId) {
      const el = cardRefs.current.get(selectedEntryId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedEntryId])

  const groups = groupEntriesByMonth(entries)

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No entries in the selected range.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([key, monthEntries]) => (
        <div key={key}>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            {formatMonthLabel(key)}
          </h3>
          <div className="space-y-2">
            {monthEntries.map(entry => (
              <div
                key={entry.id}
                ref={el => {
                  if (el) cardRefs.current.set(entry.id, el)
                  else cardRefs.current.delete(entry.id)
                }}
                className={selectedEntryId === entry.id ? 'ring-2 ring-amber-500/50 rounded-lg' : ''}
              >
                <TimelineEntryCard
                  entry={entry}
                  compact={false}
                  expanded={expandedEntryId === entry.id}
                  onToggle={() => onToggleEntry(entry.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
