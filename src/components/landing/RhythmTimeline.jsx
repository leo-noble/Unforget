import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { REVIEW_DAYS, REVIEW_GAPS, formatGap } from '../../lib/reviewSchedule'

// A chapter's whole life on one line. The spacing is the message: each wait is
// drawn wider than the last. Every label is derived from the engine's own
// schedule, so this can't fall out of step with it again (it once had five
// labels for six points).
const LABELS = REVIEW_DAYS.map((_, i) => (i === 0 ? 'Studied' : i === REVIEW_DAYS.length - 1 ? 'Mastered' : `Review ${i}`))

function Marker({ i }) {
  const last = i === REVIEW_DAYS.length - 1
  if (i === 0) return <span className="block h-5 w-5 rounded-full" style={{ boxShadow: 'inset 0 0 0 2px var(--label)' }} />
  return <span className={`block h-5 w-5 rounded-full ${last ? 'bg-data' : 'bg-label'}`} />
}

export default function RhythmTimeline() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref}>
      {/* Horizontal, md and up: evenly spaced stops, the growing wait written
          between them, so no two labels can collide. */}
      <div className="hidden md:grid grid-cols-6">
        {REVIEW_DAYS.map((day, i) => (
          <motion.div
            key={day}
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.12 }}
          >
            {i < REVIEW_GAPS.length && (
              <>
                <div className="absolute top-[9px] left-1/2 w-full h-[2px] bg-[repeating-linear-gradient(90deg,var(--label-3)_0_2px,transparent_2px_7px)]" />
                <span className="absolute -top-6 left-full -translate-x-1/2 whitespace-nowrap text-footnote text-label-3">+{formatGap(REVIEW_GAPS[i])}</span>
              </>
            )}
            <div className="relative"><Marker i={i} /></div>
            <p className="font-display text-[20px] leading-none tabular whitespace-nowrap mt-3">Day {day}</p>
            <p className="text-footnote text-label-2 whitespace-nowrap mt-1.5">{LABELS[i]}</p>
          </motion.div>
        ))}
      </div>

      {/* Vertical, phones */}
      <div className="md:hidden">
        {REVIEW_DAYS.map((day, i) => (
          <div key={day}>
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.16 }}
            >
              <div className="w-8 flex justify-center shrink-0">
                <Marker i={i} />
              </div>
              <p className="text-[17px] font-semibold tabular">Day {day}</p>
              <p className="text-[15px] text-label-2 ml-auto">{LABELS[i]}</p>
            </motion.div>
            {i < REVIEW_GAPS.length && (
              <div className="flex items-center gap-4" style={{ height: 34 + i * 16 }}>
                <div className="w-8 flex justify-center shrink-0 self-stretch py-1.5">
                  <motion.div
                    className="w-[2px] bg-[repeating-linear-gradient(180deg,var(--label-3)_0_2px,transparent_2px_7px)] origin-top"
                    initial={{ scaleY: 0 }}
                    animate={inView ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.16 }}
                  />
                </div>
                <span className="text-[14px] text-label-3">+{formatGap(REVIEW_GAPS[i])}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
