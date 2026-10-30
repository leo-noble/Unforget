import { useMemo } from 'react'
import { Check, Flame } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { addDays, startOfDay, toISODate } from '../../lib/srs'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function formatDate(iso, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options)
}

export default function StreakSheet({ streak, onClose }) {
  const today = toISODate(new Date())
  const completedDays = useMemo(() => {
    const monday = addDays(startOfDay(new Date()), -((new Date().getDay() + 6) % 7))
    const first = addDays(monday, -21)
    const days = new Set(streak.completedDays || [])
    if (streak.lastCompletedDay) days.add(streak.lastCompletedDay)
    return Array.from({ length: 28 }, (_, i) => {
      const date = toISODate(addDays(first, i))
      return { date, complete: days.has(date), future: date > today }
    })
  }, [streak.completedDays, streak.lastCompletedDay, today])

  const completedCount = completedDays.filter((day) => day.complete).length

  return (
    <Sheet title="Study streak" onClose={onClose} size="md">
      <div className="space-y-5 px-1 pb-2">
        <div className="flex items-center gap-3 rounded-[20px] bg-card p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill"><Flame size={19} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-footnote text-label-2">Current streak</p>
            <p className="font-display text-[30px] leading-tight tabular">{streak.count || 0} <span className="text-subhead text-label-2">days</span></p>
          </div>
          <p className="text-right text-footnote text-label-2">{completedCount}<br />days cleared</p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="eyebrow text-label">Last four weeks</h3>
            <span className="text-caption text-label-2">Every due review cleared</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {WEEKDAYS.map((day, i) => <span key={`${day}-${i}`} className="text-caption text-label-3">{day}</span>)}
            {completedDays.map(({ date, complete, future }) => (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <span
                  title={`${formatDate(date)}${complete ? ' · completed all reviews' : ''}`}
                  aria-label={`${formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}${complete ? ', completed all due reviews' : future ? ', upcoming' : ', not completed'}`}
                  role="img"
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-footnote tabular ${complete ? 'bg-label text-canvas' : future ? 'text-label-3/45' : 'bg-fill text-label-2'}`}
                >
                  {complete ? <Check size={15} strokeWidth={2.8} /> : Number(date.slice(-2))}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-footnote text-label-2">A lit day means you finished every review that was due.</p>
        </div>
      </div>
    </Sheet>
  )
}
