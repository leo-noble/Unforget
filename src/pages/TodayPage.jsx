import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ArrowUpRight } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import ChapterRow from '../components/chapter/ChapterRow'
import { toISODate, addDays } from '../lib/srs'
import { greeting, plural, todayISO } from '../lib/format'
import { subjectColor } from '../lib/colors'
import { reviewLabel, shortWhen } from '../components/chapter/meta'
import { spring, easeOut } from '../components/ui/motion'
import { useMediaQuery } from '../components/ui/useMediaQuery'

const stagger = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: easeOut, delay: 0.03 + i * 0.05 },
})

const pad = (n) => String(n).padStart(2, '0')

// The hero, as a widget: the count left to review in big dot-matrix digits,
// and one dot per review today — filled as you clear them. The whole daily
// goal is "fill the row".
function TodayHero({ name, done, remaining, streak, overdue }) {
  const total = done + remaining
  const allClear = remaining === 0
  const first = name ? name.split(' ')[0] : ''
  const dots = Math.min(total, 16)
  const filled = total === 0 ? 0 : Math.round((done / total) * dots)

  let line
  if (total === 0) line = 'Nothing scheduled today.'
  else if (allClear) line = `All ${plural(done, 'review')} done.`
  else if (overdue > 0) line = `${overdue} overdue — start there.`
  else line = `${plural(done, 'review')} done so far.`

  return (
    <motion.div {...stagger(0)} className="relative overflow-hidden bg-card rounded-[28px] p-5">
      <div aria-hidden="true" className="dot-grid dot-grid-fade absolute -right-10 -top-10 h-56 w-56 opacity-70" />
      <div className="relative flex items-start justify-between">
        <span className="eyebrow text-label-2">{allClear && total > 0 ? 'Done for today' : 'To review'}</span>
        <span className="eyebrow text-label flex items-center gap-1.5">
          <span className={`h-[6px] w-[6px] rounded-full ${streak > 0 ? 'bg-red' : 'bg-label-3'}`} />
          {pad(streak)} day streak
        </span>
      </div>

      <div className="relative mt-3 flex items-end gap-3">
        <motion.span
          key={remaining}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="font-display text-[96px] leading-[0.82] tabular"
        >
          {pad(remaining)}
        </motion.span>
        <span className="pb-1.5 text-subhead text-label-2">
          {first ? `${greeting()}, ${first}.` : `${greeting()}.`}
          <br />
          {line}
        </span>
      </div>

      {dots > 0 && (
        <div className="relative mt-5 flex flex-wrap gap-[7px]" aria-label={`${done} of ${total} reviews done`} role="img">
          {Array.from({ length: dots }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring, delay: 0.15 + i * 0.03 }}
              className="h-[11px] w-[11px] rounded-full"
              style={{
                background: i < filled ? 'var(--label)' : 'transparent',
                boxShadow: i < filled ? 'none' : `inset 0 0 0 1.5px ${i < filled + overdue && !allClear ? 'var(--red)' : 'var(--label-3)'}`,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// Last seven days as columns of dots — a dot-matrix bar chart.
function WeekDots({ events }) {
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
        <p className="font-display text-[56px] leading-[0.85] tabular">{pad(week)}</p>
        <p className="eyebrow text-label-2 mt-2">Reviews · 7 days</p>
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
                  style={{ background: on ? (i === 6 ? 'var(--red)' : 'var(--label)') : 'var(--fill-2)' }}
                />
              )
            })}
            <span className={`font-mono text-[9px] mt-1 ${i === 6 ? 'text-label' : 'text-label-3'}`}>{letter(x.d)}</span>
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
  const eyebrow = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

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
      <div className="space-y-8">
        <TodayHero name={profile?.name} done={doneToday} remaining={remaining} streak={streak.count} overdue={overdue.length} />

        <AnimatePresence initial={false}>
          {overdue.length > 0 && (
            <motion.div key="overdue" {...stagger(1)} exit={{ opacity: 0, height: 0 }}>
              <Section
                prominent
                title={
                  <span className="flex items-center gap-2 text-red">
                    <span className="h-[6px] w-[6px] rounded-full bg-red pulse-dot" />
                    Overdue · {pad(overdue.length)}
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
                title={`Due today · ${pad(dueToday.length)}`}
                action={coarse ? <span className="eyebrow text-label-3">Swipe → done</span> : null}
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
          <motion.div {...stagger(1)} className="relative overflow-hidden bg-card rounded-[28px] px-6 py-9 text-center">
            <div aria-hidden="true" className="dot-grid dot-grid-fade absolute inset-0 opacity-60" />
            <div className="relative">
              <p className="eyebrow text-label-2">{chapters.length === 0 ? 'Get started' : 'All clear'}</p>
              <h2 className="text-title-2 font-medium mt-3">
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
            </div>
          </motion.div>
        )}

        {upcoming.length > 0 && (
          <motion.div {...stagger(3)}>
            <Section prominent title="Coming up">
              {upcoming.map((c) => {
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
                        <span
                          className="inline-block h-[6px] w-[6px] rounded-full align-[1px] mr-1.5"
                          style={{ background: subjectColor(subject?.colorTag) }}
                        />
                        {subject?.name} · {reviewLabel(c)}
                      </span>
                    </span>
                    <span className="shrink-0 text-footnote text-label-2">{shortWhen(c)}</span>
                  </button>
                )
              })}
            </Section>
          </motion.div>
        )}

        {chapters.length > 0 && (
          <motion.div {...stagger(4)}>
            <Section
              prominent
              title="Insights"
              action={
                <button type="button" onClick={onOpenInsights} className="eyebrow text-label-2 flex items-center gap-1 hover:text-label">
                  All <ArrowUpRight size={13} />
                </button>
              }
            >
              <button type="button" onClick={onOpenInsights} className="w-full text-left p-5 active:bg-fill transition-colors duration-75">
                <WeekDots events={events} />
              </button>
            </Section>
          </motion.div>
        )}
      </div>
    </Page>
  )
}
