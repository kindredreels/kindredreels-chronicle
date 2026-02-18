import { useRef, useCallback } from 'react'
import type { EntryCategory, EntrySignificance } from '../../types'
import { ENTRY_COLORS, ENTRY_CATEGORY_NAMES, ENTRY_CATEGORY_KEYS } from '../../constants/entryCategories'

interface TimelineFilterBarProps {
  activeCategories: Set<EntryCategory>
  onCategoriesChange: (categories: Set<EntryCategory>) => void
  significance: EntrySignificance | null
  onSignificanceChange: (sig: EntrySignificance | null) => void
  onSearchChange: (text: string) => void
}

const SIG_OPTIONS: (EntrySignificance | null)[] = [null, 'major', 'moderate']
const SIG_LABELS: Record<string, string> = {
  null: 'All',
  major: 'Major',
  moderate: 'Major+Mod'
}

export default function TimelineFilterBar({
  activeCategories,
  onCategoriesChange,
  significance,
  onSignificanceChange,
  onSearchChange
}: TimelineFilterBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearchChange(value), 300)
  }, [onSearchChange])

  const toggleCategory = (cat: EntryCategory) => {
    const next = new Set(activeCategories)
    if (next.has(cat)) {
      next.delete(cat)
    } else {
      next.add(cat)
    }
    onCategoriesChange(next)
  }

  const clearCategories = () => {
    onCategoriesChange(new Set())
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={clearCategories}
          className={`px-3 py-1 text-sm rounded transition ${
            activeCategories.size === 0
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {ENTRY_CATEGORY_KEYS.map(cat => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className="px-3 py-1 text-sm rounded transition"
            style={{
              backgroundColor: activeCategories.has(cat) ? ENTRY_COLORS[cat] + '40' : '#374151',
              color: activeCategories.has(cat) ? ENTRY_COLORS[cat] : '#9CA3AF'
            }}
          >
            {ENTRY_CATEGORY_NAMES[cat]}
          </button>
        ))}
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          {SIG_OPTIONS.map(opt => (
            <button
              key={String(opt)}
              onClick={() => onSignificanceChange(opt)}
              className={`px-3 py-1 text-sm rounded transition ${
                significance === opt
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {SIG_LABELS[String(opt)]}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search entries..."
          onChange={handleSearch}
          className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-full sm:w-48"
        />
      </div>
    </div>
  )
}
