import type { ChroniclePhase } from '../../types'
import { formatDateRange } from '../../utils/chronicleProcessing'

interface ChapterSidebarProps {
  phases: ChroniclePhase[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function ChapterSidebar({ phases, selectedId, onSelect }: ChapterSidebarProps) {
  return (
    <div className="space-y-2">
      {phases.map(phase => {
        const isSelected = phase.id === selectedId
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
              {phase.title}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{phase.subtitle}</div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDateRange(phase.dateRange.start, phase.dateRange.end)} &middot; {phase.entryIds.length} entries
            </div>
          </button>
        )
      })}
    </div>
  )
}
