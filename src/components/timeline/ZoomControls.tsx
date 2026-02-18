export type ZoomLevel = 'month' | 'week'

interface ZoomControlsProps {
  value: ZoomLevel
  onChange: (level: ZoomLevel) => void
}

const OPTIONS: ZoomLevel[] = ['month', 'week']
const LABELS: Record<ZoomLevel, string> = {
  month: 'Month',
  week: 'Week'
}

export default function ZoomControls({ value, onChange }: ZoomControlsProps) {
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
