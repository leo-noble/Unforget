import { useId } from 'react'
import { motion } from 'framer-motion'

// An Activity-style ring: a gradient stroke on a faint track with a round cap.
export default function ProgressRing({
  progress = 0,
  size = 120,
  stroke = 12,
  from = 'var(--tint)',
  to = 'var(--tint-2)',
  track = 'var(--fill)',
  children,
  className = '',
  duration = 0.9,
}) {
  const id = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - p), opacity: p > 0 ? 1 : 0 }}
          transition={{ duration, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
