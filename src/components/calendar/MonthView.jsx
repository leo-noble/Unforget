import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, ChevronRight } from 'lucide-react'
import { toISODate, startOfDay, buildTimeline } from '../../lib/srs'
import { blockChapters, blockColor, blockTitle, minutesToLabel, monthMatrix } from '../../lib/timeGrid'
import { subjectColor } from '../../lib/colors'
import { useMediaQuery } from '../ui/useMediaQuery'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_CHIPS = 3

// A chip in a wide month cell — a study block or a review.
function Chip({ entry, onClick }) {
  if (entry.type === 'review') {
    return (
      <button
        onClick={onClick}
        title={`Review ${entry.reviewNumber} — ${entry.title}`}
        className="w-full min-w-0 flex items-center gap-1 rounded-[6px] px-1.5 h-[19px] text-left bg-tint/10 hover:bg-tint/20"
      >
        <RefreshCw size={9} strokeWidth={3} className="shrink-0 text-tint" />
        <span className="truncate text-[11px] text-tint font-semibold">{entry.title}</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      title={`${entry.timeLabel} — ${entry.title}`}
      className="w-full min-w-0 flex items-center gap-1 rounded-[6px] px-1.5 h-[19px] text-left hover:bg-fill"
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${entry.done ? 'opacity-40' : ''}`} style={{ background: entry.color }} />
      {entry.timeLabel && <span className="shrink-0 text-[10.5px] text-label-2 tabular">{entry.timeLabel}</span>}
      <span className={`truncate text-[11px] font-medium ${entry.done ? 'text-label-2 line-through' : ''}`}>{entry.title}</span>
      {entry.extra > 0 && <span className="shrink-0 text-[10.5px] text-label-3 tabular">+{entry.extra}</span>}
    </button>
  )
}

export default function MonthView({ cursorDate, blocks, chapters, chapterMap, subjectMap, onOpenBlock, onOpenChapter, onOpenDay, onCreateOnDate, onSelectDate }) {
  const wide = useMediaQuery('(min-width: 640px)')
  const todayISO = useMemo(() => toISODate(new Date()), [])
  const cursor = useMemo(() => {
    const d = startOfDay(cursorDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [cursorDate])
  const [expanded, setExpanded] = useState(() => new Set())

  // Every entry a day holds, in reading order: untimed study, then the clock,
  // then the reviews the schedule set.
  const entriesByDate = useMemo(() => {
    const map = new Map()
    const push = (date, entry) => (map.get(date) || map.set(date, []).get(date)).push(entry)
    blocks.forEach((block) => {
      const list = blockChapters(block, chapterMap)
      if (list.length === 0) return
      const timed = Number.isFinite(block.startMinute)
      push(block.date, {
        type: 'block',
        key: block.id,
        block,
        sort: timed ? block.startMinute : -1,
        title: blockTitle(block, list),
        extra: list.length - 1,
        color: subjectColor(blockColor(block, subjectMap.get(list[0].subjectId))),
        timeLabel: timed ? minutesToLabel(block.startMinute, { omitMinutes: true }) : '',
        done: block.done,
      })
    })
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      buildTimeline(c).forEach((t) => {
        if (t.state !== 'next' && t.state !== 'upcoming') return
        push(t.date, {
          type: 'review',
          key: `review-${c.id}-${t.reviewNumber}`,
          chapter: c,
          sort: 24 * 60 + t.reviewNumber,
          title: c.title,
          reviewNumber: t.reviewNumber,
          color: subjectColor(subjectMap.get(c.subjectId)?.colorTag),
        })
      })
    })
    map.forEach((list) => list.sort((a, b) => a.sort - b.sort))
    return map
  }, [blocks, chapters, chapterMap, subjectMap])

  const cells = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor])
  const open = (entry) => (entry.type === 'review' ? onOpenChapter(entry.chapter) : onOpenBlock(entry.block))

  if (!wide) {
    // Phone: a compact grid of dates with dots, and the chosen day's agenda.
    const selected = toISODate(cursorDate)
    const agenda = entriesByDate.get(selected) || []
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="grid grid-cols-7 shrink-0 pt-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10.5px] font-semibold uppercase text-label-3 pb-1">
              {w.charAt(0)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 shrink-0 px-1 hairline-b pb-1">
          {cells.map((cell, i) => {
            const iso = toISODate(cell.date)
            const entries = entriesByDate.get(iso) || []
            const isToday = iso === todayISO
            const isSel = iso === selected
            return (
              <button
                key={i}
                onClick={() => onSelectDate(iso)}
                onDoubleClick={() => onOpenDay(iso)}
                className="h-[46px] flex flex-col items-center justify-start pt-1 gap-[3px]"
              >
                <span
                  className={`h-[30px] w-[30px] rounded-full flex items-center justify-center text-[16px] tabular ${
                    isSel ? (isToday ? 'bg-tint text-white font-semibold' : 'bg-label text-canvas font-semibold') : isToday ? 'text-tint font-semibold' : cell.inMonth ? '' : 'text-label-3'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                <span className="flex gap-[3px] h-[5px]">
                  {entries.slice(0, 3).map((e) => (
                    <span key={e.key} className="h-[5px] w-[5px] rounded-full" style={{ background: e.type === 'review' ? 'var(--tint)' : e.color }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <p className="text-footnote font-semibold uppercase tracking-[0.03em] text-label-2">
              {startOfDay(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <button onClick={() => onOpenDay(selected)} className="text-footnote font-semibold text-tint flex items-center">
              Day view <ChevronRight size={14} />
            </button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {agenda.length === 0 ? (
                <button onClick={() => onCreateOnDate(selected)} className="w-full text-left px-4 py-3 text-subhead text-label-2">
                  Nothing planned. <span className="text-tint font-semibold">Plan a session</span>
                </button>
              ) : (
                <div className="ios-list">
                  {agenda.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => open(e)}
                      style={{ '--inset': '30px' }}
                      className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left active:bg-fill"
                    >
                      <span className="w-1 self-stretch my-2.5 rounded-full shrink-0" style={{ background: e.type === 'review' ? 'var(--tint)' : e.color }} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-subhead truncate ${e.done ? 'line-through text-label-2' : ''}`}>{e.title}</span>
                        <span className="block text-caption text-label-2">
                          {e.type === 'review' ? `Review ${e.reviewNumber}` : e.timeLabel || 'All day'}
                          {e.extra > 0 ? ` · +${e.extra} more` : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="grid grid-cols-7 hairline-b shrink-0">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10.5px] uppercase tracking-[0.06em] text-label-2 font-semibold py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6, minmax(92px, 1fr))' }}>
        {cells.map((cell, i) => {
          const iso = toISODate(cell.date)
          const entries = entriesByDate.get(iso) || []
          const isToday = iso === todayISO
          const isExpanded = expanded.has(iso)
          const visible = isExpanded ? entries : entries.slice(0, MAX_CHIPS)
          const hidden = entries.length - visible.length
          return (
            <div
              key={i}
              onDoubleClick={() => onCreateOnDate(iso)}
              className={`relative min-w-0 min-h-0 flex flex-col border-r border-b border-separator/60 [&:nth-child(7n)]:border-r-0 overflow-hidden ${
                cell.inMonth ? '' : 'bg-fill/30'
              }`}
            >
              <div className="px-1.5 pt-1.5 shrink-0">
                <button
                  onClick={() => onOpenDay(iso)}
                  className={`h-6 min-w-6 px-1.5 rounded-full inline-flex items-center gap-1 text-[12.5px] font-semibold tabular hover:bg-fill ${
                    isToday ? 'bg-tint text-white hover:bg-tint' : cell.inMonth ? '' : 'text-label-3'
                  }`}
                >
                  {cell.date.getDate() === 1 && <span>{cell.date.toLocaleDateString(undefined, { month: 'short' })}</span>}
                  {cell.date.getDate()}
                </button>
              </div>
              <div className="min-h-0 flex-1 flex flex-col gap-[2px] px-1 pt-1 pb-1 overflow-y-auto overscroll-contain no-scrollbar">
                {visible.map((entry) => (
                  <Chip key={entry.key} entry={entry} onClick={() => open(entry)} />
                ))}
                {hidden > 0 && (
                  <button
                    onClick={() => setExpanded((prev) => new Set(prev).add(iso))}
                    className="px-1.5 text-left text-[10.5px] font-semibold text-label-2 hover:text-tint shrink-0"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
