import { SADIE_COLOR } from '../../utils/people'

/** Marks an entry as Sadie's work. */
export default function SadieBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0"
      style={{ color: SADIE_COLOR, backgroundColor: `${SADIE_COLOR}1A`, border: `1px solid ${SADIE_COLOR}55` }}
      title="Sadie worked on this"
    >
      Sadie
    </span>
  )
}
