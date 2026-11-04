import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2, Plus, ArrowDownWideNarrow } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import ChapterRow from '../components/chapter/ChapterRow'
import MemoryMap, { MemoryLegend } from '../components/insights/MemoryMap'
import { useConfirm } from '../components/ui/Alert'
import { snappy } from '../components/ui/motion'
import { memoryMap, weakestSubject } from '../lib/memory'
import { useListKeys } from '../lib/useShortcuts'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due', label: 'Due' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'mastered', label: 'Mastered' },
]

const EMPTY = {
  overdue: 'Nothing overdue — you’re all caught up.',
  due: 'Nothing due today.',
  upcoming: 'Nothing upcoming yet.',
  mastered: 'Nothing mastered yet — keep going.',
}

export default function LibraryPage({ cadence, actions, onOpenChapter, onAdd, onSelectSubject, account }) {
  const { subjects: allSubjects, chapters: allChapters, events, subjectMap, removeSubject } = cadence
  // A subject picked in the sidebar (or the pills below) narrows the whole
  // page to it, like opening one project in a to-do app.
  const [params] = useSearchParams()
  const subjectId = params.get('subject')
  const focusSubject = subjectId ? subjectMap.get(subjectId) : null
  const subjects = useMemo(() => (focusSubject ? [focusSubject] : allSubjects), [focusSubject, allSubjects])
  const chapters = useMemo(() => (focusSubject ? allChapters.filter((c) => c.subjectId === focusSubject.id) : allChapters), [focusSubject, allChapters])
  const confirm = useConfirm()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('subject') // subject | memory

  const memory = useMemo(() => memoryMap(chapters, subjects, events), [chapters, subjects, events])
  const strength = useMemo(() => new Map(memory.flatMap((g) => g.items.map((i) => [i.chapter.id, i.value]))), [memory])
  const slipping = memory.flatMap((g) => g.items).filter((i) => i.chapter.status !== 'mastered' && i.band.id === 'slipping').length
  const weakest = weakestSubject(memory)

  const counts = useMemo(() => {
    const c = { all: chapters.length, overdue: 0, due: 0, upcoming: 0, mastered: 0 }
    chapters.forEach((ch) => {
      c[ch.derivedStatus] = (c[ch.derivedStatus] || 0) + 1
    })
    return c
  }, [chapters])

  const visible = useMemo(() => {
    return chapters.filter((c) => filter === 'all' || c.derivedStatus === filter)
  }, [chapters, filter])

  const groups = useMemo(() => {
    const map = new Map(subjects.map((s) => [s.id, []]))
    visible.forEach((c) => {
      if (!map.has(c.subjectId)) map.set(c.subjectId, [])
      map.get(c.subjectId).push(c)
    })
    return map
  }, [subjects, visible])

  const byMemory = useMemo(
    () => [...visible].sort((a, b) => (strength.get(a.id) ?? 1) - (strength.get(b.id) ?? 1)),
    [visible, strength]
  )

  // The order rows appear in on screen, for j / k.
  const ordered = useMemo(
    () => (sort === 'memory' ? byMemory : subjects.flatMap((s) => groups.get(s.id) || [])),
    [sort, byMemory, subjects, groups]
  )
  const selectedId = useListKeys(ordered, { onOpen: onOpenChapter, onRevise: actions.revise, onSnooze: actions.snooze })

  async function deleteSubject(subject, count) {
    const ok = await confirm({
      title: `Delete “${subject.name}”?`,
      message: count > 0 ? `Its ${count} chapter${count === 1 ? '' : 's'} and their reviews go with it.` : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeSubject(subject.id)
  }

  const row = (c, showSubject) => (
    <ChapterRow
      key={c.id}
      chapter={c}
      subject={subjectMap.get(c.subjectId)}
      showSubject={showSubject}
      onOpen={onOpenChapter}
      onRevise={actions.revise}
      onSnooze={actions.snooze}
      onLocked={actions.locked}
      selected={c.id === selectedId}
    />
  )

  let subtitle = 'Every chapter you log lands here, grouped by subject.'
  if (focusSubject) {
    const g = memory.find((m) => m.subject.id === focusSubject.id)
    const mastered = chapters.filter((c) => c.status === 'mastered').length
    subtitle = chapters.length ? `${mastered} of ${chapters.length} mastered${g ? ` · memory ${Math.round(g.average * 100)}%` : ''}` : 'No chapters yet.'
  } else if (chapters.length) {
    subtitle = slipping
      ? `${slipping} chapter${slipping === 1 ? ' is' : 's are'} slipping.${weakest ? ` ${weakest.subject.name} is weakest, at ${Math.round(weakest.average * 100)}%.` : ''}`
      : `Nothing is slipping.${weakest ? ` ${weakest.subject.name} is weakest, at ${Math.round(weakest.average * 100)}%.` : ''}`
  }

  return (
    <Page
      title={focusSubject ? focusSubject.name : 'Library'}
      meta={`${chapters.length} chapter${chapters.length === 1 ? '' : 's'}${focusSubject ? '' : ` · ${subjects.length} subject${subjects.length === 1 ? '' : 's'}`}`}
      subtitle={subtitle}
      trailing={account}
      titleAccessory={
        <Button size="md" variant="gray" onClick={onAdd} className="hidden sm:inline-flex">
          <Plus size={15} /> New chapter
        </Button>
      }
      wide
    >
      {allChapters.length === 0 ? (
        <div className="bg-card rounded-cell px-6 py-10">
          <h2 className="text-title-3 font-medium">Your library is empty</h2>
          <p className="text-subhead text-label-2 mt-1 max-w-[420px]">
            Log a chapter the day you study it. Its five reviews (day 1, 4, 11, 26 and 56) are planned for you, and it shows up here.
          </p>
          <Button className="mt-5" onClick={onAdd}>
            <Plus size={15} /> Add chapter
          </Button>
        </div>
      ) : (
        <>
          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto no-scrollbar mb-5">
            <div className="flex gap-2 w-max" role="radiogroup" aria-label="Subject">
              {[{ id: null, name: 'All subjects' }, ...allSubjects].map((s) => {
                const on = (s.id || null) === (focusSubject?.id || null)
                return (
                  <button
                    key={s.id || 'all'}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onSelectSubject?.(s.id)}
                    className={`h-9 px-4 rounded-full text-subhead whitespace-nowrap transition-colors ${
                      on ? 'tint-fill text-tint-fg' : 'bg-card text-label-2 hover:text-label shadow-[inset_0_0_0_1px_var(--separator)]'
                    }`}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {!focusSubject && (
            <section className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-0.5 mb-2.5 min-h-6">
                <h2 className="text-subhead font-medium">Memory by subject</h2>
                <MemoryLegend className="hidden sm:flex" />
              </div>
              <div className="bg-card rounded-cell p-5">
                <MemoryMap groups={memory} onOpen={onOpenChapter} />
                <MemoryLegend className="sm:hidden mt-4" />
              </div>
            </section>
          )}

          {/* One quiet toolbar: what to show on the left, how to order it on the right. */}
          <div className="flex items-center gap-3 mb-4 border-b border-separator">
            <div className="flex-1 min-w-0 -ml-4 sm:ml-0 pl-4 sm:pl-0 overflow-x-auto no-scrollbar">
              <div className="flex gap-5 w-max" role="radiogroup" aria-label="Show">
                {FILTERS.map((f) => {
                  const on = filter === f.id
                  const count = (f.id === 'overdue' || f.id === 'due') && counts[f.id] ? counts[f.id] : null
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setFilter(f.id)}
                      className={`relative h-10 text-subhead flex items-center gap-1.5 ${on ? 'text-label' : 'text-label-2 hover:text-label'}`}
                    >
                      {f.label}
                      {count != null && <span className={`text-footnote tabular ${f.id === 'overdue' ? 'text-negative' : 'text-label-2'}`}>{count}</span>}
                      {on && <motion.span layoutId="library-filter" transition={snappy} className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-label" />}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSort((v) => (v === 'memory' ? 'subject' : 'memory'))}
              aria-pressed={sort === 'memory'}
              title={sort === 'memory' ? 'Showing weakest first' : 'Show weakest first'}
              className={`shrink-0 h-8 px-3 mb-1 rounded-full text-footnote flex items-center gap-1.5 ${sort === 'memory' ? 'bg-fill-2 text-label' : 'text-label-2 hover:text-label hover:bg-fill'}`}
            >
              <ArrowDownWideNarrow size={14} /> Weakest first
            </button>
          </div>

          {visible.length === 0 ? (
            <p className="text-subhead text-label-2 py-10">
              {EMPTY[filter] || 'No chapters in this subject yet. Add one from Today or the + button.'}
            </p>
          ) : sort === 'memory' ? (
            <Section>
              <AnimatePresence initial={false}>{byMemory.map((c) => row(c, true))}</AnimatePresence>
            </Section>
          ) : (
            <div className="space-y-8">
              {subjects.map((subject) => {
                const list = groups.get(subject.id) || []
                if (list.length === 0) return null
                const all = chapters.filter((c) => c.subjectId === subject.id)
                const mastered = all.filter((c) => c.status === 'mastered').length
                const avg = memory.find((g) => g.subject.id === subject.id)?.average
                if (focusSubject) {
                  return (
                    <section key={subject.id}>
                      <Section>
                        <AnimatePresence initial={false}>{list.map((c) => row(c, false))}</AnimatePresence>
                      </Section>
                      <button
                        type="button"
                        onClick={() => deleteSubject(subject, all.length)}
                        className="mt-6 h-9 px-1 text-footnote text-label-3 hover:text-negative inline-flex items-center gap-1.5"
                      >
                        <Trash2 size={13} /> Delete {subject.name}
                      </button>
                    </section>
                  )
                }
                return (
                  <section key={subject.id}>
                    <div className="flex items-center gap-3 px-0.5 mb-2.5 min-h-6">
                      <h2 className="text-subhead font-medium truncate flex-1 min-w-0">
                        {subject.name}
                        <span className="ml-2 font-normal text-label-2">
                          {mastered} of {all.length} mastered
                          {avg != null && <span className="hidden sm:inline"> · memory {Math.round(avg * 100)}%</span>}
                        </span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => deleteSubject(subject, all.length)}
                        aria-label={`Delete ${subject.name}`}
                        title={`Delete ${subject.name}`}
                        className="h-7 w-7 -mr-1 rounded-control flex items-center justify-center text-label-3 hover:bg-fill hover:text-negative"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Section>
                      <AnimatePresence initial={false}>{list.map((c) => row(c, false))}</AnimatePresence>
                    </Section>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </Page>
  )
}
