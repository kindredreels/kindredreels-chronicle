import type { EntryCategory } from '../../types'

interface StatsBarProps {
  count: number
  additions: number
  deletions: number
  categories: Set<EntryCategory>
}

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export default function StatsBar({ count, additions, deletions, categories }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
      <span>{count} {count === 1 ? 'entry' : 'entries'}</span>
      <span className="text-green-400">+{formatNum(additions)}</span>
      <span className="text-red-400">-{formatNum(deletions)}</span>
      <span>{categories.size} {categories.size === 1 ? 'category' : 'categories'}</span>
    </div>
  )
}
