import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const MAX = 5000
const CHECK = /^\s*[-*]\s\[( |x|X)\]\s?(.*)$/
const BULLET = /^\s*[-*]\s(.*)$/
const HEADING = /^\s*#{1,3}\s(.*)$/

// A chapter's notes, Notion style: read as a page, click anywhere to write.
// A few shorthands render as you'd expect: "# " a heading, "- " a bullet,
// "- [ ] " a checklist item you can tick without opening the editor. Saves
// on its own as you type and when you leave the field.
export default function NotesBlock({ value = '', onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const area = useRef(null)
  const saved = useRef(value)

  useEffect(() => {
    if (!editing) {
      setDraft(value)
      saved.current = value
    }
  }, [value, editing])

  // Autosave while typing, a beat after the last keystroke.
  useEffect(() => {
    if (!editing || draft === saved.current) return undefined
    const t = setTimeout(() => {
      saved.current = draft
      onSave(draft)
    }, 600)
    return () => clearTimeout(t)
  }, [draft, editing, onSave])

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft, editing])

  function finish() {
    setEditing(false)
    if (draft !== saved.current) {
      saved.current = draft
      onSave(draft)
    }
  }

  function toggle(index) {
    const lines = value.split('\n')
    const m = lines[index].match(CHECK)
    if (!m) return
    lines[index] = lines[index].replace(/\[( |x|X)\]/, m[1] === ' ' ? '[x]' : '[ ]')
    const next = lines.join('\n')
    saved.current = next
    onSave(next)
  }

  if (editing) {
    return (
      <textarea
        ref={area}
        autoFocus
        value={draft}
        maxLength={MAX}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={finish}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            finish()
          }
        }}
        placeholder={'What do you want to remember?\n# Heading   - bullet   - [ ] checklist'}
        aria-label="Notes"
        className="block w-full min-h-[120px] resize-none bg-transparent px-4 py-3.5 text-body leading-[24px] outline-none placeholder:text-label-3"
      />
    )
  }

  const lines = value.split('\n')
  const checks = lines.filter((l) => CHECK.test(l))
  const done = checks.filter((l) => /\[(x|X)\]/.test(l)).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (e.target.closest('[data-check]')) return
        setEditing(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          setEditing(true)
        }
      }}
      className="px-4 py-3.5 min-h-[88px] cursor-text hover:bg-fill/60 transition-colors"
      aria-label="Notes, click to edit"
    >
      {!value.trim() ? (
        <p className="text-body text-label-3">
          Add notes. Type <span className="text-label-2">#</span> for a heading, <span className="text-label-2">-</span> for a bullet,{' '}
          <span className="text-label-2">- [ ]</span> for a checklist.
        </p>
      ) : (
        <div className="space-y-1">
          {checks.length > 0 && (
            <p className="text-footnote text-label-2 tabular mb-2">
              {done} of {checks.length} checked
            </p>
          )}
          {lines.map((line, i) => {
            const c = line.match(CHECK)
            if (c) {
              const on = c[1] !== ' '
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <button
                    type="button"
                    data-check
                    onClick={() => toggle(i)}
                    aria-pressed={on}
                    aria-label={`${on ? 'Uncheck' : 'Check'} ${c[2]}`}
                    className={`mt-[3px] h-[18px] w-[18px] shrink-0 rounded-full flex items-center justify-center ${on ? 'bg-label text-tint-fg' : 'shadow-[inset_0_0_0_1.5px_var(--label-3)]'}`}
                  >
                    {on && <Check size={11} strokeWidth={3} />}
                  </button>
                  <span className={`text-body leading-[24px] ${on ? 'text-label-3 line-through' : ''}`}>{c[2]}</span>
                </div>
              )
            }
            const h = line.match(HEADING)
            if (h) return <p key={i} className="text-headline font-semibold pt-2 first:pt-0">{h[1]}</p>
            const b = line.match(BULLET)
            if (b)
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-[10px] h-[5px] w-[5px] shrink-0 rounded-full bg-label-2" />
                  <span className="text-body leading-[24px]">{b[1]}</span>
                </div>
              )
            if (!line.trim()) return <div key={i} className="h-2" />
            return <p key={i} className="text-body leading-[24px] whitespace-pre-wrap break-words">{line}</p>
          })}
        </div>
      )}
    </div>
  )
}
