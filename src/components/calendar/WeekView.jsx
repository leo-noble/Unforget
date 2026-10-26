import { useMemo, useRef, useEffect } from 'react'
import { toISODate, buildTimeline } from '../../lib/srs'
import { weekDates, dayWindow, GUTTER_WIDTH } from '../../lib/timeGrid'
import AllDayStrip from './AllDayStrip'
import TimeGrid from './TimeGrid'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// The day-header row's height, in px. It's a fixed number because the all-day
// band pins directly beneath it — `sticky top-0` and `sticky top-41px` have to
// agree, and a header sized by its content would let the two rows overlap.
const HEADER_HEIGHT = 54

export default function WeekView({
  cursorDate,
  blocks,
  chapters,
  chapterMap,
  subjectMap,
  onMoveBlock,
  onResizeBlock,
  onCreateAt,
  onToggleDone,
  onOpenBlock,
  onOpenChapter,
  onSelectDate,
}) {
  const dates = useMemo(() => weekDates(cursorDate), [cursorDate])
  const todayISO = useMemo(() => toISODate(new Date()), [])
  const panRef = useRef(null)

  // When the week is panning (phones), open on the cursor's day rather than on
  // Sunday — otherwise today sits off-screen behind a scroll the user has no
  // reason to suspect. A no-op on desktop, where nothing overflows.
  useEffect(() => {
    const el = panRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const i = Math.max(0, dates.indexOf(cursorDate))
    const colWidth = (el.scrollWidth - GUTTER_WIDTH) / dates.length
    const target = GUTTER_WIDTH + colWidth * i - (el.clientWidth - GUTTER_WIDTH - colWidth) / 2
    el.scrollLeft = Math.max(0, target)
  }, [cursorDate, dates])

  // Group blocks by date.
  const blocksByDate = useMemo(() => {
    const map = new Map()
    dates.forEach((iso) => map.set(iso, []))
    blocks.forEach((b) => {
      if (map.has(b.date)) map.get(b.date).push(b)
    })
    return map
  }, [blocks, dates])

  // Reviews — every not-yet-completed date from every active chapter's timeline.
  const reviewsByDate = useMemo(() => {
    const map = new Map()
    dates.forEach((iso) => map.set(iso, []))
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      buildTimeline(c).forEach((t) => {
        if ((t.state === 'next' || t.state === 'upcoming') && map.has(t.date)) {
          map.get(t.date).push({ chapterId: c.id, reviewNumber: t.reviewNumber, onOpen: onOpenChapter })
        }
      })
    })
    return map
  }, [chapters, dates, onOpenChapter])

  // The hour range to draw. Computed from the week's own blocks, so a 6am
  // session widens the window for the week that holds it and no other.
  const win = useMemo(
    () => dayWindow(dates.flatMap((iso) => blocksByDate.get(iso) || [])),
    [dates, blocksByDate]
  )

  // The whole band collapses when the week holds nothing all-day, rather
  // than leaving an empty strip under the headers — Day view does the same.
  const hasAllDay = useMemo(
    () =>
      dates.some(
        (iso) =>
          (reviewsByDate.get(iso) || []).length > 0 ||
          (blocksByDate.get(iso) || []).some((b) => !Number.isFinite(b.startMinute))
      ),
    [dates, reviewsByDate, blocksByDate]
  )

  return (
    // Seven columns don't fit a phone — below 680px they'd be ~40px wide and
    // no title would survive. There the week pans sideways at a legible
    // column width instead; from md up the min-width never binds and nothing
    // overflows horizontally.
    //
    // Both axes scroll from this one element on purpose. A sticky child only
    // pins against the scroll container it actually scrolls in, so splitting
    // the axes across two nested scrollers would leave the hour gutter
    // sticking to a container that never moves sideways — it would pan away
    // with the grid. One scrollport owning both axes is what keeps the gutter
    // and the day headers pinned.
    <div ref={panRef} className="h-full overflow-auto overscroll-contain">
      <div className="min-w-[720px] lg:min-w-0">
        {/* Day headers. Fixed height, because the all-day band below pins at
            exactly this offset — a header that grew with its content would
            leave the two rows overlapping. */}
        <div className="flex hairline-b sticky top-0 bg-card z-50" style={{ height: HEADER_HEIGHT }}>
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0 sticky left-0 z-10 bg-card" />
          {dates.map((iso, i) => {
            const d = new Date(iso + 'T00:00:00')
            const isToday = iso === todayISO
            const isCursor = iso === cursorDate
            return (
              <button
                key={iso}
                onClick={() => onSelectDate?.(iso)}
                title={d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 active:bg-fill hover:bg-fill/60 transition-colors duration-100"
              >
                <span className={`text-[10.5px] uppercase tracking-[0.06em] font-semibold ${isToday ? 'text-tint' : 'text-label-2'}`}>
                  {WEEKDAY_LABELS[i]}
                </span>
                {/* Today gets the filled accent disc, as in Calendar. */}
                <span
                  className={`h-[26px] min-w-[26px] px-1 rounded-full flex items-center justify-center text-[15px] font-semibold tabular ${
                    isToday ? 'bg-tint text-white' : isCursor ? 'bg-fill text-label' : 'text-label'
                  }`}
                >
                  {d.getDate()}
                </span>
              </button>
            )
          })}
        </div>

        {/* All-day strips per column. The band owns one continuous background so
            populated and empty days read as a single row, and every column is a
            shrinkable flex item so entries truncate instead of spilling sideways.
            Pinned under the headers so it doesn't scroll away from them. */}
        {hasAllDay && (
          <div className="flex items-stretch hairline-b bg-card sticky z-40" style={{ top: HEADER_HEIGHT }}>
            <div
              style={{ width: GUTTER_WIDTH }}
              className="shrink-0 sticky left-0 z-10 bg-card flex items-center justify-end pr-2.5"
            >
              <span className="text-[10px] text-label-3 font-semibold">all-day</span>
            </div>
            {dates.map((iso) => (
              <div key={iso} className="flex-1 min-w-0">
                <AllDayStrip
                  compact
                  reviews={reviewsByDate.get(iso) || []}
                  untimedBlocks={(blocksByDate.get(iso) || []).filter(
                    (b) => !Number.isFinite(b.startMinute)
                  )}
                  chapterMap={chapterMap}
                  subjectMap={subjectMap}
                  onToggleDone={onToggleDone}
                  onOpenBlock={onOpenBlock}
                />
              </div>
            ))}
          </div>
        )}

        {/* Hour canvas */}
        <TimeGrid
          dates={dates}
          blocksByDate={blocksByDate}
          chapterMap={chapterMap}
          subjectMap={subjectMap}
          window={win}
          onMoveBlock={onMoveBlock}
          onResizeBlock={onResizeBlock}
          onCreateAt={onCreateAt}
          onToggleDone={onToggleDone}
          onOpenBlock={onOpenBlock}
          scrollParentRef={panRef}
        />
      </div>
    </div>
  )
}
