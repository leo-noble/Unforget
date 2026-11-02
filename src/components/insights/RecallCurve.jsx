import { addDays, daysBetween, toISODate, startOfDay } from '../../lib/srs'
import { halfLife } from '../../lib/memory'

const W = 520
const H = 110
const PAD_B = 16

// This chapter's forgetting curve: recall falling from its last review, with
// today marked in the data hue and the next review as a grey line. Shows why
// the review lands when it does.
export default function RecallCurve({ chapter, lastReviewed, today = new Date() }) {
  const start = lastReviewed || chapter.lastActionDate || chapter.studiedDate
  const todayISO = toISODate(today)
  const h = halfLife(chapter)
  const due = chapter.nextReviewDate
  const sinceStart = Math.max(0, daysBetween(start, todayISO))
  const toDue = due ? Math.max(0, daysBetween(start, due)) : 0
  const span = Math.max(sinceStart, toDue, 2) * 1.25
  const x = (d) => (d / span) * W
  const y = (r) => (1 - r) * (H - PAD_B - 4) + 4
  const recall = (d) => Math.pow(2, -d / h)
  const steps = 48
  const path = Array.from({ length: steps + 1 }, (_, i) => {
    const d = (i / steps) * span
    return `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(recall(d)).toFixed(1)}`
  }).join(' ')
  const now = recall(sinceStart)
  const label = (iso) => startOfDay(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endISO = toISODate(addDays(start, Math.round(span)))

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label={`Recall about ${Math.round(now * 100)}% today${due ? `, next review ${label(due)}` : ''}`}>
        <line x1="0" x2={W} y1={y(0.5)} y2={y(0.5)} stroke="var(--separator)" strokeDasharray="2 3" />
        <text x={W} y={y(0.5) - 4} textAnchor="end" fontSize="10" fill="var(--label-3)">50%</text>
        <path d={path} fill="none" stroke="var(--label-3)" strokeWidth="1.5" />
        {due && toDue > 0 && (
          <>
            <line x1={x(toDue)} x2={x(toDue)} y1="0" y2={H - PAD_B} stroke="var(--label-3)" strokeWidth="1" />
            <text x={x(toDue)} y={H - 3} textAnchor="middle" fontSize="10" fill="var(--label-2)">Review</text>
          </>
        )}
        <line x1={x(sinceStart)} x2={x(sinceStart)} y1="0" y2={H - PAD_B} stroke="var(--data)" strokeWidth="1" />
        <circle cx={x(sinceStart)} cy={y(now)} r="3.5" fill="var(--data)" />
        <text x={x(sinceStart)} y={H - 3} textAnchor="middle" fontSize="10" fill="var(--label)">Today</text>
        <line x1="0" x2={W} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--separator)" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-caption text-label-3 tabular">
        <span>{label(start)}</span>
        <span>{label(endISO)}</span>
      </figcaption>
    </figure>
  )
}
