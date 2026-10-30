import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Trash2, LibraryBig, Plus, Clock3, ArrowUpRight } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { Button } from '../components/ui/Button'
import ChapterRow from '../components/chapter/ChapterRow'
import { useConfirm } from '../components/ui/Alert'
import { subjectColor } from '../lib/colors'
import { MAX_REVIEW_INDEX } from '../lib/srs'
import { snappy, easeOut } from '../components/ui/motion'
import { estimateChapterMinutes, formatMinutes, recommendChapters } from '../lib/studyCoach'

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

export default function LibraryPage({ cadence, actions, onOpenChapter, onAdd, account }) {
  const { subjects, chapters, subjectMap, removeSubject } = cadence
  const confirm = useConfirm()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c = { all: chapters.length, overdue: 0, due: 0, upcoming: 0, mastered: 0 }
    chapters.forEach((ch) => {
      c[ch.derivedStatus] = (c[ch.derivedStatus] || 0) + 1
    })
    return c
  }, [chapters])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map(subjects.map((s) => [s.id, []]))
    chapters.forEach((c) => {
      if (filter !== 'all' && c.derivedStatus !== filter) return
      if (q) {
        const name = subjectMap.get(c.subjectId)?.name || ''
        if (!c.title.toLowerCase().includes(q) && !name.toLowerCase().includes(q)) return
      }
      if (!map.has(c.subjectId)) map.set(c.subjectId, [])
      map.get(c.subjectId).push(c)
    })
    return map
  }, [subjects, chapters, filter, query, subjectMap])

  const anyVisible = [...groups.values()].some((l) => l.length > 0)
  const nextChapter = useMemo(() => recommendChapters(chapters)[0], [chapters])
  const showFocusTimer = cadence.prefs.showFocusTimer !== false
  const nextEstimate = showFocusTimer && nextChapter ? estimateChapterMinutes(nextChapter.id, cadence.focusSessions) : null

  async function deleteSubject(subject, count) {
    const ok = await confirm({
      title: `Delete “${subject.name}”?`,
      message: count > 0 ? `Its ${count} chapter${count === 1 ? '' : 's'} and their reviews go with it.` : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeSubject(subject.id)
  }

  return (
    <Page
      title="Library"
      eyebrow={`${chapters.length} chapter${chapters.length === 1 ? '' : 's'} · ${subjects.length} subject${
        subjects.length === 1 ? '' : 's'
      }`}
      trailing={account}
      wide
    >
      {nextChapter && filter === 'all' && !query && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: easeOut }} className="mb-5">
          <Section prominent title="Next up">
            <button
              type="button"
              onClick={() => onOpenChapter(nextChapter)}
              style={{ '--inset': '58px' }}
              className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left active:bg-fill transition-colors duration-75"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-label-2"><Clock3 size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium">{nextChapter.title}</span>
                <span className="mt-0.5 block truncate text-footnote text-label-2">
                  {nextChapter.coachReason}{nextEstimate ? ` · ${nextEstimate.label} · ${formatMinutes(nextEstimate.minutes)}` : ''}
                </span>
              </span>
              <ArrowUpRight size={17} className="shrink-0 text-label-2" />
            </button>
          </Section>
        </motion.div>
      )}
      {/* Search, iOS 26 style: a capsule field */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters and subjects"
          aria-label="Search chapters and subjects"
          enterKeyHint="search"
          className="w-full h-11 rounded-full bg-card pl-10 pr-10 text-body outline-none placeholder:text-label-3 focus:ring-1 focus:ring-label-3"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-label-3 text-card flex items-center justify-center"
            >
              <X size={14} strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter chips — scroll sideways on a phone rather than wrapping */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto no-scrollbar mb-6">
        <div className="flex gap-2 w-max" role="radiogroup" aria-label="Filter">
          {FILTERS.map((f) => {
            const on = filter === f.id
            return (
              <motion.button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                whileTap={{ scale: 0.94 }}
                transition={snappy}
                onClick={() => setFilter(f.id)}
                className={`relative h-9 px-4 rounded-full text-subhead flex items-center gap-1.5 ${
                  on ? 'text-tint-fg' : 'bg-card text-label'
                }`}
              >
                {on && <motion.span layoutId="library-chip" transition={snappy} className="absolute inset-0 rounded-full tint-fill" />}
                <span className="relative">{f.label}</span>
                <span className={`relative font-mono text-[12px] tabular ${on ? 'text-tint-fg/70' : 'text-label-2'}`}>{counts[f.id] || 0}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="bg-card rounded-[28px] px-6 py-10 text-center">
          <span className="mx-auto h-14 w-14 rounded-full bg-fill text-label flex items-center justify-center">
            <LibraryBig size={24} strokeWidth={1.6} />
          </span>
          <h2 className="text-title-2 font-medium mt-4">Your library is empty</h2>
          <p className="text-subhead text-label-2 mt-1.5 max-w-[300px] mx-auto">
            Every chapter you log lands here, grouped by subject.
          </p>
          <Button className="mt-5" onClick={onAdd}>
            <Plus size={18} strokeWidth={2.6} /> Add Chapter
          </Button>
        </div>
      ) : !anyVisible ? (
        <p className="text-center text-subhead text-label-2 py-16">
          {query ? `No results for “${query.trim()}”.` : EMPTY[filter] || 'No chapters yet.'}
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-x-8 gap-y-8 items-start">
          {subjects.map((subject) => {
            const list = groups.get(subject.id) || []
            if (list.length === 0) return null
            const all = chapters.filter((c) => c.subjectId === subject.id)
            const progress =
              all.reduce((sum, c) => sum + (c.status === 'mastered' ? MAX_REVIEW_INDEX : c.currentReviewIndex || 0), 0) /
              Math.max(1, all.length * MAX_REVIEW_INDEX)
            const color = subjectColor(subject.colorTag)
            return (
              <motion.section
                key={subject.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <div className="flex items-center gap-3 px-1 mb-2.5">
                  <h2 className="text-title-3 font-medium truncate flex-1 min-w-0">{subject.name}</h2>
                  <span className="font-mono text-[12px] text-label-2 tabular shrink-0">{Math.round(progress * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => deleteSubject(subject, all.length)}
                    aria-label={`Delete ${subject.name}`}
                    className="h-8 w-8 -mr-1 rounded-full flex items-center justify-center text-label-2 active:bg-fill hover:text-accent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="h-1 rounded-full bg-fill overflow-hidden mx-1 mb-3">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progress }}
                    transition={{ duration: 0.6, ease: easeOut }}
                    style={{ originX: 0, background: color }}
                    className="h-full rounded-full"
                  />
                </div>
                <Section>
                  <AnimatePresence initial={false}>
                    {list.map((c) => (
                      <ChapterRow
                        key={c.id}
                        chapter={c}
                        subject={subject}
                        showSubject={false}
                        onOpen={onOpenChapter}
                        onRevise={actions.revise}
                        onSnooze={actions.snooze}
                        onLocked={actions.locked}
                      />
                    ))}
                  </AnimatePresence>
                </Section>
              </motion.section>
            )
          })}
        </div>
      )}
    </Page>
  )
}
