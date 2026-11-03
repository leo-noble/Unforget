import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Trash2, Plus } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import ChapterRow from '../components/chapter/ChapterRow'
import QuickAdd from '../components/chapter/QuickAdd'
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
  const [query, setQuery] = useState('')

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
    const q = query.trim().toLowerCase()
    return chapters.filter((c) => {
      if (filter !== 'all' && c.derivedStatus !== filter) return false
      if (!q) return true
      const name = subjectMap.get(c.subjectId)?.name || ''
      return c.title.toLowerCase().includes(q) || name.toLowerCase().includes(q)
    })
  }, [chapters, filter, query, subjectMap])

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
      strength={strength.get(c.id)}
      selected={c.id === selectedId}
    />
  )

  let subtitle = 'Every chapter you log lands here, grouped by subject.'
  if (chapters.length) {
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

          <QuickAdd
            key={focusSubject?.id || 'all'}
            subjects={allSubjects}
            preferSubjectId={focusSubject?.id}
            onCreateSubject={cadence.createSubject}
            onCreateChapter={cadence.createChapter}
            className="mb-8"
          />

          <section className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-0.5 mb-2.5 min-h-6">
              <h2 className="text-subhead font-medium">{focusSubject ? 'Memory' : 'Memory by subject'}</h2>
              <MemoryLegend />
            </div>
            <div className="bg-card rounded-cell p-5">
              <MemoryMap groups={memory} onOpen={onOpenChapter} />
            </div>
          </section>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-3 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter chapters and subjects"
                aria-label="Filter chapters and subjects"
                enterKeyHint="search"
                className="w-full h-9 rounded-control bg-card shadow-[inset_0_0_0_1px_var(--separator)] pl-9 pr-9 outline-none placeholder:text-label-3 focus:shadow-[inset_0_0_0_1px_var(--label-3)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-control text-label-2 hover:bg-fill flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Segmented
              value={sort}
              onChange={setSort}
              options={[
                { id: 'subject', label: 'By subject' },
                { id: 'memory', label: 'Weakest first' },
              ]}
              className="sm:w-[240px]"
              ariaLabel="Sort"
            />
          </div>

          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto no-scrollbar mb-6 border-b border-separator">
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
                    className={`relative h-9 text-subhead flex items-center gap-1.5 ${on ? 'text-label' : 'text-label-2 hover:text-label'}`}
                  >
                    {f.label}
                    {count != null && <span className={`text-footnote tabular ${f.id === 'overdue' ? 'text-negative' : 'text-label-2'}`}>{count}</span>}
                    {on && <motion.span layoutId="library-filter" transition={snappy} className="absolute left-0 right-0 -bottom-px h-[2px] bg-label" />}
                  </button>
                )
              })}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-subhead text-label-2 py-10">
              {query ? `No chapter matches “${query.trim()}”.` : EMPTY[filter] || 'No chapters yet.'}
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
