import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { STATUS_TONE } from './meta'
import { bouncy } from '../ui/motion'

// Reminders' completion circle. Tapping it fills with a springy check first
// and only then reports completion, so you see the tick land before the row
// slides away.
export default function CompleteButton({ status, onComplete, onLocked, label }) {
  const [checking, setChecking] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  if (status === 'mastered') {
    return (
      <span
        className="h-[26px] w-[26px] shrink-0 rounded-full flex items-center justify-center text-white"
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
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation()
        if (checking) return
        setChecking(true)
        if (navigator.vibrate) navigator.vibrate(8)
        timer.current = setTimeout(() => onComplete?.(), 420)
      }}
      aria-label={`Mark ${label} as revised`}
      className="relative h-[26px] w-[26px] shrink-0 rounded-full flex items-center justify-center"
      style={{ boxShadow: `inset 0 0 0 1.8px ${color}` }}
    >
      <motion.span
        initial={false}
        animate={{ scale: checking ? 1 : 0, opacity: checking ? 1 : 0 }}
        transition={bouncy}
        className="absolute inset-0 rounded-full flex items-center justify-center text-white"
        style={{ background: color }}
      >
        <Check size={15} strokeWidth={3.2} />
      </motion.span>
    </motion.button>
  )
}
