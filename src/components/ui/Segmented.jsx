import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { snappy } from './motion'

// UISegmentedControl, in iOS 26's capsule shape. The selection is one shared
// element that slides between segments.
export default function Segmented({ options, value, onChange, layoutId, className = '', size = 'md', ariaLabel }) {
  // The pill's shared-layout animation measures against wherever this
  // layoutId was last seen, which on the first frame after mount can be a
  // stale box from the previous screen — so it would fly in from off-position.
  // Holding the layoutId back for one frame lets it register where it sits.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const f = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(f)
  }, [])

  const h = size === 'sm' ? 'h-8' : 'h-9'
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative inline-flex items-stretch p-[2px] rounded-full bg-fill ${h} ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className="relative flex-1 min-w-0 px-3.5 rounded-full text-footnote font-semibold whitespace-nowrap"
          >
            {active && (
              <motion.span
                layoutId={settled ? layoutId : undefined}
                transition={snappy}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--segment-pill)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.04)',
                }}
              />
            )}
            <span className={`relative flex items-center justify-center gap-1.5 ${active ? 'text-label' : 'text-label-2'}`}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
