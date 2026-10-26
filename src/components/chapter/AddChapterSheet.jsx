import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, CalendarDays } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section } from '../ui/List'
import { toISODate, nextReviewDateForIndex, MAX_REVIEW_INDEX } from '../../lib/srs'
import { formatShort } from '../../lib/format'
import { nextSubjectColor } from '../../lib/colors'
import { snappy } from '../ui/motion'

const TITLE_MAX = 120
const NOTES_MAX = 1000
const todayISO = () => toISODate(new Date())

// Quick capture: what you studied, under which subject, and when. The five
// review dates it will create are previewed live, straight from the engine,
// so there's no guessing what "add" is about to schedule.
export default function AddChapterSheet({ subjects, onClose, onCreateSubject, onCreateChapter }) {
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [creatingSubject, setCreatingSubject] = useState(subjects.length === 0)
  const [newSubjectName, setNewSubjectName] = useState('')
  const newSubjectColor = nextSubjectColor(subjects)
  const [studiedDate, setStudiedDate] = useState(todayISO)
  const [notes, setNotes] = useState('')

  const trimmedTitle = title.trim()
  const trimmedSubject = newSubjectName.trim()
  const canSubmit = trimmedTitle.length > 0 && (creatingSubject ? trimmedSubject.length > 0 : !!subjectId)

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
    onCreateChapter({
      subjectId: finalSubjectId,
      title: trimmedTitle.slice(0, TITLE_MAX),
      notes: notes.trim().slice(0, NOTES_MAX),
      studiedDate: safeDate,
    })
    onClose()
  }

  return (
    <Sheet title="New Chapter" onClose={onClose} onConfirm={submit} confirmDisabled={!canSubmit} confirmLabel="Add">
      <form onSubmit={submit} className="space-y-6">
        <Section>
          <input
            autoFocus
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you study?"
            enterKeyHint="done"
            className="w-full bg-transparent px-4 h-[54px] text-body outline-none placeholder:text-label-3"
          />
        </Section>

        <Section
          title="Subject"
          action={
            subjects.length > 0 && (
              <button
                type="button"
                onClick={() => setCreatingSubject((v) => !v)}
                className="text-footnote font-medium text-tint"
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
                      className={`inline-flex items-center h-9 px-4 rounded-full text-subhead font-medium ${
                        on ? 'bg-tint text-tint-fg' : 'bg-fill text-label'
                      }`}
                    >
                      {s.name}
                    </motion.button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setCreatingSubject(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-subhead font-medium text-label bg-transparent ring-1 ring-inset ring-separator"
                >
                  <Plus size={15} strokeWidth={2.6} /> New
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        <Section
          footer={
            <span className="flex flex-wrap items-center gap-1.5">
              <span>Reviews on</span>
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
            <span className="h-[30px] w-[30px] rounded-full bg-fill text-label flex items-center justify-center shrink-0">
              <CalendarDays size={16} strokeWidth={1.75} />
            </span>
            <span className="flex-1 text-body">Studied on</span>
            <input
              type="date"
              value={studiedDate}
              max={todayISO()}
              onChange={(e) => setStudiedDate(e.target.value || todayISO())}
              className="bg-fill rounded-[10px] px-3 text-subhead text-label outline-none tabular"
            />
          </label>
          <textarea
            value={notes}
            maxLength={NOTES_MAX}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes (optional)"
            className="block w-full bg-transparent px-4 py-3.5 text-body outline-none resize-none placeholder:text-label-3"
          />
        </Section>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Sheet>
  )
}
