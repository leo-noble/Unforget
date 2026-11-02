import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowRight, Plus } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import ChapterRow, { StrengthMeter } from '../components/chapter/ChapterRow'
import MemoryMap, { MemoryLegend } from '../components/insights/MemoryMap'
import { todayISO } from '../lib/format'
import { reviewLabel, shortWhen } from '../components/chapter/meta'
import { useTimer } from '../lib/TimerContext'
import { estimateChapterMinutes, formatMinutes, recommendChapters, weeklyFocusStats } from '../lib/studyCoach'
import { memoryMap, weakestSubject } from '../lib/memory'
import { useListKeys } from '../lib/useShortcuts'
import WeeklyGoalSheet from '../components/sheets/WeeklyGoalSheet'
import StreakSheet from '../components/sheets/StreakSheet'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// The one line under the title: the fact in today's data that most needs
// attention, in words.
function finding({ overdue, remaining, done, weakest }) {
  const fading = weakest && weakest.average < 0.6 ? `${weakest.subject.name} is fading fastest, at ${Math.round(weakest.average * 100)}%.` : ''
  if (overdue > 0) return `${plural(overdue, 'review')} overdue. ${fading || 'Clear those first.'}`
  if (remaining > 0) return `${plural(remaining, 'review')} due today. ${fading}`
  if (done > 0) return `All ${plural(done, 'review')} done for today. ${fading}`
  return fading || 'Nothing due today.'
}

// A labelled figure: the number at regular weight, its unit and context in grey.
function Figure({ label, value, unit, note, children }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <p className="text-footnote text-label-2">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-[30px] leading-[34px] tabular">{value}</span>
        {unit && <span className="text-subhead text-label-2">{unit}</span>}
      </p>
      {note && <div className="mt-0.5 text-footnote text-label-2">{note}</div>}
      {children}
    </div>
  )
}

