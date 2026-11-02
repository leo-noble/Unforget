import { useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Check, Clock, AlertCircle } from 'lucide-react'
import CompleteButton from './CompleteButton'
import { reviewLabel, shortWhen, isActionable, STATUS_TONE } from './meta'
import { easeOut } from '../ui/motion'

const SWIPE_TRIGGER = 96

// One chapter in a list. Tap the circle to mark it revised, tap the row for
// its timeline, or — like Mail and Reminders — swipe right to mark revised and
// left to snooze a day. Swipes only exist on rows that are actually due.
// `strength` (0-1) draws the memory meter; `selected` marks the row the
// keyboard is on.
export default function ChapterRow({ chapter, subject, onOpen, onRevise, onSnooze, onLocked, showSubject = true, strength, selected = false }) {
  const actionable = isActionable(chapter)
  const x = useMotionValue(0)
  const dragged = useRef(false)
  const reviseOpacity = useTransform(x, [8, 56], [0, 1])
  const snoozeOpacity = useTransform(x, [-56, -8], [1, 0])
  // Rows are translucent, so each action fills only the strip the row has
  // uncovered rather than sitting underneath the whole row.
  const reviseWidth = useTransform(x, (v) => Math.max(0, v))
  const snoozeWidth = useTransform(x, (v) => Math.max(0, -v))
  const reviseScale = useTransform(x, [20, SWIPE_TRIGGER * 0.6], [0.6, 1])
  const snoozeScale = useTransform(x, [-SWIPE_TRIGGER * 0.6, -20], [1, 0.6])

  const when = shortWhen(chapter)
  const tone = STATUS_TONE[chapter.derivedStatus]

  function open() {
    if (dragged.current) {
      dragged.current = false
      return
    }
    onOpen?.(chapter)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.28, ease: easeOut } }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="relative overflow-hidden"
      data-chapter-id={chapter.id}
      style={{ '--inset': '50px' }}
    >
      {actionable && (
        <>
          <motion.div
            aria-hidden="true"
            style={{ opacity: reviseOpacity, width: reviseWidth }}
            className="absolute inset-y-0 left-0 overflow-hidden bg-tint flex items-center pl-6 text-tint-fg whitespace-nowrap"
          >
            <motion.span style={{ scale: reviseScale }} className="flex items-center gap-2 text-footnote font-medium">
              <Check size={16} strokeWidth={2.4} /> Revised
            </motion.span>
          </motion.div>
          <motion.div
            aria-hidden="true"
            style={{ opacity: snoozeOpacity, width: snoozeWidth }}
            className="absolute inset-y-0 right-0 overflow-hidden bg-fill-2 flex items-center justify-end pr-6 text-label whitespace-nowrap"
          >
            <motion.span style={{ scale: snoozeScale }} className="flex items-center gap-2 text-footnote font-medium">
              Tomorrow <Clock size={16} strokeWidth={2} />
            </motion.span>
          </motion.div>
        </>
      )}

      <motion.div
        drag={actionable ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        dragSnapToOrigin
        style={{ x }}
        onPointerDown={() => {
          dragged.current = false
        }}
        onDragStart={() => {
          dragged.current = true
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_TRIGGER) onRevise?.(chapter)
          else if (info.offset.x < -SWIPE_TRIGGER) onSnooze?.(chapter)
        }}
        className="relative"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen?.(chapter)
            }
          }}
          className={`flex items-center gap-3.5 pl-4 pr-4 py-2.5 min-h-[54px] cursor-pointer hover:bg-fill active:bg-fill transition-colors duration-75 select-none ${selected ? 'bg-fill' : ''}`}
        >
          <CompleteButton
            key={`${chapter.id}-${chapter.currentReviewIndex}-${chapter.nextReviewDate}`}
            status={chapter.derivedStatus}
            label={chapter.title}
            onComplete={() => onRevise?.(chapter)}
            onLocked={() => onLocked?.(chapter)}
          />
          <div className="min-w-0 flex-1">
            <p className="text-body truncate">{chapter.title}</p>
            <p className="text-footnote text-label-2 truncate">
              {showSubject && subject && (
                <>
                  {subject.name}
                  <span className="text-label-3"> · </span>
                </>
              )}
              {reviewLabel(chapter)}
            </p>
          </div>
          {chapter.struggleFlag && chapter.derivedStatus !== 'mastered' && (
            <AlertCircle size={15} strokeWidth={1.8} className="shrink-0 text-label-2" aria-label="Needs extra attention" />
          )}
          {strength != null && <StrengthMeter value={strength} />}
          <span
            className="shrink-0 w-[68px] text-right text-footnote tabular"
            style={{ color: chapter.derivedStatus === 'upcoming' || !when ? 'var(--label-2)' : tone }}
          >
            {when || 'Done'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// How well the chapter is probably remembered right now, as a short bar in the
// data hue. The number is in its label for screen readers and on hover.
export function StrengthMeter({ value, className = '' }) {
  const pct = Math.round(value * 100)
  return (
    <span className={`hidden sm:block shrink-0 w-10 h-1 rounded-full bg-fill-2 overflow-hidden ${className}`} role="img" aria-label={`Memory ${pct}%`} title={`Memory ${pct}%`}>
      <span className="block h-full rounded-full bg-data" style={{ width: `${Math.max(4, pct)}%` }} />
    </span>
  )
}
