import { useState } from 'react'
import { Check, RefreshCw, ChevronDown } from 'lucide-react'
import { blockTitle, blockColor, blockChapters } from '../../lib/timeGrid'
import { subjectColor } from '../../lib/colors'

// The all-day strip holds two kinds of entry, drawn in different visual
// languages so the grid never needs decoding: reviews (the schedule's, tinted
// capsules with a repeat glyph) and untimed study blocks (yours, subject rail).
export default function AllDayStrip({ reviews, untimedBlocks, chapterMap, subjectMap, onToggleDone, onOpenBlock, compact = false }) {
  const [open, setOpen] = useState(false)
  // In the roomy day view, more than two reviews fold into one quiet line
  // until you ask to see them.
  const fold = !compact && reviews.length > 2 && !open
  const shownReviews = fold ? [] : reviews
  const entries = [...shownReviews.map((r) => ({ type: 'review', ...r })), ...untimedBlocks.map((b) => ({ type: 'block', ...b }))]
  if (entries.length === 0 && !fold) return null

  return (
    <div className={compact ? 'p-1' : 'px-2 py-2'}>
      <div className={compact ? 'flex flex-col gap-1' : 'flex flex-wrap items-center gap-1.5'}>
        {!compact && reviews.length > 2 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-fill-2 text-footnote font-medium text-label hover:bg-fill"
          >
            <RefreshCw size={12} strokeWidth={2.4} />
            {reviews.length} reviews due
            <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
        {entries.map((entry) => {
          if (entry.type === 'review') {
            const chapter = chapterMap.get(entry.chapterId)
            if (!chapter) return null
            const subject = subjectMap.get(chapter.subjectId)
            return (
              <button
                key={`review-${entry.chapterId}`}
                onClick={() => entry.onOpen?.(chapter)}
                title={`Review ${entry.reviewNumber} — ${chapter.title}`}
                className={`inline-flex items-center gap-1 rounded-full bg-fill text-label-2 font-medium hover:bg-fill-2 transition-colors duration-100 ${
                  compact ? 'w-full min-w-0 px-1.5 h-[22px] text-[10.5px]' : 'px-2.5 h-7 text-footnote'
                }`}
              >
                {!compact && <RefreshCw size={12} strokeWidth={2.6} className="shrink-0" />}
                {compact && subject && (
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: subjectColor(subject.colorTag) }} />
                )}
                <span className={`truncate text-left ${compact ? 'min-w-0 flex-1' : 'max-w-[180px]'}`}>{chapter.title}</span>
                <span className="shrink-0 opacity-70 tabular">{compact ? entry.reviewNumber : `R${entry.reviewNumber}`}</span>
              </button>
            )
          }

          const chapters = blockChapters(entry, chapterMap)
          if (chapters.length === 0) return null
          const color = subjectColor(blockColor(entry, subjectMap.get(chapters[0].subjectId)))
          const title = blockTitle(entry, chapters)
          const extra = chapters.length - 1

          return (
            <div
              key={entry.id}
              style={{ background: `color-mix(in srgb, ${color} 18%, var(--card))` }}
              className={`relative items-center gap-1.5 pl-2.5 pr-2 rounded-[4px] overflow-hidden ${
                compact ? 'flex w-full min-w-0 h-[24px]' : 'inline-flex h-7'
              } ${entry.done ? 'opacity-55' : ''}`}
            >
              <span aria-hidden="true" className="absolute left-0 inset-y-0 w-[3px]" style={{ background: color }} />
              <button
                type="button"
                onClick={() => onToggleDone(entry.id)}
                role="checkbox"
                aria-checked={entry.done}
                aria-label={`Mark ${title} studied`}
                className="h-[15px] w-[15px] shrink-0 rounded-full flex items-center justify-center text-tint-fg"
                style={{ background: entry.done ? color : 'var(--card)', boxShadow: entry.done ? 'none' : `inset 0 0 0 1.5px ${color}` }}
              >
                {entry.done && <Check size={9} strokeWidth={3.5} />}
              </button>
              <button
                type="button"
                onClick={() => onOpenBlock(entry)}
                title={extra > 0 ? `${title} +${extra} more` : title}
                className={`font-medium truncate text-left ${compact ? 'min-w-0 flex-1 text-[11px]' : 'max-w-[180px] text-footnote'} ${
                  entry.done ? 'line-through' : ''
                }`}
                style={{ color: `color-mix(in srgb, ${color} 70%, var(--label))` }}
              >
                {title}
              </button>
              {extra > 0 && <span className="shrink-0 text-[10.5px] text-label-2 tabular">+{extra}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
