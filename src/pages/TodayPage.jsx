import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Plus, ChevronRight, CheckCheck, BookOpen, CalendarClock, Sparkles } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import ProgressRing from '../components/ui/ProgressRing'
import ChapterRow from '../components/chapter/ChapterRow'
import { toISODate, addDays } from '../lib/srs'
import { greeting, relativeDay, plural, todayISO } from '../lib/format'
import { subjectColor } from '../lib/colors'
import { reviewLabel } from '../components/chapter/meta'
import { spring, easeOut } from '../components/ui/motion'
import { useMediaQuery } from '../components/ui/useMediaQuery'

const stagger = (i) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: easeOut, delay: 0.04 + i * 0.06 },
})

// The hero: a ring that fills as today's list empties — the whole daily goal
// is "make this ring full".
function TodayHero({ name, done, remaining, streak, overdue }) {
  const total = done + remaining
  const progress = total === 0 ? 0 : done / total
  const allClear = remaining === 0
  const first = name ? name.split(' ')[0] : ''

  let line
  if (total === 0) line = 'Nothing scheduled today.'
  else if (allClear) line = `All ${plural(done, 'review')} done. Nice work.`
  else if (overdue > 0) line = `${plural(remaining, 'review')} left · ${overdue} overdue`
  else line = `${plural(remaining, 'review')} left today`

  return (
    <motion.div {...stagger(0)} className="relative overflow-hidden bg-card rounded-[28px] shadow-card p-5">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-[0.16] tint-gradient"
        style={{ filter: 'blur(36px)' }}
      />
      <div className="relative flex items-center gap-5">
        <ProgressRing progress={allClear && total > 0 ? 1 : progress} size={104} stroke={12}>
          {total === 0 || allClear ? (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring, delay: 0.25 }}
              className="text-tint"
            >
              <CheckCheck size={34} strokeWidth={2.4} />
            </motion.span>
          ) : (
            <>
              <span className="font-rounded text-[30px] leading-none font-bold tabular">{remaining}</span>
              <span className="text-caption text-label-2 mt-1">to go</span>
            </>
          )}
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-title-3 font-bold leading-tight">
            {greeting()}
            {first ? `, ${first}` : ''}
          </p>
          <p className="text-subhead text-label-2 mt-1">{line}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-orange/15 text-orange text-footnote font-semibold">
              <Flame size={14} fill="currentColor" fillOpacity={0.25} />
              {streak > 0 ? `${streak}-day streak` : 'Start a streak'}
            </span>
            {done > 0 && (
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-green/15 text-green text-footnote font-semibold">
                <CheckCheck size={14} /> {done} done
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function WeekStrip({ events }) {
  // The last seven days of reviews, for the Insights card.
  const days = useMemo(() => {
    const today = new Date()
    const list = Array.from({ length: 7 }, (_, i) => toISODate(addDays(today, i - 6)))
    const counts = new Map(list.map((d) => [d, 0]))
    events.forEach((e) => {
      if (e.action === 'completed' && counts.has(e.completedDate)) counts.set(e.completedDate, counts.get(e.completedDate) + 1)
    })
    const max = Math.max(1, ...counts.values())
    return list.map((d) => ({ d, n: counts.get(d), pct: counts.get(d) / max }))
  }, [events])
  const week = days.reduce((a, b) => a + b.n, 0)
  const letters = days.map(({ d }) =>
    new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))).toLocaleDateString(undefined, {
      weekday: 'narrow',
    })
  )
  return (
    <div className="flex items-end gap-4">
      <div className="shrink-0">
        <p className="font-rounded text-title-1 font-bold tabular leading-none">{week}</p>
        <p className="text-footnote text-label-2 mt-1">reviews this week</p>
      </div>
      <div className="flex-1 flex items-end justify-end gap-1.5 h-14">
        {days.map((x, i) => (
          <div key={x.d} className="flex flex-col items-center gap-1 flex-1 max-w-[22px] h-full justify-end">
            <motion.span
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(0.08, x.pct) }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.2 + i * 0.04 }}
              style={{ originY: 1 }}
              className={`block w-full flex-1 rounded-[5px] ${x.n > 0 ? 'tint-gradient' : 'bg-fill'}`}
            />
            <span className={`text-[10px] font-semibold ${i === 6 ? 'text-tint' : 'text-label-3'}`}>{letters[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodayPage({ cadence, actions, profile, onOpenChapter, onAdd, onOpenInsights, account }) {
  const { overdue, dueToday, chapters, events, streak, subjectMap } = cadence
  const coarse = useMediaQuery('(pointer: coarse)')

  const doneToday = useMemo(() => {
    const t = todayISO()
    return events.filter((e) => (e.action === 'completed' || e.action === 'skipped_ahead') && e.completedDate === t).length
  }, [events])

  const upcoming = useMemo(
    () =>
      chapters
        .filter((c) => c.derivedStatus === 'upcoming')
        .sort((a, b) => (a.nextReviewDate < b.nextReviewDate ? -1 : a.nextReviewDate > b.nextReviewDate ? 1 : 0))
        .slice(0, 5),
    [chapters]
  )

  const remaining = overdue.length + dueToday.length
  const eyebrow = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  const rowProps = (c) => ({
    chapter: c,
    subject: subjectMap.get(c.subjectId),
    onOpen: onOpenChapter,
    onRevise: actions.revise,
    onSnooze: actions.snooze,
    onLocked: actions.locked,
  })

  return (
    <Page title="Today" eyebrow={eyebrow} trailing={account}>
      <div className="space-y-7">
        <TodayHero
          name={profile?.name}
          done={doneToday}
          remaining={remaining}
          streak={streak.count}
          overdue={overdue.length}
        />

        <AnimatePresence initial={false}>
          {overdue.length > 0 && (
            <motion.div key="overdue" {...stagger(1)} exit={{ opacity: 0, height: 0 }}>
              <Section
                prominent
                title={
                  <span className="flex items-center gap-2">
                    Overdue
                    <span className="h-[22px] min-w-[22px] px-1.5 rounded-full bg-red text-white text-caption font-bold flex items-center justify-center tabular">
                      {overdue.length}
                    </span>
                  </span>
                }
              >
                <AnimatePresence initial={false}>
                  {overdue.map((c) => (
                    <ChapterRow key={c.id} {...rowProps(c)} />
                  ))}
                </AnimatePresence>
              </Section>
            </motion.div>
          )}

          {dueToday.length > 0 && (
            <motion.div key="due" {...stagger(2)} exit={{ opacity: 0, height: 0 }}>
              <Section
                prominent
                title="Due Today"
                action={coarse ? <span className="text-subhead text-label-2 pb-0.5">Swipe right to finish</span> : null}
              >
                <AnimatePresence initial={false}>
                  {dueToday.map((c) => (
                    <ChapterRow key={c.id} {...rowProps(c)} />
                  ))}
                </AnimatePresence>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {remaining === 0 && (
          <motion.div {...stagger(1)} className="bg-card rounded-[28px] shadow-card px-6 py-8 text-center">
            {chapters.length === 0 ? (
              <>
                <span className="mx-auto h-14 w-14 rounded-[18px] tint-gradient text-white flex items-center justify-center shadow-tint">
                  <Sparkles size={26} />
                </span>
                <h2 className="text-title-2 font-bold mt-4">Add your first chapter</h2>
                <p className="text-subhead text-label-2 mt-1.5 max-w-[320px] mx-auto">
                  Log what you studied today. Five reviews get scheduled automatically — 1, 3, 7, 15 and 30 days apart.
                </p>
              </>
            ) : (
              <>
                <span className="mx-auto h-14 w-14 rounded-full bg-green/15 text-green flex items-center justify-center">
                  <CheckCheck size={28} strokeWidth={2.4} />
                </span>
                <h2 className="text-title-2 font-bold mt-4">All caught up</h2>
                <p className="text-subhead text-label-2 mt-1.5 max-w-[320px] mx-auto">
                  Nothing else to review today. Studied something new? Log it so its reviews start tomorrow.
                </p>
              </>
            )}
            <Button size="md" className="mt-5" onClick={onAdd}>
              <Plus size={18} strokeWidth={2.6} /> Add Chapter
            </Button>
          </motion.div>
        )}

        {upcoming.length > 0 && (
          <motion.div {...stagger(3)}>
            <Section prominent title="Coming Up">
              {upcoming.map((c) => {
                const subject = subjectMap.get(c.subjectId)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenChapter(c)}
                    style={{ '--inset': '58px' }}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[60px] text-left active:bg-fill transition-colors duration-75"
                  >
                    <span
                      className="h-[30px] w-[30px] rounded-[9px] flex items-center justify-center shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${subjectColor(subject?.colorTag)} 16%, transparent)`,
                        color: subjectColor(subject?.colorTag),
                      }}
                    >
                      <BookOpen size={16} strokeWidth={2.3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body truncate">{c.title}</span>
                      <span className="block text-footnote text-label-2 truncate">
                        {subject?.name} · {reviewLabel(c)}
                      </span>
                    </span>
                    <span className="shrink-0 text-subhead text-label-2">{relativeDay(c.nextReviewDate)}</span>
                  </button>
                )
              })}
            </Section>
          </motion.div>
        )}

        {chapters.length > 0 && (
          <motion.div {...stagger(4)}>
            <Section prominent title="Insights">
              <button
                type="button"
                onClick={onOpenInsights}
                className="w-full text-left p-4 active:bg-fill transition-colors duration-75"
              >
                <WeekStrip events={events} />
                <div className="flex items-center justify-between mt-4 pt-3 hairline-t text-subhead">
                  <span className="flex items-center gap-2 text-label-2">
                    <CalendarClock size={16} /> Retention, streaks and subjects
                  </span>
                  <ChevronRight size={17} className="text-label-3" />
                </div>
              </button>
            </Section>
          </motion.div>
        )}
      </div>
    </Page>
  )
}
