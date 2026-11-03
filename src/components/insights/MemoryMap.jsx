import { BANDS } from '../../lib/memory'

const STEP_CLASS = { 4: 'bg-data-4', 3: 'bg-data-3', 2: 'bg-data-2', 1: 'bg-data-1' }

// The legend's swatches are the cells themselves, scaled down.
export function MemoryLegend({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-label-2 ${className}`}>
      {BANDS.map((b) => (
        <span key={b.id} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${STEP_CLASS[b.step]}`} aria-hidden="true" />
          {b.label}
        </span>
      ))}
    </div>
  )
}

// Every chapter as one cell, grouped by subject and shaded by how well it's
// probably remembered right now: the strongest in full blue, the ones slipping
// away nearly white. Weakest first in each row, so the left edge is where to
// look. Tap a cell to open the chapter.
export default function MemoryMap({ groups, onOpen, compact = false, stacked = false }) {
  if (!groups.length) {
    return <p className="text-subhead text-label-2">Add a chapter and its memory shows up here.</p>
  }
  const size = compact ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]'
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {groups.map(({ subject, items, average }) => (
        <div key={subject.id} className={`grid gap-x-4 gap-y-1.5 ${stacked ? '' : 'sm:grid-cols-[168px_1fr_40px] sm:items-center'}`}>
          <div className={`flex items-baseline justify-between gap-3 min-w-0 ${stacked ? '' : 'sm:block'}`}>
            <p className="text-subhead truncate">{subject.name}</p>
            <p className={`text-footnote text-label-2 tabular ${stacked ? '' : 'sm:hidden'}`}>{Math.round(average * 100)}%</p>
          </div>
          <div className="flex flex-wrap gap-[3px]">
            {items.map(({ chapter, value, band }) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => onOpen?.(chapter)}
                title={`${chapter.title}: ${Math.round(value * 100)}%`}
                aria-label={`${chapter.title}, ${band.label.toLowerCase()}, ${Math.round(value * 100)}%`}
                className={`${size} rounded-full ${STEP_CLASS[band.step]} hover:outline hover:outline-1 hover:outline-offset-1 hover:outline-label`}
              />
            ))}
          </div>
          {!stacked && <p className="hidden sm:block text-footnote text-label-2 tabular text-right">{Math.round(average * 100)}%</p>}
        </div>
      ))}
    </div>
  )
}