export default function TodayPage({ cadence, actions, onOpenChapter, onAdd, onOpenInsights, onOpenFocus, onOpenLibrary, account }) {
  const { overdue, dueToday, chapters, subjects, events, streak, subjectMap } = cadence
  const timer = useTimer()
  const [showGoal, setShowGoal] = useState(false)
  const [showStreak, setShowStreak] = useState(false)

  const doneToday = useMemo(() => {
    const t = todayISO()
    return events.filter((e) => (e.action === 'completed' || e.action === 'skipped_ahead') && e.completedDate === t).length
  }, [events])

  const groups = useMemo(() => memoryMap(chapters, subjects, events), [chapters, subjects, events])
  const strength = useMemo(() => new Map(groups.flatMap((g) => g.items.map((i) => [i.chapter.id, i.value]))), [groups])
  const weakest = weakestSubject(groups)

  const upcoming = useMemo(
    () =>
      chapters
        .filter((c) => c.derivedStatus === 'upcoming')
        .sort((a, b) => (a.nextReviewDate < b.nextReviewDate ? -1 : a.nextReviewDate > b.nextReviewDate ? 1 : 0))
        .slice(0, 4),
    [chapters]
  )

  const queue = useMemo(() => [...overdue, ...dueToday], [overdue, dueToday])
  const selectedId = useListKeys(queue, { onOpen: onOpenChapter, onRevise: actions.revise, onSnooze: actions.snooze })
  const remaining = queue.length
  const showFocusTimer = cadence.prefs.showFocusTimer !== false
  const next = useMemo(() => recommendChapters(chapters)[0], [chapters])
  const nextEstimate = showFocusTimer && next ? estimateChapterMinutes(next.id, cadence.focusSessions) : null
  const goalMinutes = cadence.prefs.weeklyFocusGoalMinutes
  const weeklyStats = useMemo(() => weeklyFocusStats(cadence.focusSessions, cadence.pomodoroLog), [cadence.focusSessions, cadence.pomodoroLog])
  const weekReviews = useMemo(() => {
    const from = weeklyStats.startDate
    return events.filter((e) => e.action === 'completed' && e.completedDate >= from).length
  }, [events, weeklyStats.startDate])
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  function startNext() {
    if (!next) return onAdd()
    if (!showFocusTimer) return onOpenChapter(next)
    if (timer.status === 'idle') timer.startForChapter(next.id)
    onOpenFocus?.()
  }

  const rowProps = (c) => ({
    chapter: c,
    subject: subjectMap.get(c.subjectId),
    onOpen: onOpenChapter,
    onRevise: actions.revise,
    onSnooze: actions.snooze,
    onLocked: actions.locked,
    strength: strength.get(c.id),
    selected: c.id === selectedId,
  })

  const primary = chapters.length === 0 ? (
    <Button size="md" onClick={onAdd}><Plus size={15} /> Add chapter</Button>
  ) : next ? (
    <Button size="md" onClick={startNext}>
      {!showFocusTimer ? 'Open next' : timer.status === 'idle' ? 'Start review' : 'Open focus'} <ArrowRight size={15} />
    </Button>
  ) : null

  return (
    <Page
      title="Today"
      meta={date}
      subtitle={chapters.length ? finding({ overdue: overdue.length, remaining, done: doneToday, weakest }) : 'Log what you studied today and Unforget schedules the reviews.'}
      trailing={account}
      titleAccessory={<div className="hidden sm:block shrink-0">{primary}</div>}
      wide
    >
      <div className="sm:hidden mb-6">{primary && <div className="[&>button]:w-full">{primary}</div>}</div>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-12">
        {/* The queue: what to review right now. */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {overdue.length > 0 && (
            <Section prominent title={`Overdue · ${overdue.length}`}>
              <AnimatePresence initial={false}>
                {overdue.map((c) => <ChapterRow key={c.id} {...rowProps(c)} />)}
              </AnimatePresence>
            </Section>
          )}
          {dueToday.length > 0 && (
            <Section prominent title={`Due today · ${dueToday.length}`}>
              <AnimatePresence initial={false}>
                {dueToday.map((c) => <ChapterRow key={c.id} {...rowProps(c)} />)}
              </AnimatePresence>
            </Section>
          )}
          {remaining === 0 && (
            <Section prominent title="Queue">
              <div className="px-4 py-5">
                <p className="text-body">{chapters.length ? 'Nothing left to review today.' : 'No chapters yet.'}</p>
                <p className="text-footnote text-label-2 mt-0.5">
                  {upcoming[0]
                    ? `Next up: ${upcoming[0].title}, ${shortWhen(upcoming[0]).toLowerCase()}.`
                    : chapters.length
                      ? 'Every chapter is mastered. Add a new one when you study something fresh.'
                      : 'Add the first chapter you studied and its five reviews are planned for you.'}
                </p>
              </div>
            </Section>
          )}
          {upcoming.length > 0 && (
            <Section prominent title="Coming up">
              {upcoming.map((c) => {
                const subject = subjectMap.get(c.subjectId)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenChapter(c)}
                    style={{ '--inset': '16px' }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[52px] text-left hover:bg-fill active:bg-fill transition-colors duration-75"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-body truncate">{c.title}</span>
                      <span className="block text-footnote text-label-2 truncate">{subject?.name} · {reviewLabel(c)}</span>
                    </span>
                    {strength.has(c.id) && <StrengthMeter value={strength.get(c.id)} />}
                    <span className="shrink-0 w-[68px] text-right text-footnote text-label-2 tabular">{shortWhen(c)}</span>
                  </button>
                )
              })}
            </Section>
          )}
        </div>

        {/* Beside it: today's figures, then the memory map. */}
        <aside className="lg:col-span-4 min-w-0 space-y-8">
          <div>
          <div className="flex items-center justify-between gap-4 px-0.5 mb-2.5 min-h-6">
            <h2 className="text-subhead font-medium">At a glance</h2>
            <button type="button" onClick={onOpenInsights} className="text-footnote text-label-2 hover:text-label">Insights</button>
          </div>
          <div className="bg-card rounded-cell px-5 py-5 divide-y divide-separator">
            <Figure
              label="Left today"
              value={remaining}
              unit={remaining === 1 ? 'review' : 'reviews'}
              note={`${doneToday} done${overdue.length ? ` · ${overdue.length} overdue` : ''}`}
            />
            <Figure
              label="This week"
              value={weekReviews}
              unit={weekReviews === 1 ? 'review' : 'reviews'}
              note={
                <button type="button" onClick={() => setShowStreak(true)} className="hover:text-label underline-offset-2 hover:underline">
                  {streak.count}-day streak
                </button>
              }
            />
            {showFocusTimer && (
              <Figure
                label="Focus this week"
                value={formatMinutes(weeklyStats.minutes)}
                note={
                  <button type="button" onClick={() => setShowGoal(true)} className="hover:text-label underline-offset-2 hover:underline">
                    {goalMinutes ? `of ${formatMinutes(goalMinutes)} goal · edit` : 'Set a weekly goal'}
                  </button>
                }
              >
                {goalMinutes ? (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-fill-2" role="progressbar" aria-label="Weekly focus goal" aria-valuemin={0} aria-valuemax={goalMinutes} aria-valuenow={Math.min(weeklyStats.minutes, goalMinutes)}>
                    <div className="h-full rounded-full bg-data transition-[width] duration-500" style={{ width: `${Math.min(100, (weeklyStats.minutes / goalMinutes) * 100)}%` }} />
                  </div>
                ) : null}
              </Figure>
            )}
            {next && (
              <div className="pt-4">
                <p className="text-footnote text-label-2">Next up</p>
                <button type="button" onClick={startNext} className="mt-1 w-full flex items-center gap-2 text-left group">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body truncate group-hover:underline underline-offset-2">{next.title}</span>
                    <span className="block text-footnote text-label-2 truncate">
                      {next.coachReason}
                      {nextEstimate ? ` · ~${formatMinutes(nextEstimate.minutes)}` : ''}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-label-2" />
                </button>
              </div>
            )}
          </div>
          </div>

          {groups.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-4 px-0.5 mb-2.5 min-h-6">
                <h2 className="text-subhead font-medium">Memory</h2>
                <button type="button" onClick={onOpenLibrary} className="text-footnote text-label-2 hover:text-label">View all</button>
              </div>
              <div className="bg-card rounded-cell p-5">
                <MemoryMap groups={groups} onOpen={onOpenChapter} compact stacked />
                <MemoryLegend className="mt-4 pt-3 border-t border-separator" />
              </div>
            </section>
          )}
        </aside>

      </div>

      <AnimatePresence>
        {showFocusTimer && showGoal && <WeeklyGoalSheet key="weekly-goal" value={goalMinutes} onClose={() => setShowGoal(false)} onSave={(minutes) => { cadence.updatePrefs({ weeklyFocusGoalMinutes: minutes }); setShowGoal(false) }} />}
        {showStreak && <StreakSheet key="streak-sheet" streak={streak} onClose={() => setShowStreak(false)} />}
      </AnimatePresence>
    </Page>
  )
}
