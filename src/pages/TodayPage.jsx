import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock3, Flame, Plus, Sparkles, Target } from 'lucide-react'
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
import StreakSheet from '../components/sheets/StreakSheet'

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
    <motion.div {...stagger(0)} className="bg-card rounded-[28px] p-6 lg:min-h-[210px] lg:flex lg:flex-col lg:justify-center">
      <div className="min-w-0">
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
      </div>
      {dots > 0 && (
        <div className="mt-5 flex max-w-full flex-wrap justify-start gap-[7px]" aria-label={`${done} of ${total} reviews done`} role="img">
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
function WeekDots({ events, streak = 0, onOpenStreak, onOpenInsights }) {
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
        <p className="text-footnote text-label-2 mt-1.5">{week === 1 ? 'review' : 'reviews'}</p>
        <button type="button" onClick={onOpenStreak} className="mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-full pr-2 text-footnote text-label-2 hover:text-label hover:bg-fill" aria-label={`Open study streak: ${streak} days`}>
          <Flame size={13} className="text-label-3" /> {streak}-day streak
        </button>
      </div>
      <button type="button" onClick={onOpenInsights} className="flex items-end gap-[9px] rounded-2xl px-2 py-1 hover:bg-fill" aria-label="Open review activity insights">
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
      </button>
    </div>
  )
}

export default function TodayPage({ cadence, actions, profile, onOpenChapter, onAdd, onOpenInsights, onOpenFocus, account }) {
  const { overdue, dueToday, chapters, events, streak, subjectMap } = cadence
  const timer = useTimer()
  const [showGoal, setShowGoal] = useState(false)
  const [showStreak, setShowStreak] = useState(false)

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
  const showFocusTimer = cadence.prefs.showFocusTimer !== false
  const suggestions = useMemo(() => recommendChapters(chapters), [chapters])
  const nextEstimate = showFocusTimer && suggestions[0] ? estimateChapterMinutes(suggestions[0].id, cadence.focusSessions) : null
  const queue = useMemo(() => suggestions.map((chapter) => ({
    chapter,
    estimate: showFocusTimer ? estimateChapterMinutes(chapter.id, cadence.focusSessions) : null,
  })), [suggestions, cadence.focusSessions, showFocusTimer])
  const queueMinutes = queue.reduce((total, item) => total + (item.estimate?.minutes || 0), 0)
  const goalMinutes = cadence.prefs.weeklyFocusGoalMinutes
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
    <motion.section {...stagger(1)} className="relative overflow-hidden rounded-[28px] bg-card p-5 sm:p-6 lg:min-h-[210px] lg:flex lg:items-center">
      <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-label/[0.045] blur-3xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill"><Sparkles size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-label-2">{suggestions.length > 1 ? `Study queue · ${suggestions.length} chapters${showFocusTimer ? ` · ~${formatMinutes(queueMinutes)}` : ''}` : 'Study coach · next up'}</p>
          {suggestions.length ? (
            <>
              <h2 className="mt-2 text-title-2 font-medium leading-tight">{suggestions[0].title}</h2>
              <p className="mt-1 text-subhead text-label-2">{suggestions[0].coachReason}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote text-label-2">
                {nextEstimate && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {nextEstimate.label} · {formatMinutes(nextEstimate.minutes)}</span>}
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
              {suggestions.length > 1 && (
                <div className="mt-4 border-t border-separator pt-3">
                  <p className="eyebrow text-label-3 mb-1">UP NEXT</p>
                  {queue.slice(1).map(({ chapter, estimate }) => (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => {
                        if (timer.status === 'idle' && showFocusTimer) {
                          timer.startForChapter(chapter.id)
                          onOpenFocus?.()
                        } else if (!showFocusTimer) onOpenChapter(chapter)
                        else onOpenFocus?.()
                      }}
                      className="w-full flex items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-fill transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-body truncate">{chapter.title}</span>
                        <span className="block text-footnote text-label-2 truncate">{chapter.coachReason}{estimate ? ` · ${estimate.label}: ${formatMinutes(estimate.minutes)}` : ''}</span>
                      </span>
                      <ArrowRight size={15} className="shrink-0 text-label-2" />
                    </button>
                  ))}
                </div>
              )}
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
    </motion.section>
  )

  const comingUp = upcoming.length > 0 && (
    <Section prominent title="Coming up" className="lg:col-span-2">
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

  const insights = (
    <Section prominent title="This week" className="lg:col-span-2">
      <div className="p-5">
        <WeekDots events={events} streak={streak.count} onOpenStreak={() => setShowStreak(true)} onOpenInsights={onOpenInsights} />
        {showFocusTimer && <div className="mt-4 border-t border-separator pt-3">
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
        </div>}
      </div>
    </Section>
  )

  return (
    <Page title="Today" eyebrow={eyebrow} trailing={account} wide>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {hero}
        {coach}
        {(overdue.length > 0 || dueToday.length > 0) && (
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence initial={false}>
              {overdue.length > 0 && (
                <motion.div key="overdue" {...stagger(1)} exit={{ opacity: 0, height: 0 }}>
                  <Section prominent title="Overdue">
                    <AnimatePresence initial={false}>
                      {overdue.map((c) => <ChapterRow key={c.id} {...rowProps(c)} />)}
                    </AnimatePresence>
                  </Section>
                </motion.div>
              )}
              {dueToday.length > 0 && (
                <motion.div key="due" {...stagger(2)} exit={{ opacity: 0, height: 0 }}>
                  <Section prominent title="Due today">
                    <AnimatePresence initial={false}>
                      {dueToday.map((c) => <ChapterRow key={c.id} {...rowProps(c)} />)}
                    </AnimatePresence>
                  </Section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {insights}
        {comingUp}
      </div>
      <AnimatePresence>
        {showFocusTimer && showGoal && <WeeklyGoalSheet key="weekly-goal" value={goalMinutes} onClose={() => setShowGoal(false)} onSave={(minutes) => { cadence.updatePrefs({ weeklyFocusGoalMinutes: minutes }); setShowGoal(false) }} />}
        {showStreak && <StreakSheet key="streak-sheet" streak={streak} onClose={() => setShowStreak(false)} />}
      </AnimatePresence>
    </Page>
  )
}
