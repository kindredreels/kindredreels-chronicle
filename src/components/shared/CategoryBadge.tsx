import type { EntryCategory } from '../../types'
import { ENTRY_COLORS, ENTRY_CATEGORY_NAMES } from '../../constants/entryCategories'

interface CategoryBadgeProps {
  category: EntryCategory
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = ENTRY_COLORS[category]
  return (
    <span
      className="px-2 py-0.5 text-xs font-medium rounded-full"
      style={{ backgroundColor: color + '33', color }}
    >
      {ENTRY_CATEGORY_NAMES[category]}
    </span>
  )
}
