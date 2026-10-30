import { Check } from 'lucide-react'
import { formatRange, blockTitle, blockColor } from '../../lib/timeGrid'
import { subjectColor } from '../../lib/colors'

// One positioned study block in the hour canvas.
//
// Pointer events rather than HTML5 drag-and-drop, which has no touch support.
// The whole block is the drag surface; a press that doesn't move opens it
// (the grid decides which, since it owns the gesture). The parent does the
// geometry — this only reports where a gesture started and on which handle.
export default function StudyBlock({
  block,
  chapters,
  subject,
  layout,
  dragging,
  onPointerDownMove,
  onPointerDownResize,
  onToggleDone,
  onOpen,
}) {
  const color = subjectColor(blockColor(block, subject))
  const title = blockTitle(block, chapters)
  const timed = Number.isFinite(block.startMinute)
  const extra = Math.max(0, chapters.length - 1)

  // Side-by-side packing for overlapping blocks.
  const width = `calc(${100 / layout.columns}% - 4px)`
  const left = `calc(${(layout.column * 100) / layout.columns}% + 2px)`

  const timeLabel = timed ? formatRange(block.startMinute, block.endMinute) : 'All day'
  const fullLabel = extra > 0 ? `${timeLabel} — ${title} +${extra} more` : `${timeLabel} — ${title}`

  // At 52px an hour a 45-minute block is 39px tall — under ~44px the time
  // drops away, under ~26px the checkbox goes too (the sheet carries it).
  const short = layout.height < 44
  const tiny = layout.height < 26

  return (
    <div
      role="button"
      data-calendar-block="true"
      tabIndex={0}
      aria-label={fullLabel}
      title={fullLabel}
      onPointerDown={onPointerDownMove}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      style={{
        top: layout.top + 1,
        height: Math.max(layout.height - 2, 18),
        width,
        left,
        background: `color-mix(in srgb, ${color} ${dragging ? 30 : 18}%, var(--card))`,
        boxShadow: dragging ? `0 12px 28px -8px color-mix(in srgb, ${color} 55%, transparent)` : 'none',
        transform: dragging ? 'scale(1.02)' : 'none',
        // Scrolling still starts on a block; a hold is what turns it into a drag.
        touchAction: 'pan-x pan-y',
        WebkitTouchCallout: 'none',
      }}
      className={`group absolute rounded-[9px] overflow-hidden select-none cursor-grab active:cursor-grabbing transition-[box-shadow,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-tint ${
        dragging ? 'z-20' : 'z-10'
      } ${block.done ? 'opacity-55' : ''}`}
    >
      <span aria-hidden="true" className="absolute left-0 inset-y-0 w-[3.5px]" style={{ background: color }} />
      <div className={`h-full w-full pl-[9px] pr-1.5 ${tiny ? 'py-0' : 'py-1'}`}>
        <div className={`flex gap-1.5 ${tiny ? 'items-center h-full' : 'items-start'}`}>
          {!tiny && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onToggleDone()
              }}
              role="checkbox"
              aria-checked={block.done}
              aria-label={`Mark ${title} studied`}
              className="mt-[1px] h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-tint-fg"
              style={{
                background: block.done ? color : 'var(--card)',
                boxShadow: block.done ? 'none' : `inset 0 0 0 1.5px ${color}`,
              }}
            >
              {block.done && <Check size={10} strokeWidth={3.5} />}
            </button>
          )}
          <span className="min-w-0 flex-1">
            <span
              className={`block text-[12.5px] leading-[1.3] font-medium truncate ${block.done ? 'line-through' : ''}`}
              style={{ color: `color-mix(in srgb, ${color} 70%, var(--label))` }}
            >
              {title}
            </span>
            {!short && <span className="block text-[11px] leading-[1.35] text-label-2 truncate tabular">{timeLabel}</span>}
            {extra > 0 && !short && <span className="block text-[11px] leading-[1.35] text-label-2 truncate">+{extra} more</span>}
          </span>
        </div>
      </div>

      {timed && (
        <div
          onPointerDown={onPointerDownResize}
          role="separator"
          aria-label={`Resize ${title}`}
          className="absolute bottom-0 inset-x-0 h-3 cursor-ns-resize flex items-end justify-center pb-[3px]"
          style={{ touchAction: 'none' }}
        >
          <span className="h-[3px] w-7 rounded-full bg-label-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  )
}
