import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Target, CheckCheck, Award, Clock3 } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Page from '../ui/Page'
import { Section } from '../ui/List'
import { toISODate, addDays, MAX_REVIEW_INDEX } from '../../lib/srs'
import { formatDay, plural } from '../../lib/format'
import { subjectColor } from '../../lib/colors'
import { easeOut } from '../ui/motion'
import { formatMinutes, weeklyFocusStats } from '../../lib/studyCoach'

const DAYS = 30

function Tile({ icon: Icon, value, label, accent = false }) {
  return (
    <div className="relative overflow-hidden bg-card rounded-cell p-4 min-h-[124px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="eyebrow text-label-2">{label}</span>
        <Icon size={16} strokeWidth={1.75} className={accent ? 'text-accent' : 'text-label-3'} />
      </div>
      <p className="font-display text-[44px] leading-none tabular mt-4">{value}</p>
    </div>
  )
}

// Everything the old Stats tab showed, as a sheet off Today: the numbers
// that say the work is adding up, without a whole tab to itself.
export default function InsightsSheet({ cadence, onClose, asPage = false, account }) {
  const { subjects, chapters, events, streak, focusSessions, pomodoroLog } = cadence
  const showFocusTimer = cadence.prefs.showFocusTimer !== false
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
  const focusWeek = useMemo(() => weeklyFocusStats(focusSessions, pomodoroLog), [focusSessions, pomodoroLog])

  const content = (
      <div className="space-y-7 insights-content">
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={Flame} accent value={streak.count} label="Day streak" />
          <Tile
            icon={Target}
                        value={totals.retention === null ? '—' : `${totals.retention}%`}
            label="Retention"
          />
          <Tile icon={CheckCheck} value={totals.completed} label="Reviews done" />
          <Tile icon={Award} value={totals.mastered} label="Mastered" />
          {showFocusTimer && <Tile icon={Clock3} value={formatMinutes(focusWeek.minutes)} label="Focus this week" />}
          {showFocusTimer && <Tile icon={Target} value={focusWeek.sessions} label="Focus sessions" />}
        </div>

        <Section title="Last 30 days">
          <div className="p-4">
            <div className="flex items-baseline justify-between mb-4 min-h-[44px]">
              <div>
                <p className="font-display text-[40px] leading-none tabular">
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
                    className={`block w-full h-full rounded-full ${
                      d.count > 0 ? (picked === i || i === activity.bars.length - 1 ? 'bg-accent' : 'bg-label') : 'bg-fill'
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
  )

  if (asPage) return <Page title="Insights" trailing={account} wide>{content}</Page>
  return <Sheet title="Insights" onClose={onClose} size="lg" trailing={null}>{content}</Sheet>
}
