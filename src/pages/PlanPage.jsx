import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import Page from '../components/ui/Page'
import { IconButton } from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import StudyPlanSheet from '../components/calendar/StudyPlanSheet'
import MiniMonth from '../components/calendar/MiniMonth'
import WeekView from '../components/calendar/WeekView'
import DayView from '../components/calendar/DayView'
import MonthView from '../components/calendar/MonthView'
import { useIsDesktop } from '../components/ui/useMediaQuery'
import { toISODate, startOfDay, addDays, buildTimeline } from '../lib/srs'
import { startOfWeek, weekDates as weekDatesOf } from '../lib/timeGrid'
import { snappy, easeOut } from '../components/ui/motion'

const VIEWS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

// Phones open on Day: seven hour-columns at 375px are ~46px wide, too narrow
// to read a title in. Week and Month are one tap away on every size.
const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 768

// iOS Calendar's week row above the day view: seven dates, tap to jump,
// swipe sideways for the previous or next week.
function WeekStrip({ cursor, onSelect, onShiftWeek, loadByDate }) {
  const todayISO = toISODate(new Date())
  const dates = weekDatesOf(cursor)
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        if (info.offset.x < -50) onShiftWeek(1)
        else if (info.offset.x > 50) onShiftWeek(-1)
      }}
      className="grid grid-cols-7 mb-3 select-none"
    >
      {dates.map((iso) => {
        const d = startOfDay(iso)
        const sel = iso === cursor
        const today = iso === todayISO
        return (
          <button key={iso} onClick={() => onSelect(iso)} className="flex flex-col items-center gap-1 py-1">
            <span className={`text-[11px] font-medium uppercase ${today ? 'text-accent' : 'text-label-2'}`}>
              {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </span>
            <span className="relative h-9 w-9 flex items-center justify-center">
              {sel && (
                <motion.span
                  layoutId="weekstrip-sel"
                  transition={snappy}
                  className={`absolute inset-0 rounded-full ${today ? 'bg-accent' : 'bg-label'}`}
                />
              )}
              <span
                className={`relative text-[17px] tabular ${sel ? (today ? 'text-tint-fg' : 'text-canvas') + ' font-medium' : today ? 'text-accent font-medium' : ''}`}
              >
                {d.getDate()}
              </span>
            </span>
            <span className={`h-[5px] w-[5px] rounded-full ${loadByDate.get(iso) ? 'bg-label-3' : 'bg-transparent'}`} />
          </button>
        )
      })}
    </motion.div>
  )
}

