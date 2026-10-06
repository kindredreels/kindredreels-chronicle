import type { ChronicleEntry } from '../../types'
import CategoryBadge from '../shared/CategoryBadge'
import SignificanceDot from '../shared/SignificanceDot'
import EntryDetail from '../shared/EntryDetail'
import SadieBadge from '../shared/SadieBadge'
import { isSadieEntry, SADIE_COLOR } from '../../utils/people'

interface TimelineEntryCardProps {
  entry: ChronicleEntry
  compact: boolean
  expanded: boolean
  onToggle: () => void
}

export default function TimelineEntryCard({ entry, compact, expanded, onToggle }: TimelineEntryCardProps) {
  const sadie = isSadieEntry(entry)
  return (
    <div
      className={`border border-gray-700 rounded-lg transition ${
        expanded ? 'bg-gray-800 border-gray-600' : 'bg-gray-800/50 hover:bg-gray-800'
      }`}
      style={sadie ? { borderLeft: `3px solid ${SADIE_COLOR}` } : undefined}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <SignificanceDot significance={entry.significance} />
        <CategoryBadge category={entry.category} />
        <span className={`font-medium text-sm flex-1 ${expanded ? 'text-white' : 'text-gray-200'}`}>
          {entry.title}
        </span>
        {sadie && <SadieBadge />}
        {compact && (
          <span className="text-xs text-gray-500 shrink-0">
            +{entry.stats.additions.toLocaleString()}
          </span>
        )}
      </button>

      {!compact && !expanded && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-400 line-clamp-2">{entry.summary}</p>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 entry-expand">
          <EntryDetail entry={entry} />
        </div>
      )}
    </div>
  )
}
