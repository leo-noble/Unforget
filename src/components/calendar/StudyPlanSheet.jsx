import { useMemo, useState } from 'react'
import { Check, Minus, Plus, Search, X, Trash2 } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section, Row } from '../ui/List'
import Segmented from '../ui/Segmented'
import Switch from '../ui/Switch'
import { subjectColor } from '../../lib/colors'
import { toISODate, addDays, daysBetween, startOfDay } from '../../lib/srs'
import { distributeChapters } from '../../lib/reviewSchedule'
import { minutesToInputValue, inputValueToMinutes, minutesToLabel, MIN_BLOCK_MINUTES, DEFAULT_BLOCK_MINUTES } from '../../lib/timeGrid'

// A study block is planned, not scheduled: the user picks what to read, which
// day(s), and optionally when. That's deliberately separate from the review
// schedule, which the app sets itself and the user never edits.
const MAX_SPAN_DAYS = 60
const END_OF_DAY = 24 * 60

const shortDate = (iso) => startOfDay(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const rowDate = (iso) => startOfDay(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })

const fieldClass = 'bg-fill rounded-[10px] px-3 h-[34px] text-subhead text-label outline-none tabular'

export default function StudyPlanSheet({
  chapters,
  subjectMap,
  blocks,
  block,
  defaultDate,
  defaultStartMinute,
  defaultEndMinute,
  onCreate,
  onUpdate,
  onDelete,
  onDeleteSeries,
  onClose,
}) {
  const editing = !!block

  // A block dragged out on the canvas arrives with a time; the + button
  // arrives without one and defaults to a 9am hour.
  const initialStart = editing ? block.startMinute : Number.isFinite(defaultStartMinute) ? defaultStartMinute : 9 * 60
  const initialEnd = editing
    ? block.endMinute
    : Number.isFinite(defaultEndMinute)
    ? defaultEndMinute
    : (Number.isFinite(defaultStartMinute) ? defaultStartMinute : 9 * 60) + DEFAULT_BLOCK_MINUTES

  const [selected, setSelected] = useState(() => (block ? [...(block.chapterIds || [])] : []))
  const [spread, setSpread] = useState('single') // single | multi
  const [startDate, setStartDate] = useState(block?.date || defaultDate)
  const [endDate, setEndDate] = useState(block?.date || defaultDate)
  // Days struck off the preview, kept as dates so the rest can re-flow without
  // the exclusion sliding onto a different day.
  const [dropped, setDropped] = useState(() => new Set())
  const [timed, setTimed] = useState(editing ? Number.isFinite(block.startMinute) : true)
  const [startMinute, setStartMinute] = useState(Number.isFinite(initialStart) ? initialStart : 9 * 60)
  const [endMinute, setEndMinute] = useState(Number.isFinite(initialEnd) ? initialEnd : 9 * 60 + DEFAULT_BLOCK_MINUTES)
  // Overrides: empty means "use the chapter's title / the subject's colour".
  const [title, setTitle] = useState(block?.title || '')
  // Colour overrides predate the black-and-white design; an existing one is
  // kept as-is when the block is saved.
  const color = block?.color || null
  const [scope, setScope] = useState('single') // single | series
  const [query, setQuery] = useState('')

  const seriesCount = useMemo(() => {
    if (!editing || !block.seriesId) return 0
    return (blocks || []).filter((b) => b.seriesId === block.seriesId).length
  }, [editing, block, blocks])

  const sorted = useMemo(() => {
    const withSubject = chapters.map((c) => ({ ...c, subject: subjectMap.get(c.subjectId) }))
    return withSubject.sort((a, b) => {
      const s = (a.subject?.name || '').localeCompare(b.subject?.name || '')
      return s !== 0 ? s : a.title.localeCompare(b.title)
    })
  }, [chapters, subjectMap])

  const chapterMap = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters])
  const activeChapter = useMemo(() => chapterMap.get(selected[0]) || null, [chapterMap, selected])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((c) => c.title.toLowerCase().includes(q) || (c.subject?.name || '').toLowerCase().includes(q))
  }, [sorted, query])

  const span = Math.min(daysBetween(startDate, endDate) + 1, MAX_SPAN_DAYS)

  function setSpan(days) {
    const n = Math.max(2, Math.min(days, MAX_SPAN_DAYS))
    setEndDate(toISODate(addDays(startDate, n - 1)))
    setDropped(new Set())
  }

  // The end can never precede the start; moving the start past the end drags
  // the end along rather than rejecting the input.
  function changeStart(value) {
    if (!value) return
    setStartDate(value)
    if (value > endDate) setEndDate(value)
    setDropped(new Set())
  }

  function changeEnd(value) {
    if (!value) return
    setEndDate(value < startDate ? startDate : value)
    setDropped(new Set())
  }

  function changeSpread(next) {
    setSpread(next)
    setDropped(new Set())
    if (next === 'single') setEndDate(startDate)
    else if (endDate <= startDate) {
      // A fresh span defaults to one day per chapter.
      const days = Math.max(2, Math.min(selected.length || 2, 14))
      setEndDate(toISODate(addDays(startDate, days - 1)))
    }
  }

  // Times keep at least MIN_BLOCK_MINUTES apart, whichever one is edited.
  function changeStartTime(value) {
    const m = inputValueToMinutes(value)
    if (m === null) return
    setStartMinute(m)
    if (endMinute - m < MIN_BLOCK_MINUTES) setEndMinute(Math.min(m + DEFAULT_BLOCK_MINUTES, END_OF_DAY))
  }

  function changeEndTime(value) {
    const m = inputValueToMinutes(value)
    if (m === null) return
    setEndMinute(Math.max(m, startMinute + MIN_BLOCK_MINUTES))
  }

  const toggleChapter = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const dates = useMemo(() => Array.from({ length: span }, (_, i) => toISODate(addDays(startDate, i))), [startDate, span])

  // What actually gets created, after the split and anything struck off.
  const rows = useMemo(() => {
    if (spread === 'single') return selected.length > 0 ? [{ date: startDate, chapterIds: selected }] : []
    return distributeChapters(selected, dates.filter((d) => !dropped.has(d)))
  }, [spread, selected, startDate, dates, dropped])

  const canSave = editing ? selected.length > 0 : rows.length > 0

  function submit() {
    if (!canSave) return
    const times = timed ? { startMinute, endMinute } : { startMinute: null, endMinute: null }
    if (editing) onUpdate({ id: block.id, chapterIds: selected, date: startDate, ...times, title, color, scope })
    else onCreate({ rows, ...times })
    onClose()
  }

  return (
    <Sheet
      title={editing ? 'Edit Session' : 'Plan Study'}
      onClose={onClose}
      onConfirm={submit}
      confirmDisabled={!canSave}
      confirmLabel={editing ? 'Save' : 'Add'}
      size="lg"
    >
      <div className="space-y-7">
        {/* 1 — What to read */}
        <Section title={editing ? 'Chapters' : 'What to study'} footer={selected.length > 0 ? `${selected.length} selected` : undefined}>
          {chapters.length === 0 ? (
            <p className="px-4 py-4 text-subhead text-label-2">Add a chapter first — sessions point at chapters you've logged.</p>
          ) : (
            <>
              {sorted.length > 6 && (
                <div className="p-2.5">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-2" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      aria-label="Search chapters"
                      className="w-full h-9 rounded-full bg-fill pl-9 pr-3 text-body outline-none placeholder:text-label-2"
                    />
                  </div>
                </div>
              )}
              <div className="ios-list max-h-[264px] overflow-y-auto overscroll-contain">
                {visible.length === 0 && <p className="px-4 py-3 text-subhead text-label-2">No chapter matches that.</p>}
                {visible.map((c) => {
                  const on = selected.includes(c.id)
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleChapter(c.id)}
                      aria-pressed={on}
                      style={{ '--inset': '52px' }}
                      className="w-full flex items-center gap-3 px-4 min-h-[52px] text-left active:bg-fill"
                    >
                      <span
                        className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center transition-colors duration-150 ${on ? 'bg-tint text-tint-fg' : ''}`}
                        style={on ? undefined : { boxShadow: 'inset 0 0 0 1.5px var(--label-3)' }}
                      >
                        {on && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body truncate">{c.title}</span>
                        {c.subject && (
                          <span className="flex items-center gap-1.5 text-footnote text-label-2 truncate">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: subjectColor(c.subject.colorTag) }} />
                            {c.subject.name}
                            {c.derivedStatus === 'mastered' && ' · Mastered'}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </Section>

        {/* 2 — When */}
        <Section title="When">
          {!editing && (
            <div className="px-4 py-3">
              <Segmented
                ariaLabel="One day or several"
                value={spread}
                onChange={changeSpread}
                options={[
                  { id: 'single', label: 'One day' },
                  { id: 'multi', label: 'Several days' },
                ]}
                className="w-full"
              />
            </div>
          )}
          {editing || spread === 'single' ? (
            <Row
              title="Day"
              trailing={
                <input
                  type="date"
                  aria-label="Day"
                  value={startDate}
                  onChange={(e) => (editing ? e.target.value && setStartDate(e.target.value) : changeStart(e.target.value))}
                  className={fieldClass}
                />
              }
            />
          ) : (
            <>
              <Row title="From" trailing={<input type="date" aria-label="From" value={startDate} onChange={(e) => changeStart(e.target.value)} className={fieldClass} />} />
              <Row
                title="Through"
                trailing={
                  <input
                    type="date"
                    aria-label="Through"
                    value={startDate > endDate ? startDate : endDate}
                    min={startDate}
                    onChange={(e) => changeEnd(e.target.value)}
                    className={fieldClass}
                  />
                }
              />
              <Row
                title="Days"
                trailing={
                  <span className="flex items-center gap-3">
                    <span className="text-body text-label-2 tabular">{span}</span>
                    <span className="flex items-center h-8 rounded-full bg-fill overflow-hidden">
                      <button type="button" onClick={() => setSpan(span - 1)} disabled={span <= 2} aria-label="One day fewer" className="h-full w-11 flex items-center justify-center disabled:opacity-30 active:bg-fill-2">
                        <Minus size={16} strokeWidth={2.6} />
                      </button>
                      <span className="w-px h-4 bg-separator" />
                      <button type="button" onClick={() => setSpan(span + 1)} disabled={span >= MAX_SPAN_DAYS} aria-label="One day more" className="h-full w-11 flex items-center justify-center disabled:opacity-30 active:bg-fill-2">
                        <Plus size={16} strokeWidth={2.6} />
                      </button>
                    </span>
                  </span>
                }
              />
            </>
          )}
          <Row title="All day" trailing={<Switch label="All day" checked={!timed} onChange={(v) => setTimed(!v)} />} />
          {timed && (
            <>
              <Row title="Starts" trailing={<input type="time" aria-label="Start time" value={minutesToInputValue(startMinute)} onChange={(e) => changeStartTime(e.target.value)} className={fieldClass} />} />
              <Row
                title="Ends"
                subtitle={`${minutesToLabel(startMinute)} – ${minutesToLabel(endMinute)} · ${Math.round(((endMinute - startMinute) / 60) * 10) / 10}h`}
                trailing={<input type="time" aria-label="End time" value={minutesToInputValue(endMinute)} onChange={(e) => changeEndTime(e.target.value)} className={fieldClass} />}
              />
            </>
          )}
        </Section>

        {/* 3 — The split, once there is one */}
        {!editing && rows.length > 1 && (
          <Section
            title={`${rows.length} sessions · ${shortDate(rows[0].date)} – ${shortDate(rows[rows.length - 1].date)}`}
            footer={
              dropped.size > 0 ? (
                <button type="button" onClick={() => setDropped(new Set())} className="text-tint font-medium">
                  Restore {dropped.size} dropped day{dropped.size === 1 ? '' : 's'}
                </button>
              ) : (
                'Drop a day and its chapters re-flow onto the others.'
              )
            }
          >
            {rows.map((row) => {
              const first = chapterMap.get(row.chapterIds[0])
              const extra = row.chapterIds.length - 1
              return (
                <div key={row.date} className="flex items-center gap-3 px-4 min-h-[48px]">
                  <span className="w-[58px] shrink-0 text-subhead text-label-2 tabular">{rowDate(row.date)}</span>
                  <span className="min-w-0 flex-1 text-subhead truncate">
                    {first?.title || 'Study'}
                    {extra > 0 && <span className="text-label-2"> +{extra}</span>}
                  </span>
                  {timed && <span className="shrink-0 text-footnote text-label-2 tabular">{minutesToLabel(startMinute, { omitMinutes: true })}</span>}
                  <button
                    type="button"
                    onClick={() => setDropped((prev) => new Set(prev).add(row.date))}
                    aria-label={`Drop ${rowDate(row.date)}`}
                    className="h-7 w-7 shrink-0 rounded-full bg-fill flex items-center justify-center text-label-2"
                  >
                    <X size={14} strokeWidth={2.6} />
                  </button>
                </div>
              )
            })}
          </Section>
        )}

        {/* Label + colour — overrides, only once a block exists */}
        {editing && (
          <Section title="Label" footer="Leave empty to use the chapter’s title.">
            <input
              type="text"
              value={title}
              maxLength={80}
              placeholder={activeChapter?.title || 'Label'}
              aria-label="Label"
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent px-4 h-[52px] text-body outline-none placeholder:text-label-3"
            />
          </Section>
        )}

        {editing && seriesCount > 1 && (
          <Section
            title="Apply changes to"
            footer={scope === 'series' ? 'Time, chapters, label and colour apply to every day in the run; each keeps its own date.' : undefined}
          >
            <div className="px-4 py-3">
              <Segmented
                ariaLabel="Apply to"
                value={scope}
                onChange={setScope}
                options={[
                  { id: 'single', label: 'This day' },
                  { id: 'series', label: `All ${seriesCount} days` },
                ]}
                className="w-full"
              />
            </div>
          </Section>
        )}

        {editing && (
          <Section>
            <Row
              center
              onClick={() => {
                onDelete(block.id)
                onClose()
              }}
            >
              <span className="flex items-center gap-2 text-body text-accent">
                <Trash2 size={17} /> Delete Session
              </span>
            </Row>
            {seriesCount > 1 && (
              <Row
                center
                onClick={() => {
                  onDeleteSeries(block.id)
                  onClose()
                }}
              >
                <span className="flex items-center gap-2 text-body text-accent">
                  <Trash2 size={17} /> Delete All {seriesCount} Days
                </span>
              </Row>
            )}
          </Section>
        )}
      </div>
    </Sheet>
  )
}
