import { useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Check, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import CompleteButton from './CompleteButton'
import { reviewLabel, shortWhen, isActionable, STATUS_TONE } from './meta'
import { subjectColor } from '../../lib/colors'
import { easeOut } from '../ui/motion'

const SWIPE_TRIGGER = 96

// One chapter in a list. Tap the circle to mark it revised, tap the row for
// its timeline, or — like Mail and Reminders — swipe right to mark revised and
// left to snooze a day. Swipes only exist on rows that are actually due.
export default function ChapterRow({ chapter, subject, onOpen, onRevise, onSnooze, onLocked, showSubject = true }) {
  const actionable = isActionable(chapter)
  const x = useMotionValue(0)
  const dragged = useRef(false)
  const reviseOpacity = useTransform(x, [8, 56], [0, 1])
  const snoozeOpacity = useTransform(x, [-56, -8], [1, 0])
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
      style={{ '--inset': '54px' }}
    >
      {actionable && (
        <>
          <motion.div
            aria-hidden="true"
            style={{ opacity: reviseOpacity }}
            className="absolute inset-0 bg-green flex items-center pl-6 text-tint-fg"
          >
            <motion.span style={{ scale: reviseScale }} className="flex items-center gap-2 eyebrow">
              <Check size={18} strokeWidth={2.4} /> Revised
            </motion.span>
          </motion.div>
          <motion.div
            aria-hidden="true"
            style={{ opacity: snoozeOpacity }}
            className="absolute inset-0 bg-red flex items-center justify-end pr-6 text-white"
          >
            <motion.span style={{ scale: snoozeScale }} className="flex items-center gap-2 eyebrow">
              Tomorrow <Clock size={18} strokeWidth={2} />
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
        className="relative bg-card"
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
          className="flex items-center gap-3 pl-4 pr-3 py-3 min-h-[64px] cursor-pointer active:bg-fill transition-colors duration-75 select-none"
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
            <p className="text-subhead text-label-2 truncate mt-0.5">
              {showSubject && subject && (
                <>
                  <span
                    className="inline-block h-[7px] w-[7px] rounded-full align-[1px] mr-1.5"
                    style={{ background: subjectColor(subject.colorTag) }}
                  />
                  {subject.name}
                  <span className="text-label-3"> · </span>
                </>
              )}
              {reviewLabel(chapter)}
            </p>
          </div>
          {when && (
            <span
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] tabular"
              style={{ color: chapter.derivedStatus === 'upcoming' ? 'var(--label-2)' : tone }}
            >
              {when}
            </span>
          )}
          {chapter.struggleFlag && chapter.derivedStatus !== 'mastered' && (
            <AlertCircle size={17} className="shrink-0 text-orange" aria-label="Needs extra attention" />
          )}
          <ChevronRight size={17} strokeWidth={2.4} className="shrink-0 text-label-3" />
        </div>
      </motion.div>
    </motion.div>
  )
}
