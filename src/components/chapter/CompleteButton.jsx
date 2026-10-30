import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { STATUS_TONE } from './meta'
import { bouncy } from '../ui/motion'

// Reminders' completion circle. Tapping it fills with a springy check first
// and only then reports completion, so you see the tick land before the row
// slides away.
export default function CompleteButton({ status, onComplete, onLocked, label }) {
  const [checking, setChecking] = useState(false)
  const timer = useRef(null)
  const reduceMotion = useReducedMotion()
  useEffect(() => () => clearTimeout(timer.current), [])

  if (status === 'mastered') {
    return (
      <span
        className="h-[26px] w-[26px] shrink-0 rounded-full flex items-center justify-center text-tint-fg"
        style={{ background: STATUS_TONE.mastered }}
        aria-label="Mastered"
        role="img"
      >
        <Check size={15} strokeWidth={3.2} />
      </span>
    )
  }

  if (status === 'upcoming') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onLocked?.()
        }}
        aria-label={`${label} is not due yet`}
        className="h-[26px] w-[26px] shrink-0 rounded-full border-[1.5px] border-dashed border-label-3 flex items-center justify-center text-label-3"
      >
        <Lock size={11} strokeWidth={2.6} />
      </button>
    )
  }

  const color = STATUS_TONE[status] || STATUS_TONE.due
  return (
    <motion.button
      type="button"
      whileTap={reduceMotion ? undefined : { scale: 0.85 }}
      animate={checking && !reduceMotion ? { scale: [1, 1.2, 0.96, 1] } : { scale: 1 }}
      transition={checking && !reduceMotion ? { duration: 0.38, ease: [0.22, 1, 0.36, 1] } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        if (checking) return
        setChecking(true)
        if (navigator.vibrate) navigator.vibrate(8)
        timer.current = setTimeout(() => {
          const result = onComplete?.()
          if (result?.blocked) setChecking(false)
        }, 420)
      }}
      aria-label={`Mark ${label} as revised`}
      className="relative h-[26px] w-[26px] shrink-0 rounded-full flex items-center justify-center"
      style={{ boxShadow: `inset 0 0 0 1.5px ${color}` }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={checking && !reduceMotion ? { scale: [1, 1.8], opacity: [0.5, 0] } : { scale: 1, opacity: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        style={{ boxShadow: `inset 0 0 0 1.5px ${color}` }}
      />
      <motion.span
        initial={false}
        animate={{ scale: checking ? 1 : 0, opacity: checking ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0.12 } : bouncy}
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{ background: color, color: 'var(--tint-fg)' }}
      >
        <Check size={15} strokeWidth={3.2} />
      </motion.span>
      {!reduceMotion && checking && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {[
            { x: 0, y: -16 },
            { x: 16, y: 0 },
            { x: 0, y: 16 },
            { x: -16, y: 0 },
          ].map(({ x, y }, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1 w-1 -ml-0.5 -mt-0.5 rounded-full bg-label"
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
              animate={{ x, y, scale: [0.4, 1.2, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.42, delay: 0.08, ease: 'easeOut' }}
            />
          ))}
        </span>
      )}
    </motion.button>
  )
}
