import { useMemo, useRef } from 'react'
import { toISODate, buildTimeline } from '../../lib/srs'
import { dayWindow, GUTTER_WIDTH } from '../../lib/timeGrid'
import AllDayStrip from './AllDayStrip'
import TimeGrid from './TimeGrid'

// Day view: one column filling the width, same structure as Week — one
// scrollport owning both axes, so the header and the hour gutter pin.
export default function DayView({
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
}) {
  const iso = useMemo(() => toISODate(cursorDate), [cursorDate])
  const dates = useMemo(() => [iso], [iso])
  const scrollRef = useRef(null)

  const blocksByDate = useMemo(() => new Map([[iso, blocks.filter((b) => b.date === iso)]]), [blocks, iso])

  const reviews = useMemo(() => {
    const list = []
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      const match = buildTimeline(c).find((t) => t.date === iso && (t.state === 'next' || t.state === 'upcoming'))
      if (match) list.push({ chapterId: c.id, reviewNumber: match.reviewNumber, onOpen: onOpenChapter })
    })
    return list
  }, [chapters, iso, onOpenChapter])

  const untimed = useMemo(() => (blocksByDate.get(iso) || []).filter((b) => !Number.isFinite(b.startMinute)), [blocksByDate, iso])
  const timedCount = (blocksByDate.get(iso) || []).length - untimed.length

  // Widened past 7:00–23:00 by anything booked outside it.
  const win = useMemo(() => dayWindow(blocksByDate.get(iso) || []), [blocksByDate, iso])

  return (
    <div ref={scrollRef} className="h-full overflow-auto overscroll-contain">
      {(reviews.length > 0 || untimed.length > 0) && (
        <div className="flex hairline-b bg-card sticky top-0 z-50">
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0 flex items-start justify-end pr-2.5 pt-2.5">
            <span className="text-[10px] text-label-3 font-semibold">all-day</span>
          </div>
          <div className="flex-1 min-w-0">
            <AllDayStrip
              reviews={reviews}
              untimedBlocks={untimed}
              chapterMap={chapterMap}
              subjectMap={subjectMap}
              onToggleDone={onToggleDone}
              onOpenBlock={onOpenBlock}
            />
          </div>
        </div>
      )}

      <div className="relative">
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
          scrollParentRef={scrollRef}
        />
        {timedCount === 0 && (
          <p className="pointer-events-none absolute left-0 right-0 top-[200px] text-center text-footnote text-label-3 px-8">
            <span className="hidden [@media(pointer:fine)]:inline">Click or drag on the grid to plan a session.</span>
            <span className="[@media(pointer:fine)]:hidden">Touch and hold the grid to plan a session.</span>
          </p>
        )}
      </div>
    </div>
  )
}
