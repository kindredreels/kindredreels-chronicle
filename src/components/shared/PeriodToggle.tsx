import type { PeriodView } from '../../types'

interface PeriodToggleProps {
  value: PeriodView
  onChange: (view: PeriodView) => void
}

const OPTIONS: PeriodView[] = ['daily', 'weekly', 'monthly']
const LABELS: Record<PeriodView, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly'
}

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1 text-sm rounded transition ${
            value === option
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  )
}
