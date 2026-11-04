import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import ChapterRow from '../components/chapter/ChapterRow'
import QuickAdd from '../components/chapter/QuickAdd'
import { todayISO } from '../lib/format'
import { shortWhen } from '../components/chapter/meta'
import { useListKeys } from '../lib/useShortcuts'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const GUIDE_KEY = 'unforget.guideDismissed'
const guideDismissed = () => {
  try {
    return localStorage.getItem(GUIDE_KEY) === '1'
  } catch {
    return false
  }
}

// Today, kept to one column like a to-do list: log what you studied, tick
// what's due, glance at what's next. Figures and the memory map live in
// Insights and Library.
export default function TodayPage({ cadence, actions, onOpenChapter, onOpenGuide, account }) {
  const { overdue, dueToday, chapters, subjects, events, subjectMap } = cadence
  const [showGuideCard, setShowGuideCard] = useState(() => !guideDismissed())

  function dismissGuide() {
    setShowGuideCard(false)
    try {
      localStorage.setItem(GUIDE_KEY, '1')
    } catch {
      // best-effort
    }
  }

  const doneToday = useMemo(() => {
    const t = todayISO()
    return events.filter((e) => (e.action === 'completed' || e.action === 'skipped_ahead') && e.completedDate === t).length
  }, [events])

  const upcoming = useMemo(
    () =>
      chapters
        .filter((c) => c.derivedStatus === 'upcoming')
        .sort((a, b) => (a.nextReviewDate < b.nextReviewDate ? -1 : a.nextReviewDate > b.nextReviewDate ? 1 : 0))
        .slice(0, 3),
    [chapters]
  )

  // Overdue first, then the rest of today: one list to clear.
  const queue = useMemo(() => [...overdue, ...dueToday], [overdue, dueToday])
  const selectedId = useListKeys(queue, { onOpen: onOpenChapter, onRevise: actions.revise, onSnooze: actions.snooze })
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  let subtitle = 'Log what you studied and Unforget brings it back to review.'
  if (chapters.length) {
    if (queue.length) subtitle = `${plural(queue.length, 'review')} left${doneToday ? ` · ${doneToday} done` : ''}`
    else if (doneToday) subtitle = `All done. ${plural(doneToday, 'review')} cleared today.`
    else subtitle = 'Nothing due today.'
  }

  return (
    <Page title="Today" meta={date} subtitle={subtitle} trailing={account}>
      {showGuideCard && (
        <div className="mb-5 flex items-start gap-3 rounded-cell bg-card px-5 py-4 shadow-[inset_0_0_0_1px_var(--separator)]">
          <p className="min-w-0 flex-1 text-subhead text-label-2">
            <span className="text-label font-medium">New here?</span> Unforget brings what you study back 5 times over 8 weeks so it sticks.{' '}
            <button type="button" onClick={onOpenGuide} className="text-label underline underline-offset-2">How it works</button>
          </p>
          <button type="button" onClick={dismissGuide} aria-label="Dismiss" className="h-7 w-7 -mr-2 -mt-0.5 shrink-0 rounded-full flex items-center justify-center text-label-3 hover:text-label hover:bg-fill">
            <X size={15} />
          </button>
        </div>
      )}

      <QuickAdd subjects={subjects} onCreateSubject={cadence.createSubject} onCreateChapter={cadence.createChapter} className="mb-6" />

      {queue.length > 0 ? (
        <Section>
          <AnimatePresence initial={false}>
            {queue.map((c) => (
              <ChapterRow
                key={c.id}
                chapter={c}
                subject={subjectMap.get(c.subjectId)}
                onOpen={onOpenChapter}
                onRevise={actions.revise}
                onSnooze={actions.snooze}
                onLocked={actions.locked}
                selected={c.id === selectedId}
              />
            ))}
          </AnimatePresence>
        </Section>
      ) : (
        <p className="py-8 text-center text-subhead text-label-2">
          {chapters.length ? 'You’re all caught up.' : 'Your reviews will show up here.'}
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="text-footnote text-label-2 px-0.5 mb-1">Coming up</h2>
          <div>
            {upcoming.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpenChapter(c)}
                className="w-full flex items-center gap-3 px-0.5 py-2 text-left hover:opacity-80"
              >
                <span className="min-w-0 flex-1 truncate text-subhead text-label-2">
                  {c.title}
                  <span className="text-label-3"> · {subjectMap.get(c.subjectId)?.name}</span>
                </span>
                <span className="shrink-0 text-footnote text-label-3 tabular">{shortWhen(c)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}
