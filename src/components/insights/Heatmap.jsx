import { useLayoutEffect, useMemo, useRef } from 'react'
import { addDays, toISODate, startOfDay } from '../../lib/srs'

const STEP = ['bg-fill-2', 'bg-data-1', 'bg-data-2', 'bg-data-3', 'bg-data-4']

// Reviews done per day over the last `weeks` weeks, one column per week,
// Monday at the top. Shades are fixed counts (1, 2-3, 4-5, 6+) so a light
// day looks the same next month as it does now.
export default function Heatmap({ events, weeks = 16, today = new Date() }) {
  const { columns, total, activeDays, months } = useMemo(() => {
    const counts = new Map()
    events.forEach((e) => {
      if (e.action === 'completed') counts.set(e.completedDate, (counts.get(e.completedDate) || 0) + 1)
    })
    const t = startOfDay(today)
    const monday = addDays(t, -((t.getDay() + 6) % 7))
    const first = addDays(monday, -7 * (weeks - 1))
    const todayISO = toISODate(t)
    const cols = []
    const monthMarks = []
    let sum = 0
    let active = 0
    for (let w = 0; w < weeks; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(first, w * 7 + d)
        const iso = toISODate(date)
        const future = iso > todayISO
        const n = future ? 0 : counts.get(iso) || 0
        if (!future) {
          sum += n
          if (n) active += 1
        }
        col.push({ iso, n, future })
        if (d === 0 && (w === 0 || date.getDate() <= 7)) monthMarks.push({ w, label: date.toLocaleDateString(undefined, { month: 'short' }) })
      }
      cols.push(col)
    }
    return { columns: cols, total: sum, activeDays: active, months: monthMarks }
  }, [events, weeks, today])

  const step = (n) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)
  // On a narrow screen the grid scrolls sideways; start at the recent end.
  const scroller = useRef(null)
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth
  }, [weeks])
  const span = weeks >= 52 ? 'the last year' : `the last ${weeks} weeks`

  return (
    <div>
      <p className="text-subhead text-label-2 mb-3">
        <span className="text-label tabular">{total}</span> reviews on <span className="text-label tabular">{activeDays}</span> days in {span}
      </p>
      <div ref={scroller} className="overflow-x-auto no-scrollbar">
        <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `16px repeat(${weeks}, 14px)` }}>
          <span />
          {columns.map((_, w) => (
            <span key={w} className="text-caption-2 text-label-3 whitespace-nowrap h-4">{months.find((m) => m.w === w)?.label || ''}</span>
          ))}
          {Array.from({ length: 7 }, (_, d) => (
            <Row key={d} d={d} columns={columns} step={step} />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-caption text-label-2">
        Fewer
        {STEP.map((c) => <span key={c} className={`h-2.5 w-2.5 rounded-[2px] ${c}`} aria-hidden="true" />)}
        More
      </div>
    </div>
  )
}

function Row({ d, columns, step }) {
  const name = ['Mon', '', 'Wed', '', 'Fri', '', ''][d]
  return (
    <>
      <span className="text-caption-2 text-label-3 leading-[14px]">{name ? name[0] : ''}</span>
      {columns.map((col) => {
        const cell = col[d]
        return (
          <span
            key={cell.iso}
            title={cell.future ? undefined : `${startOfDay(cell.iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${cell.n} review${cell.n === 1 ? '' : 's'}`}
            className={`h-[14px] w-[14px] rounded-[2px] ${cell.future ? '' : STEP[step(cell.n)]}`}
          />
        )
      })}
    </>
  )
}