export default function PlanPage({ cadence, onOpenChapter, account }) {
  const {
    chapters,
    subjectMap,
    blocks,
    createStudyBlocks,
    updateStudyBlock,
    moveStudyBlock,
    resizeStudyBlock,
    removeStudyBlock,
    removeStudySeries,
    toggleStudyBlockDone,
  } = cadence
  const desktop = useIsDesktop()
  const todayISO = toISODate(new Date())
  const [view, setView] = useState(() => (isNarrow() ? 'day' : 'week'))
  // One cursor date drives every view, so switching views keeps your place.
  const [cursor, setCursor] = useState(todayISO)
  const [sheet, setSheet] = useState(null) // { block } to edit, { date, startMinute, endMinute } to create
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const gridRef = useRef(null)
  const [gridTop, setGridTop] = useState(260)

  const chapterMap = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters])
  const pickerWeek = useMemo(() => weekDatesOf(cursor), [cursor])

  // A dot on days that already hold work: planned blocks and scheduled reviews.
  const loadByDate = useMemo(() => {
    const map = new Map()
    blocks.forEach((b) => map.set(b.date, (map.get(b.date) || 0) + 1))
    chapters.forEach((c) => {
      if (c.status === 'mastered') return
      buildTimeline(c).forEach((t) => {
        if (t.state !== 'done') map.set(t.date, (map.get(t.date) || 0) + 1)
      })
    })
    return map
  }, [blocks, chapters])

  function shift(delta) {
    setCursor((prev) => {
      if (view === 'day') return toISODate(addDays(prev, delta))
      if (view === 'week') return toISODate(addDays(prev, delta * 7))
      const d = startOfDay(prev)
      return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1))
    })
  }

  // The grid fills the screen down to the dock and scrolls inside itself, so
  // the hour gutter and day headers have something to pin against.
  useLayoutEffect(() => {
    function measure() {
      const el = gridRef.current
      if (el) setGridTop(el.getBoundingClientRect().top + window.scrollY)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [view, desktop])

  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e) => {
      if (!pickerRef.current?.contains(e.target)) setPickerOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setPickerOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  const rangeLabel = useMemo(() => {
    const d = startOfDay(cursor)
    if (view === 'day') return d.toLocaleDateString(undefined, desktop ? { weekday: 'long', month: 'long', day: 'numeric' } : { month: 'long', year: 'numeric' })
    if (view === 'month') return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    const start = startOfWeek(d)
    const end = addDays(start, 6)
    const same = start.getMonth() === end.getMonth()
    const a = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const b = end.toLocaleDateString(undefined, same ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
    return `${a} – ${b}`
  }, [cursor, view, desktop])

  const openDay = (iso) => {
    setCursor(iso)
    setView('day')
  }

  const viewProps = {
    cursorDate: cursor,
    blocks,
    chapters,
    chapterMap,
    subjectMap,
    onMoveBlock: moveStudyBlock,
    onResizeBlock: resizeStudyBlock,
    onCreateAt: ({ date, startMinute, endMinute }) => setSheet({ date, startMinute, endMinute }),
    onToggleDone: toggleStudyBlockDone,
    onOpenBlock: (block) => setSheet({ block }),
    onOpenChapter,
    onSelectDate: openDay,
  }

  const gridHeight = desktop
    ? `max(480px, calc(100vh - ${gridTop}px - 28px))`
    : `max(380px, calc(100dvh - ${gridTop}px - env(safe-area-inset-bottom) - var(--dock-space, 112px) + 26px))`

  return (
    <Page
      title="Plan"
      wide
      trailing={
        <>
          <IconButton size={40} label="Plan a study session" onClick={() => setSheet({ date: cursor })}>
            <Plus size={21} strokeWidth={2.4} />
          </IconButton>
          {account}
        </>
      }
    >
      {/* Toolbar: where you are on the left, how you're looking on the right. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 mb-3">
        <div className="relative min-w-0 flex items-center gap-1" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            className="flex items-center gap-1 min-w-0 h-9 pl-1 pr-2 rounded-full hover:bg-fill active:bg-fill"
          >
            <span className="text-title-3 font-medium truncate">{rangeLabel}</span>
            <motion.span animate={{ rotate: pickerOpen ? 180 : 0 }} transition={snappy} className="text-tint shrink-0">
              <ChevronDown size={18} strokeWidth={2.6} />
            </motion.span>
          </button>
          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={snappy}
                className="glass-strong absolute left-0 top-full mt-2 z-30 w-[300px] origin-top-left rounded-[24px] p-3"
              >
                <MiniMonth
                  cursorDate={cursor}
                  weekDates={view === 'week' ? pickerWeek : [cursor]}
                  loadByDate={loadByDate}
                  onSelectDate={(iso) => {
                    setCursor(iso)
                    setPickerOpen(false)
                  }}
                  onShiftMonth={(delta) =>
                    setCursor((prev) => {
                      const d = startOfDay(prev)
                      return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1))
                    })
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {cursor !== todayISO && (
            <button onClick={() => setCursor(todayISO)} className="h-8 px-3 rounded-full bg-tint/15 text-tint text-footnote font-medium">
              Today
            </button>
          )}
          <button onClick={() => shift(-1)} aria-label={`Previous ${view}`} className="h-8 w-8 rounded-full flex items-center justify-center text-tint hover:bg-fill active:bg-fill">
            <ChevronLeft size={21} strokeWidth={2.4} />
          </button>
          <button onClick={() => shift(1)} aria-label={`Next ${view}`} className="h-8 w-8 rounded-full flex items-center justify-center text-tint hover:bg-fill active:bg-fill">
            <ChevronRight size={21} strokeWidth={2.4} />
          </button>
        </div>

        <Segmented
          options={VIEWS}
          value={view}
          onChange={setView}
          ariaLabel="Calendar view"
          size="sm"
          className="w-full md:w-auto md:order-last md:ml-2"
        />
      </div>

      {!desktop && view === 'day' && (
        <WeekStrip
          cursor={cursor}
          onSelect={setCursor}
          onShiftWeek={(d) => setCursor((prev) => toISODate(addDays(prev, d * 7)))}
          loadByDate={loadByDate}
        />
      )}

      <motion.div
        ref={gridRef}
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: easeOut }}
        className="bg-card rounded-[24px] shadow-card overflow-hidden"
        style={{ height: gridHeight }}
      >
        {view === 'week' && <WeekView {...viewProps} />}
        {view === 'day' && <DayView {...viewProps} />}
        {view === 'month' && (
          <MonthView
            {...viewProps}
            onOpenDay={openDay}
            onSelectDate={setCursor}
            onCreateOnDate={(date) => setSheet({ date })}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {sheet && (
          <StudyPlanSheet
            key="study-plan"
            chapters={chapters}
            subjectMap={subjectMap}
            blocks={blocks}
            block={sheet.block}
            defaultDate={sheet.date || cursor}
            defaultStartMinute={sheet.startMinute}
            defaultEndMinute={sheet.endMinute}
            onCreate={({ rows, startMinute, endMinute }) => {
              createStudyBlocks({ rows, startMinute, endMinute })
              if (rows?.[0]?.date) setCursor(rows[0].date)
            }}
            onUpdate={(next) => {
              updateStudyBlock(next)
              if (next.date) setCursor(next.date)
            }}
            onDelete={removeStudyBlock}
            onDeleteSeries={removeStudySeries}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
