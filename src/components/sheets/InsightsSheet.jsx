import { useMemo } from 'react'
import Sheet from '../ui/Sheet'
import Page from '../ui/Page'
import { Section } from '../ui/List'
import Heatmap from '../insights/Heatmap'
import { StrengthMeter } from '../chapter/ChapterRow'
import { formatMinutes, weeklyFocusStats } from '../../lib/studyCoach'
import { memoryMap } from '../../lib/memory'

// A figure in the row along the top: label, then the number at regular
// weight. Missing values print as a dash.
function Figure({ label, value, note }) {
  return (
    <div className="px-5 py-4 min-w-0">
      <p className="text-footnote text-label-2 truncate">{label}</p>
      <p className="mt-1 font-display text-[28px] leading-[32px] tabular">{value ?? '—'}</p>
      {note && <p className="text-footnote text-label-2 truncate">{note}</p>}
    </div>
  )
}

// How the work is adding up: the streak and totals, sixteen weeks of reviews,
// memory by subject and the chapters slipping furthest.
export default function InsightsSheet({ cadence, onClose, onOpenChapter, asPage = false, account }) {
  const { subjects, chapters, events, streak, focusSessions, pomodoroLog } = cadence
  const showFocusTimer = cadence.prefs.showFocusTimer !== false

  const totals = useMemo(() => {
    const completed = events.filter((e) => e.action === 'completed').length
    const struggled = events.filter((e) => e.action === 'struggled').length
    const mastered = chapters.filter((c) => c.status === 'mastered').length
    return {
      completed,
      struggled,
      mastered,
      recall: completed + struggled === 0 ? null : Math.round((completed / (completed + struggled)) * 100),
    }
  }, [events, chapters])

  const groups = useMemo(() => memoryMap(chapters, subjects, events), [chapters, subjects, events])
  const weakest = useMemo(
    () =>
      groups
        .flatMap((g) => g.items.map((i) => ({ ...i, subject: g.subject })))
        .filter((i) => i.chapter.status !== 'mastered')
        .sort((a, b) => a.value - b.value)
        .slice(0, 5),
    [groups]
  )
  const focusWeek = useMemo(() => weeklyFocusStats(focusSessions, pomodoroLog), [focusSessions, pomodoroLog])

  const content = (
    <div className="space-y-8">
      {/* 1px gaps over the separator colour draw the rules between figures. */}
      <div className={`rounded-cell overflow-hidden grid gap-px bg-separator border border-separator grid-cols-2 ${showFocusTimer ? 'md:grid-cols-5' : 'md:grid-cols-4'} [&>*]:bg-card`}>
        <Figure label="Day streak" value={streak.count} note={streak.count ? 'days in a row' : 'review today to start one'} />
        <Figure label="Reviews done" value={totals.completed} note="all time" />
        <Figure label="Mastered" value={totals.mastered} note={`of ${chapters.length} chapters`} />
        <Figure
          label="Remembered on review"
          value={totals.recall == null ? null : `${totals.recall}%`}
          note={totals.recall == null ? 'no reviews yet' : `${totals.struggled} marked hard`}
        />
        {showFocusTimer && (
          <div className="col-span-2 md:col-span-1">
            <Figure label="Focus this week" value={formatMinutes(focusWeek.minutes)} note={`${focusWeek.sessions} sessions`} />
          </div>
        )}
      </div>

      <section>
        <h2 className="text-subhead font-medium px-0.5 mb-2.5">Reviews by day</h2>
        <div className="bg-card rounded-cell p-5">
          <Heatmap events={events} weeks={asPage ? 52 : 26} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <Section prominent title="Memory by subject">
          {groups.length === 0 && <p className="px-4 py-4 text-subhead text-label-2">Add a chapter to see your subjects here.</p>}
          {groups.map((g) => {
            const mastered = g.items.filter((i) => i.chapter.status === 'mastered').length
            return (
              <div key={g.subject.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-body truncate">{g.subject.name}</span>
                  <span className="text-subhead tabular shrink-0">{Math.round(g.average * 100)}%</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-fill-2 overflow-hidden">
                    <div className="h-full rounded-full bg-data" style={{ width: `${Math.max(2, g.average * 100)}%` }} />
                  </div>
                  <span className="w-[92px] shrink-0 text-right text-footnote text-label-2 tabular">
                    {mastered}/{g.items.length} mastered
                  </span>
                </div>
              </div>
            )
          })}
        </Section>

        <Section prominent title="Slipping furthest">
          {weakest.length === 0 && <p className="px-4 py-4 text-subhead text-label-2">Nothing to catch up on.</p>}
          {weakest.map(({ chapter, value, subject }) => (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onOpenChapter?.(chapter)}
              className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[52px] text-left hover:bg-fill"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-body truncate">{chapter.title}</span>
                <span className="block text-footnote text-label-2 truncate">{subject.name}</span>
              </span>
              <StrengthMeter value={value} className="!block" />
              <span className="w-10 shrink-0 text-right text-subhead tabular">{Math.round(value * 100)}%</span>
            </button>
          ))}
        </Section>
      </div>

      <p className="text-footnote text-label-2 px-0.5">
        Memory is an estimate: recall halves over the gap the schedule gives each review (1, 3, 7, 15 and 30 days), so a
        chapter sits near 50% on the day it's due.
      </p>
    </div>
  )

  if (asPage) return <Page title="Insights" subtitle={`${totals.completed} review${totals.completed === 1 ? '' : 's'} done, ${totals.mastered} chapter${totals.mastered === 1 ? '' : 's'} mastered.`} trailing={account} wide>{content}</Page>
  return <Sheet title="Insights" onClose={onClose} size="lg" trailing={null}>{content}</Sheet>
}
