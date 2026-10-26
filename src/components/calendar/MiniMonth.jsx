import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toISODate, startOfDay } from '../../lib/srs'
import { monthMatrix } from '../../lib/timeGrid'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// The date picker in the toolbar popover: the week being viewed as one tinted
// band, today as the filled accent disc, and a dot on days with work.
export default function MiniMonth({ cursorDate, weekDates, loadByDate, onSelectDate, onShiftMonth }) {
  const todayISO = useMemo(() => toISODate(new Date()), [])
  const { year, month } = useMemo(() => {
    const d = startOfDay(cursorDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [cursorDate])
  const cells = useMemo(() => monthMatrix(year, month), [year, month])
  const inWeek = useMemo(() => new Set(weekDates), [weekDates])

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2 pl-1.5">
        <p className="text-headline font-medium">
          {new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center">
          <button onClick={() => onShiftMonth(-1)} aria-label="Previous month" className="h-8 w-8 rounded-full flex items-center justify-center text-tint hover:bg-fill">
            <ChevronLeft size={19} strokeWidth={2.4} />
          </button>
          <button onClick={() => onShiftMonth(1)} aria-label="Next month" className="h-8 w-8 rounded-full flex items-center justify-center text-tint hover:bg-fill">
            <ChevronRight size={19} strokeWidth={2.4} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10.5px] font-medium text-label-3 pb-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          const iso = toISODate(cell.date)
          const isToday = iso === todayISO
          const selected = inWeek.has(iso)
          const col = i % 7
          const load = loadByDate.get(iso) || 0
          return (
            <button
              key={i}
              onClick={() => onSelectDate(iso)}
              className={`relative h-9 flex items-center justify-center text-subhead tabular ${
                selected ? `bg-tint/10 ${col === 0 ? 'rounded-l-full' : ''} ${col === 6 ? 'rounded-r-full' : ''}` : ''
              }`}
            >
              <span
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isToday ? 'bg-accent text-tint-fg font-medium' : cell.inMonth ? 'hover:bg-fill' : 'text-label-3 hover:bg-fill'
                }`}
              >
                {cell.date.getDate()}
              </span>
              {load > 0 && !isToday && <span className="absolute bottom-[3px] h-[4px] w-[4px] rounded-full bg-tint/60" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
