import { useState } from 'react'
import type { ChronicleDataWithLookup } from '../../hooks/useChronicleData'
import ChapterSidebar from './ChapterSidebar'
import ChapterContent from './ChapterContent'

interface ChaptersViewProps {
  data: ChronicleDataWithLookup
}

export default function ChaptersView({ data }: ChaptersViewProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState(data.phases[0]?.id ?? '')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  const selectedPhase = data.phases.find(p => p.id === selectedPhaseId)

  const handlePhaseSelect = (id: string) => {
    setSelectedPhaseId(id)
    setExpandedEntryId(null)
  }

  const toggleEntry = (id: string) => {
    setExpandedEntryId(prev => prev === id ? null : id)
  }

  return (
    <div className="flex gap-6">
      <div className="w-70 shrink-0 hidden lg:block sticky top-4 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
        <ChapterSidebar
          phases={data.phases}
          selectedId={selectedPhaseId}
          onSelect={handlePhaseSelect}
        />
      </div>

      <div className="lg:hidden mb-4">
        <select
          value={selectedPhaseId}
          onChange={e => handlePhaseSelect(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          {data.phases.map(phase => (
            <option key={phase.id} value={phase.id}>
              {phase.title} — {phase.subtitle}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-0">
        {selectedPhase && (
          <ChapterContent
            phase={selectedPhase}
            data={data}
            expandedEntryId={expandedEntryId}
            onToggleEntry={toggleEntry}
          />
        )}
      </div>
    </div>
  )
}
