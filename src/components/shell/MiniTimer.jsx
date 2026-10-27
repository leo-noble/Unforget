import { motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useTimer } from '../../lib/TimerContext'
import { PHASE_COLOR } from '../focus/phase'
import { snappy } from '../ui/motion'

// The running session as a live-activity pill: what phase, how long left, and
// a play/pause you can hit without leaving the screen you're on.
export default function MiniTimer({ onOpen, chapterMap, compact = false }) {
  const timer = useTimer()
  if (!timer) return null
  const chapterTitle = timer.phase === 'work' ? chapterMap?.get(timer.linkedChapterId)?.title : null
  const color = PHASE_COLOR[timer.phase]
  const running = timer.status === 'running'
  const R = 11
  const C = 2 * Math.PI * R

  return (
    <div
      className={`glass pointer-events-auto flex items-center gap-3 rounded-[14px] ${
        compact ? 'h-[52px] pl-2 pr-1.5' : 'h-[54px] pl-2.5 pr-2'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 flex items-center gap-3 text-left h-full"
        aria-label={`Open Focus — ${timer.timeLabel}`}
      >
        <span className="relative h-9 w-9 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="14" cy="14" r={R} fill="none" stroke="var(--fill-2)" strokeWidth="3" />
            <circle
              cx="14"
              cy="14"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - timer.progress)}
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <span className={`h-2 w-2 rounded-full ${running ? 'pulse-dot' : ''}`} style={{ background: color }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block eyebrow text-label truncate">{timer.meta.label}</span>
          <span className="block text-caption text-label-2 truncate">
            {chapterTitle || (running ? 'In progress' : 'Paused')}
          </span>
        </span>
        <span className="font-display text-[24px] leading-none tabular">
          {timer.mins}:{timer.secs}
        </span>
      </button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        transition={snappy}
        onClick={timer.toggle}
        aria-label={running ? 'Pause' : 'Resume'}
        className="h-9 w-9 shrink-0 rounded-[10px] flex items-center justify-center bg-fill"
      >
        {running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </motion.button>
    </div>
  )
}
