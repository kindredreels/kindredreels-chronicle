import type { EntrySignificance } from '../../types'
import { SIGNIFICANCE_CONFIG } from '../../constants/entryCategories'

interface SignificanceDotProps {
  significance: EntrySignificance
  showLabel?: boolean
}

export default function SignificanceDot({ significance, showLabel }: SignificanceDotProps) {
  const { size, label } = SIGNIFICANCE_CONFIG[significance]

  const dotStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
    ...(significance === 'major'
      ? { backgroundColor: '#F59E0B' }
      : significance === 'moderate'
        ? { backgroundColor: '#F59E0B80' }
        : { border: '1.5px solid #F59E0B80', backgroundColor: 'transparent' })
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={dotStyle} />
      {showLabel && <span className="text-xs text-gray-400">{label}</span>}
    </span>
  )
}
