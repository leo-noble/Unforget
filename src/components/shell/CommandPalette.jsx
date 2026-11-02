import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Search, Plus, Timer, SunMedium, LibraryBig, CalendarDays, ChartNoAxesCombined, Settings, PanelLeft, Keyboard, CornerDownLeft } from 'lucide-react'
import { lockScroll } from '../ui/scrollLock'
import { shortWhen, reviewLabel } from '../chapter/meta'

// ⌘K / Ctrl+K: one box to find any chapter or do any action. Arrow keys move,
// Enter runs, Esc closes. Chapters match on their title or their subject.
export default function CommandPalette({ cadence, onClose, run, showFocusTimer }) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef(null)
  const list = useRef(null)

  useEffect(() => lockScroll(), [])
  useEffect(() => {
    input.current?.focus()
  }, [])

  const actions = useMemo(
    () =>
      [
        { id: 'add', label: 'New chapter', icon: Plus, hint: 'N' },
        showFocusTimer && { id: 'focus-next', label: 'Start focus on the next review', icon: Timer },
        { id: 'tab:today', label: 'Go to Today', icon: SunMedium },
        { id: 'tab:library', label: 'Go to Library', icon: LibraryBig },
        { id: 'tab:plan', label: 'Go to Plan', icon: CalendarDays },
        showFocusTimer && { id: 'tab:focus', label: 'Go to Focus', icon: Timer },
        { id: 'tab:insights', label: 'Go to Insights', icon: ChartNoAxesCombined },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'sidebar', label: 'Toggle sidebar', icon: PanelLeft },
        { id: 'shortcuts', label: 'Keyboard shortcuts', icon: Keyboard, hint: '?' },
      ].filter(Boolean),
    [showFocusTimer]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchedActions = q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions
    const chapters = q
      ? cadence.chapters
          .filter((c) => c.title.toLowerCase().includes(q) || (cadence.subjectMap.get(c.subjectId)?.name || '').toLowerCase().includes(q))
          .slice(0, 8)
      : [...cadence.overdue, ...cadence.dueToday].slice(0, 5)
    return [
      ...chapters.map((c) => ({ kind: 'chapter', id: `ch:${c.id}`, chapter: c })),
      ...matchedActions.map((a) => ({ kind: 'action', ...a })),
    ]
  }, [query, actions, cadence.chapters, cadence.overdue, cadence.dueToday, cadence.subjectMap])

  const active = Math.min(index, Math.max(0, results.length - 1))

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function choose(item) {
    if (!item) return
    onClose()
    if (item.kind === 'chapter') run('chapter', item.chapter)
    else run(item.id)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const firstAction = results.findIndex((r) => r.kind === 'action')
  const chapterHeading = query.trim() ? 'Chapters' : 'Due now'

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center px-3 pt-[max(12vh,calc(env(safe-area-inset-top)+16px))]">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'var(--scrim)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.14 }}
        className="glass-strong relative w-full max-w-[580px] rounded-sheet overflow-hidden"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 px-4 h-12 hairline-b">
          <Search size={16} className="text-label-3 shrink-0" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            placeholder="Search chapters or type a command"
            aria-label="Search chapters or type a command"
            className="flex-1 min-w-0 bg-transparent outline-none text-body placeholder:text-label-3"
            style={{ fontSize: 16 }}
          />
          <span className="kbd hidden sm:inline-flex">Esc</span>
        </div>
        <div ref={list} className="max-h-[min(420px,60vh)] overflow-y-auto py-1.5" role="listbox" aria-label="Results">
          {results.length === 0 && <p className="px-4 py-6 text-subhead text-label-2">No chapter or command matches “{query}”.</p>}
          {results.map((item, i) => {
            const selected = i === active
            const heading = i === 0 && item.kind === 'chapter' ? chapterHeading : i === firstAction ? 'Commands' : null
            return (
              <div key={item.id}>
                {heading && <p className="px-4 pt-2 pb-1 text-caption text-label-3">{heading}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-index={i}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => choose(item)}
                  className={`w-full flex items-center gap-3 px-4 h-10 text-left ${selected ? 'bg-fill-2' : ''}`}
                >
                  {item.kind === 'chapter' ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-subhead">
                        {item.chapter.title}
                        <span className="text-label-2"> · {cadence.subjectMap.get(item.chapter.subjectId)?.name} · {reviewLabel(item.chapter)}</span>
                      </span>
                      <span className={`text-footnote tabular ${item.chapter.derivedStatus === 'overdue' ? 'text-negative' : 'text-label-2'}`}>
                        {shortWhen(item.chapter) || 'Mastered'}
                      </span>
                    </>
                  ) : (
                    <>
                      <item.icon size={16} strokeWidth={1.6} className="text-label-2 shrink-0" />
                      <span className="flex-1 text-subhead">{item.label}</span>
                      {item.hint && <span className="kbd">{item.hint}</span>}
                    </>
                  )}
                  {selected && <CornerDownLeft size={14} className="text-label-3 shrink-0" />}
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
