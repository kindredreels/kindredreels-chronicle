import type { ChroniclePhase, ChronicleStory } from '../../types'
import { formatDateRange } from '../../utils/chronicleProcessing'

interface ChapterSidebarProps {
  phases: ChroniclePhase[]
  story?: ChronicleStory
  selectedId: string
  onSelect: (id: string) => void
}

// Chapters grouped under their act. Without a story file, one ungrouped list.
export default function ChapterSidebar({ phases, story, selectedId, onSelect }: ChapterSidebarProps) {
  const groups = story
    ? story.acts.map(act => ({
        key: act.id,
        label: `Act ${act.numeral} · ${act.title}`,
        phases: act.phaseIds.map(id => phases.find(p => p.id === id)).filter((p): p is ChroniclePhase => !!p),
      }))
    : [{ key: 'all', label: null as string | null, phases }]

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <div key={group.key} className="space-y-2">
          {group.label && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-1">{group.label}</div>
          )}
          {group.phases.map(phase => {
            const isSelected = phase.id === selectedId
            const number = phases.indexOf(phase) + 1
            return (
              <button
                key={phase.id}
                onClick={() => onSelect(phase.id)}
                className={`w-full text-left rounded-lg p-3 transition border-l-4 ${
                  isSelected
                    ? 'bg-gray-700 border-current'
                    : 'bg-gray-800/50 border-transparent hover:bg-gray-800'
                }`}
                style={{ borderLeftColor: isSelected ? phase.color : undefined }}
              >
                <div className="font-medium text-sm" style={{ color: isSelected ? phase.color : '#E5E7EB' }}>
                  <span className="text-gray-500 mr-1.5">{number}.</span>{phase.title}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{phase.subtitle}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDateRange(phase.dateRange.start, phase.dateRange.end)} &middot; {phase.entryIds.length} entries
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
