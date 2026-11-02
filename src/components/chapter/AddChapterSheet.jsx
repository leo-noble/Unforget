import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, CalendarDays } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Segmented from '../ui/Segmented'
import { Section } from '../ui/List'
import { toISODate, nextReviewDateForIndex, MAX_REVIEW_INDEX } from '../../lib/srs'
import { formatShort } from '../../lib/format'
import { nextSubjectColor } from '../../lib/colors'
import { snappy } from '../ui/motion'

const TITLE_MAX = 120
const NOTES_MAX = 1000
const LIST_MAX = 50
const todayISO = () => toISODate(new Date())

// One chapter per line. Bullets and numbering from a pasted syllabus or
// contents page ("1.", "2)", "-", "•") are dropped, and repeats kept once.
function parseChapterList(text) {
  const seen = new Set()
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•–]|\d+[.)]|[a-z][.)])\s+/i, '').trim().slice(0, TITLE_MAX))
    .filter((line) => {
      const key = line.toLowerCase()
      if (!line || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, LIST_MAX)
}

// Quick capture: what you studied, under which subject, and when. The five
// review dates it will create are previewed live, straight from the engine,
// so there's no guessing what "add" is about to schedule.
export default function AddChapterSheet({ subjects, onClose, onCreateSubject, onCreateChapter }) {
  const [mode, setMode] = useState('one') // one | list
  const [title, setTitle] = useState('')
  const [list, setList] = useState('')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [creatingSubject, setCreatingSubject] = useState(subjects.length === 0)
  const [newSubjectName, setNewSubjectName] = useState('')
  const newSubjectColor = nextSubjectColor(subjects)
  const [studiedDate, setStudiedDate] = useState(todayISO)
  const [notes, setNotes] = useState('')

  const trimmedTitle = title.trim()
  const trimmedSubject = newSubjectName.trim()
  const titles = useMemo(() => (mode === 'list' ? parseChapterList(list) : trimmedTitle ? [trimmedTitle.slice(0, TITLE_MAX)] : []), [mode, list, trimmedTitle])
  const canSubmit = titles.length > 0 && (creatingSubject ? trimmedSubject.length > 0 : !!subjectId)

  // Never let a chapter be "studied" in the future — it would schedule
  // reviews from a day that hasn't happened yet.
  const safeDate = studiedDate && studiedDate <= todayISO() ? studiedDate : todayISO()
  const preview = useMemo(
    () => Array.from({ length: MAX_REVIEW_INDEX }, (_, i) => nextReviewDateForIndex(safeDate, i)),
    [safeDate]
  )

  function submit(e) {
    e?.preventDefault()
    if (!canSubmit) return
    let finalSubjectId = subjectId
    if (creatingSubject) {
      const s = onCreateSubject({ name: trimmedSubject.slice(0, TITLE_MAX), colorTag: newSubjectColor })
      finalSubjectId = s.id
    }
    titles.forEach((t) =>
      onCreateChapter({
        subjectId: finalSubjectId,
        title: t,
        notes: mode === 'one' ? notes.trim().slice(0, NOTES_MAX) : '',
        studiedDate: safeDate,
      })
    )
    onClose()
  }

  return (
    <Sheet
      title={mode === 'list' && titles.length > 1 ? `New chapters · ${titles.length}` : 'New chapter'}
      onClose={onClose}
      onConfirm={submit}
      confirmDisabled={!canSubmit}
      confirmLabel={titles.length > 1 ? `Add ${titles.length} chapters` : 'Add'}
    >
      <form onSubmit={submit} className="space-y-6">
        <Segmented
          ariaLabel="How many chapters"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'one', label: 'One chapter' },
            { id: 'list', label: 'Paste a list' },
          ]}
          className="w-full"
        />
        {mode === 'one' ? (
          <Section>
            <input
              autoFocus
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you study?"
              enterKeyHint="done"
              className="w-full bg-transparent px-4 h-12 text-body outline-none placeholder:text-label-3"
            />
          </Section>
        ) : (
          <Section
            footer={
              titles.length
                ? `${titles.length} chapter${titles.length === 1 ? '' : 's'}, each with its own five reviews.${titles.length === LIST_MAX ? ` Up to ${LIST_MAX} at a time.` : ''}`
                : 'One chapter per line. Numbers and bullets from a contents page are removed.'
            }
          >
            <textarea
              autoFocus
              value={list}
              onChange={(e) => setList(e.target.value)}
              rows={6}
              placeholder={'1. Alkenes\n2. Alkynes\n3. Aromatic compounds'}
              aria-label="Chapters, one per line"
              className="block w-full bg-transparent px-4 py-3 text-body outline-none resize-y placeholder:text-label-3"
            />
          </Section>
        )}

        <Section
          title="Subject"
          action={
            subjects.length > 0 && (
              <button
                type="button"
                onClick={() => setCreatingSubject((v) => !v)}
                className="text-footnote text-label-2 hover:text-label"
              >
                {creatingSubject ? 'Choose existing' : 'New subject'}
              </button>
            )
          }
          listClassName="!overflow-visible"
        >
          <AnimatePresence mode="wait" initial={false}>
            {creatingSubject ? (
              <motion.div
                key="new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <input
                  value={newSubjectName}
                  maxLength={TITLE_MAX}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name, e.g. Physics"
                  className="w-full bg-transparent px-4 h-[52px] text-body outline-none placeholder:text-label-3"
                />
              </motion.div>
            ) : (
              <motion.div
                key="pick"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-wrap gap-2 p-3"
              >
                {subjects.map((s) => {
                  const on = subjectId === s.id
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      transition={snappy}
                      onClick={() => setSubjectId(s.id)}
                      aria-pressed={on}
                      className={`inline-flex items-center h-8 px-3 rounded-control text-subhead ${
                        on ? 'bg-tint text-tint-fg' : 'bg-fill-2 text-label hover:bg-fill'
                      }`}
                    >
                      {s.name}
                    </motion.button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setCreatingSubject(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control text-subhead text-label-2 hover:text-label bg-transparent ring-1 ring-inset ring-separator"
                >
                  <Plus size={14} strokeWidth={2} /> New
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        <Section
          footer={
            <span className="flex flex-wrap items-center gap-1.5">
              <span>{titles.length > 1 ? 'Each is reviewed on' : 'Reviews on'}</span>
              {preview.map((d, i) => (
                <span key={d} className="tabular text-label">
                  {formatShort(d)}
                  {i < preview.length - 1 ? ',' : '.'}
                </span>
              ))}
            </span>
          }
        >
          <label className="flex items-center gap-3 px-4 min-h-[52px]" style={{ '--inset': '16px' }}>
            <CalendarDays size={17} strokeWidth={1.6} className="text-label-2 shrink-0" />
            <span className="flex-1 text-body">Studied on</span>
            <input
              type="date"
              value={studiedDate}
              max={todayISO()}
              onChange={(e) => setStudiedDate(e.target.value || todayISO())}
              className="bg-fill-2 rounded-control px-3 text-subhead text-label outline-none tabular"
            />
          </label>
          {mode === 'one' && (
            <textarea
              value={notes}
              maxLength={NOTES_MAX}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes (optional)"
              className="block w-full bg-transparent px-4 py-3 text-body outline-none resize-none placeholder:text-label-3"
            />
          )}
        </Section>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Sheet>
  )
}
