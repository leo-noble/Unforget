import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Target, CheckCheck, Award } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section } from '../ui/List'
import { toISODate, addDays, MAX_REVIEW_INDEX } from '../../lib/srs'
import { formatDay, plural } from '../../lib/format'
import { subjectColor } from '../../lib/colors'
import { easeOut } from '../ui/motion'

const DAYS = 30

function Tile({ icon: Icon, color, value, label }) {
  return (
    <div className="bg-card rounded-cell p-4">
      <span className="h-8 w-8 rounded-full flex items-center justify-center text-white" style={{ background: color }}>
        <Icon size={17} strokeWidth={2.4} />
      </span>
      <p className="font-rounded text-title-1 font-bold tabular mt-3">{value}</p>
      <p className="text-footnote text-label-2">{label}</p>
    </div>
  )
}

// Everything the old Stats tab showed, as a sheet off Today: the numbers
// that say the work is adding up, without a whole tab to itself.
export default function InsightsSheet({ cadence, onClose }) {
  const { subjects, chapters, events, streak } = cadence
  const [picked, setPicked] = useState(null)

  const totals = useMemo(() => {
    const completed = events.filter((e) => e.action === 'completed').length
    const struggled = events.filter((e) => e.action === 'struggled').length
    const mastered = chapters.filter((c) => c.status === 'mastered').length
    return {
      completed,
      mastered,
      retention: completed + struggled === 0 ? null : Math.round((completed / (completed + struggled)) * 100),
    }
  }, [events, chapters])

  const activity = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: DAYS }, (_, i) => toISODate(addDays(today, i - (DAYS - 1))))
    const counts = new Map(days.map((d) => [d, 0]))
    events.forEach((e) => {
      if (e.action === 'completed' && counts.has(e.completedDate)) counts.set(e.completedDate, counts.get(e.completedDate) + 1)
    })
    const max = Math.max(1, ...counts.values())
    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    return { total, bars: days.map((d) => ({ date: d, count: counts.get(d), pct: counts.get(d) / max })) }
  }, [events])

  const bySubject = useMemo(
    () =>
      subjects
        .map((s) => {
          const list = chapters.filter((c) => c.subjectId === s.id)
          const mastered = list.filter((c) => c.status === 'mastered').length
          const progress = list.reduce(
            (sum, c) => sum + (c.status === 'mastered' ? MAX_REVIEW_INDEX : c.currentReviewIndex || 0),
            0
          )
          const max = list.length * MAX_REVIEW_INDEX
          return { ...s, count: list.length, mastered, pct: max === 0 ? 0 : progress / max }
        })
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count),
    [subjects, chapters]
  )

  const sel = picked != null ? activity.bars[picked] : null

  return (
    <Sheet title="Insights" onClose={onClose} size="lg" trailing={null}>
      <div className="space-y-7">
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={Flame} color="var(--orange)" value={streak.count} label="day streak" />
          <Tile
            icon={Target}
            color="var(--pink)"
            value={totals.retention === null ? '—' : `${totals.retention}%`}
            label="retention"
          />
          <Tile icon={CheckCheck} color="var(--tint)" value={totals.completed} label="reviews done" />
          <Tile icon={Award} color="var(--green)" value={totals.mastered} label="chapters mastered" />
        </div>

        <Section title="Last 30 days">
          <div className="p-4">
            <div className="flex items-baseline justify-between mb-4 min-h-[44px]">
              <div>
                <p className="font-rounded text-title-2 font-bold tabular">
                  {sel ? sel.count : activity.total}
                  <span className="text-subhead font-medium text-label-2 ml-1.5">
                    {sel ? (sel.count === 1 ? 'review' : 'reviews') : activity.total === 1 ? 'review' : 'reviews'}
                  </span>
                </p>
                <p className="text-footnote text-label-2">{sel ? formatDay(sel.date) : 'Past 30 days'}</p>
              </div>
            </div>
            <div className="flex items-end gap-[3px] h-28" onPointerLeave={() => setPicked(null)}>
              {activity.bars.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  onPointerEnter={() => setPicked(i)}
                  onClick={() => setPicked(picked === i ? null : i)}
                  aria-label={`${formatDay(d.date)}: ${plural(d.count, 'review')}`}
                  className="flex-1 h-full flex items-end"
                >
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: Math.max(0.04, d.pct) }}
                    transition={{ duration: 0.5, delay: i * 0.012, ease: easeOut }}
                    style={{ originY: 1 }}
                    className={`block w-full h-full rounded-[4px] ${
                      d.count > 0 ? (picked === i ? 'bg-tint' : 'tint-gradient') : 'bg-fill'
                    } ${picked != null && picked !== i ? 'opacity-50' : ''}`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-caption text-label-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </Section>

        <Section title="Subjects">
          {bySubject.length === 0 && <p className="px-4 py-4 text-subhead text-label-2">Add a chapter to see your subjects here.</p>}
          {bySubject.map((s) => (
            <div key={s.id} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: subjectColor(s.colorTag) }} />
                  <span className="text-body truncate">{s.name}</span>
                </span>
                <span className="text-footnote text-label-2 tabular shrink-0">
                  {s.mastered}/{s.count} mastered
                </span>
              </div>
              <div className="h-2 rounded-full bg-fill overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: s.pct }}
                  transition={{ duration: 0.6, ease: easeOut }}
                  style={{ originX: 0, background: subjectColor(s.colorTag) }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          ))}
        </Section>
      </div>
    </Sheet>
  )
}
