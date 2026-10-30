import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock3, Plus, Sparkles, Target } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import ChapterRow from '../components/chapter/ChapterRow'
import { toISODate, addDays } from '../lib/srs'
import { greeting, todayISO } from '../lib/format'
import { reviewLabel, shortWhen } from '../components/chapter/meta'
import { spring, easeOut } from '../components/ui/motion'
import { useTimer } from '../lib/TimerContext'
import { estimateChapterMinutes, formatMinutes, recommendChapters, weeklyFocusStats } from '../lib/studyCoach'
import WeeklyGoalSheet from '../components/sheets/WeeklyGoalSheet'

const stagger = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: easeOut, delay: 0.03 + i * 0.05 },
})

// The hero: how many reviews are left today, and one dot per review that
// fills as you clear them. The whole daily goal is "fill the row".
function TodayHero({ name, done, remaining, overdue }) {
  const total = done + remaining
  const allClear = remaining === 0
  const first = name ? name.split(' ')[0] : ''
  const dots = Math.min(total, 16)
  const filled = total === 0 ? 0 : Math.round((done / total) * dots)

  let line
  if (total === 0) line = 'Nothing scheduled today.'
  else if (allClear) line = 'All done for today.'
  else if (overdue > 0) line = `${overdue} overdue — start there.`
  else line = `${done} of ${total} done.`

  return (
    <motion.div {...stagger(0)} className="bg-card rounded-[28px] p-6">
      <p className="text-subhead text-label-2">{first ? `${greeting()}, ${first}` : greeting()}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <motion.span
          key={remaining}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="font-display text-[76px] leading-[0.9]"
        >
          {remaining}
        </motion.span>
        <span className="text-headline text-label-2">{remaining === 1 ? 'review left' : 'reviews left'}</span>
      </div>
      <p className="text-subhead text-label-2 mt-2">{line}</p>
      {dots > 0 && (
        <div className="mt-5 flex flex-wrap gap-[7px]" aria-label={`${done} of ${total} reviews done`} role="img">
          {Array.from({ length: dots }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring, delay: 0.12 + i * 0.03 }}
              className="h-[10px] w-[10px] rounded-full"
              style={{
                background: i < filled ? 'var(--label)' : 'transparent',
                boxShadow: i < filled ? 'none' : 'inset 0 0 0 1.5px var(--label-3)',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// Last seven days as columns of dots — a dot-matrix bar chart.
function WeekDots({ events, streak = 0 }) {
  const ROWS = 6
  const days = useMemo(() => {
    const today = new Date()
    const list = Array.from({ length: 7 }, (_, i) => toISODate(addDays(today, i - 6)))
    const counts = new Map(list.map((d) => [d, 0]))
    events.forEach((e) => {
      if (e.action === 'completed' && counts.has(e.completedDate)) counts.set(e.completedDate, counts.get(e.completedDate) + 1)
    })
    const max = Math.max(1, ...counts.values())
    return list.map((d) => ({ d, n: counts.get(d), lit: counts.get(d) === 0 ? 0 : Math.max(1, Math.round((counts.get(d) / max) * ROWS)) }))
  }, [events])
  const week = days.reduce((a, b) => a + b.n, 0)
  const letter = (d) =>
    new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))).toLocaleDateString(undefined, { weekday: 'narrow' })

  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-display text-[44px] leading-[0.9]">{week}</p>
        <p className="text-footnote text-label-2 mt-1.5">{week === 1 ? 'review' : 'reviews'} · {streak}-day streak</p>
      </div>
      <div className="flex items-end gap-[9px]">
        {days.map((x, i) => (
          <div key={x.d} className="flex flex-col items-center gap-[5px]">
            {Array.from({ length: ROWS }).map((_, r) => {
              const on = ROWS - r <= x.lit
              return (
                <motion.span
                  key={r}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 + (ROWS - r) * 0.02 }}
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: on ? 'var(--label)' : 'var(--fill-2)' }}
                />
              )
            })}
            <span className={`text-[10px] mt-1 ${i === 6 ? 'text-label font-medium' : 'text-label-3'}`}>{letter(x.d)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodayPage({ cadence, actions, profile, onOpenChapter, onAdd, onOpenInsights, onOpenFocus, account }) {
  const { overdue, dueToday, chapters, events, streak, subjectMap } = cadence
  const timer = useTimer()
  const [showGoal, setShowGoal] = useState(false)

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
  const suggestions = useMemo(() => recommendChapters(chapters), [chapters])
  const nextEstimate = suggestions[0] ? estimateChapterMinutes(suggestions[0].id, cadence.focusSessions) : null
  const goalMinutes = cadence.prefs.weeklyFocusGoalMinutes
  const showFocusTimer = cadence.prefs.showFocusTimer !== false
  const weeklyStats = useMemo(() => weeklyFocusStats(cadence.focusSessions, cadence.pomodoroLog), [cadence.focusSessions, cadence.pomodoroLog])
  const eyebrow = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  const rowProps = (c) => ({
    chapter: c,
    subject: subjectMap.get(c.subjectId),
    onOpen: onOpenChapter,
    onRevise: actions.revise,
    onSnooze: actions.snooze,
    onLocked: actions.locked,
  })

  const hero = <TodayHero name={profile?.name} done={doneToday} remaining={remaining} overdue={overdue.length} />

  const coach = (
    <motion.section {...stagger(1)} className="relative overflow-hidden rounded-[28px] bg-card p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-label/[0.045] blur-3xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill"><Sparkles size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-label-2">Study coach · next up</p>
          {suggestions.length ? (
            <>
              <h2 className="mt-2 text-title-2 font-medium leading-tight">{suggestions[0].title}</h2>
              <p className="mt-1 text-subhead text-label-2">{suggestions[0].coachReason}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote text-label-2">
                <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {nextEstimate.label} · {formatMinutes(nextEstimate.minutes)}</span>
                <span>{subjectMap.get(suggestions[0].subjectId)?.name}</span>
              </div>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  if (!showFocusTimer) onOpenChapter(suggestions[0])
                  else if (timer.status === 'idle') {
                    timer.startForChapter(suggestions[0].id)
                    onOpenFocus?.()
                  } else onOpenFocus?.()
                }}
              >
                {!showFocusTimer ? <>View chapter <ArrowRight size={15} /></> : timer.status === 'idle' ? <>Start focus <ArrowRight size={15} /></> : <>Open focus <ArrowRight size={15} /></>}
              </Button>
            </>
          ) : chapters.length ? (
            <>
              <h2 className="mt-2 text-title-2 font-medium">Everything mastered.</h2>
              <p className="mt-1 text-subhead text-label-2">Add a new chapter when you study something fresh.</p>
              <Button size="sm" className="mt-4" onClick={onAdd}><Plus size={15} /> Add chapter</Button>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-title-2 font-medium">Start with one chapter.</h2>
              <p className="mt-1 text-subhead text-label-2">Your next review will be ready when you are.</p>
              <Button size="sm" className="mt-4" onClick={onAdd}><Plus size={15} /> Add chapter</Button>
            </>
          )}
        </div>
      </div>
      <div className="relative mt-5 border-t border-separator pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-footnote text-label-2"><Target size={15} /> Weekly focus</div>
          <button type="button" className="min-h-9 rounded-full px-3 text-footnote font-medium hover:bg-fill" onClick={() => setShowGoal(true)}>
            {goalMinutes ? 'Edit goal' : 'Set a goal'}
          </button>
        </div>
        {goalMinutes ? (
          <>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p className="text-body font-medium">{formatMinutes(weeklyStats.minutes)} <span className="text-label-2 font-normal">of {formatMinutes(goalMinutes)}</span></p>
              <span className="text-footnote text-label-2">{Math.min(100, Math.round((weeklyStats.minutes / goalMinutes) * 100))}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-fill-2" role="progressbar" aria-label="Weekly focus goal" aria-valuemin={0} aria-valuemax={goalMinutes} aria-valuenow={Math.min(weeklyStats.minutes, goalMinutes)}>
              <motion.div className="h-full rounded-full bg-label" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (weeklyStats.minutes / goalMinutes) * 100)}%` }} transition={spring} />
            </div>
          </>
        ) : <p className="mt-1 text-footnote text-label-2">Choose a weekly target; completed Focus time adds up here.</p>}
      </div>
    </motion.section>
  )

  const comingUp = upcoming.length > 0 && (
    <Section prominent title="Coming up">
      {upcoming.slice(0, 3).map((c) => {
        const subject = subjectMap.get(c.subjectId)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpenChapter(c)}
            style={{ '--inset': '16px' }}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[58px] text-left active:bg-fill transition-colors duration-75"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-body truncate">{c.title}</span>
              <span className="block text-footnote text-label-2 truncate">
                {subject?.name} · {reviewLabel(c)}
              </span>
            </span>
            <span className="shrink-0 text-footnote text-label-2">{shortWhen(c)}</span>
          </button>
        )
      })}
    </Section>
  )

  const insights = chapters.length > 0 && (
    <Section prominent title="This week">
      <button type="button" onClick={onOpenInsights} className="w-full text-left p-5 active:bg-fill transition-colors duration-75">
        <WeekDots events={events} streak={streak.count} />
      </button>
    </Section>
  )

  return (
    <Page title="Today" eyebrow={eyebrow} trailing={account} wide>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:items-start">
        <div className="space-y-8 min-w-0">
          <div className="lg:hidden">{hero}</div>

          {coach}

          <AnimatePresence initial={false}>
            {overdue.length > 0 && (
              <motion.div key="overdue" {...stagger(1)} exit={{ opacity: 0, height: 0 }}>
                <Section prominent title="Overdue">
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
                <Section prominent title="Due today">
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
            <motion.div {...stagger(1)} className="bg-card rounded-[28px] px-6 py-10 text-center">
              <h2 className="text-title-2 font-medium">
                {chapters.length === 0 ? 'Log your first chapter.' : 'Nothing else due today.'}
              </h2>
              <p className="text-subhead text-label-2 mt-2 max-w-[320px] mx-auto">
                {chapters.length === 0
                  ? 'Add what you studied today. Five reviews get scheduled — 1, 3, 7, 15 and 30 days apart.'
                  : 'Studied something new? Log it so its reviews start tomorrow.'}
              </p>
              <Button size="md" className="mt-6" onClick={onAdd}>
                <Plus size={17} strokeWidth={2.2} /> Add chapter
              </Button>
            </motion.div>
          )}

          <motion.div {...stagger(3)} className="lg:hidden space-y-8">
            {comingUp}
            {insights}
          </motion.div>
        </div>

        <motion.aside {...stagger(1)} className="hidden lg:block space-y-8 sticky top-[76px]">
          {hero}
          {insights}
          {comingUp}
        </motion.aside>
      </div>
      <AnimatePresence>{showGoal && <WeeklyGoalSheet key="weekly-goal" value={goalMinutes} onClose={() => setShowGoal(false)} onSave={(minutes) => { cadence.updatePrefs({ weeklyFocusGoalMinutes: minutes }); setShowGoal(false) }} />}</AnimatePresence>
    </Page>
  )
}
