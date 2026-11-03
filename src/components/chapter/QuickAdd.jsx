import { useMemo, useRef, useState } from 'react'
import { Plus, Hash, CalendarDays, CornerDownLeft, Check } from 'lucide-react'
import { parseQuickAdd } from '../../lib/quickAdd'
import { nextReviewDateForIndex, toISODate } from '../../lib/srs'
import { formatShort, relativeDayInline } from '../../lib/format'
import { nextSubjectColor } from '../../lib/colors'
import { useToast } from '../ui/Toast'

const LAST_SUBJECT = 'unforget.lastSubject'
const readLast = () => {
  try {
    return localStorage.getItem(LAST_SUBJECT)
  } catch {
    return null
  }
}

function Chip({ icon: Icon, children, muted = false }) {
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-footnote ${muted ? 'bg-fill text-label-2' : 'bg-fill-2 text-label'}`}>
      <Icon size={12} strokeWidth={2} />
      {children}
    </span>
  )
}

// The one-line way to log what you studied, Todoist style. As you type, the
// chips underneath show exactly what will be saved, so the shorthand never
// guesses silently.
export default function QuickAdd({ subjects, onCreateSubject, onCreateChapter, preferSubjectId, autoFocus = false, className = '' }) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const input = useRef(null)
  const toast = useToast()
  const parsed = useMemo(() => parseQuickAdd(text, subjects, preferSubjectId || readLast()), [text, subjects, preferSubjectId])
  const ready = parsed.title.length > 0 && (parsed.subject || parsed.newSubjectName)
  const open = focused || text.length > 0

  function submit(e) {
    e.preventDefault()
    if (!ready) return
    let subjectId = parsed.subject?.id
    if (!subjectId) {
      const name = parsed.newSubjectName.charAt(0).toUpperCase() + parsed.newSubjectName.slice(1)
      subjectId = onCreateSubject({ name: name.slice(0, 120), colorTag: nextSubjectColor(subjects) }).id
    }
    onCreateChapter({ subjectId, title: parsed.title.slice(0, 120), notes: '', studiedDate: parsed.studiedDate })
    try {
      localStorage.setItem(LAST_SUBJECT, subjectId)
    } catch {
      // best-effort
    }
    toast({
      title: `Added “${parsed.title}”`,
      message: `First review ${relativeDayInline(nextReviewDateForIndex(parsed.studiedDate, 0))}`,
      icon: Check,
    })
    setText('')
  }

  const subjectLabel = parsed.subject ? parsed.subject.name : parsed.newSubjectName ? `New subject: ${parsed.newSubjectName.charAt(0).toUpperCase()}${parsed.newSubjectName.slice(1)}` : 'Type #subject'
  const dateLabel = parsed.studiedDate === toISODate(new Date()) ? 'Studied today' : `Studied ${formatShort(parsed.studiedDate)}`

  return (
    <form onSubmit={submit} className={className}>
      <label className={`flex items-center gap-3 h-12 pl-4 pr-2 rounded-full bg-card shadow-[inset_0_0_0_1px_var(--separator)] transition-shadow ${open ? 'shadow-[inset_0_0_0_1.5px_var(--label-3)]' : ''}`}>
        <Plus size={18} strokeWidth={2} className="shrink-0 text-label-2" />
        <input
          ref={input}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setText('')
              input.current?.blur()
            }
          }}
          placeholder={subjects.length ? 'Log what you studied, e.g. Alkenes #chem yesterday' : 'Log what you studied, e.g. Alkenes #Chemistry'}
          aria-label="Log what you studied"
          enterKeyHint="done"
          className="flex-1 min-w-0 bg-transparent outline-none text-body placeholder:text-label-3"
        />
        {text && (
          <button
            type="submit"
            disabled={!ready}
            className="shrink-0 h-8 px-3.5 rounded-full tint-fill text-tint-fg text-footnote font-medium disabled:opacity-30 inline-flex items-center gap-1"
          >
            Add <CornerDownLeft size={12} />
          </button>
        )}
      </label>
      {open && (
        <div className="mt-2 px-2 flex flex-wrap items-center gap-1.5" aria-live="polite">
          <Chip icon={Hash} muted={!parsed.subject && !parsed.newSubjectName}>{subjectLabel}</Chip>
          <Chip icon={CalendarDays} muted={!parsed.dateWasSet}>{dateLabel}</Chip>
          <span className="text-footnote text-label-2 ml-1">
            {text ? `Reviews from ${formatShort(nextReviewDateForIndex(parsed.studiedDate, 0))}` : '#subject and a day like “yesterday” or “mon” are optional'}
          </span>
        </div>
      )}
    </form>
  )
}
