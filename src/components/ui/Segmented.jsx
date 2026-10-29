import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { snappy } from './motion'

// A single persistent glass lens moves between the options. Measuring within
// this control keeps its first position local to the current tab and layout.
export default function Segmented({ options, value, onChange, className = '', size = 'md', ariaLabel }) {
  const containerRef = useRef(null)
  const optionRefs = useRef(new Map())
  const [indicator, setIndicator] = useState(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const measure = () => {
      const selected = optionRefs.current.get(value)
      if (!selected || !containerRef.current) return
      const parentRect = containerRef.current.getBoundingClientRect()
      const selectedRect = selected.getBoundingClientRect()
      setIndicator({ left: selectedRect.left - parentRect.left, width: selectedRect.width })
    }

    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(container)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [value, options.length])

  const h = size === 'sm' ? 'h-8' : 'h-9'
  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative isolate inline-flex items-stretch p-[2px] rounded-full bg-fill ${h} ${className}`}
    >
      {indicator && (
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={snappy}
          className="absolute top-[2px] bottom-[2px] z-0 rounded-full pointer-events-none"
          style={{
            background: 'var(--segment-pill)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.04)',
          }}
        />
      )}
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            ref={(node) => {
              if (node) optionRefs.current.set(opt.id, node)
              else optionRefs.current.delete(opt.id)
            }}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className="relative z-[1] flex-1 min-w-0 px-3.5 rounded-full text-footnote font-medium whitespace-nowrap"
          >
            <span className={`relative flex items-center justify-center gap-1.5 ${active ? 'text-label' : 'text-label-2'}`}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
