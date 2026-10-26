import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { REVIEW_DAYS, REVIEW_GAPS, dayToFraction, fractionToDay } from '../../lib/reviewSchedule'
import { APP_NAME } from '../../brand'

// How much of a chapter you still hold over its first eight weeks — once with
// no review, once on the schedule. The shapes are modelled, not measured:
// recall decays exponentially between reviews, each review resets it to full,
// and each one makes the next decay gentler.
//
// DIPS (how far recall may fall before each review) is derived from the
// engine's gaps, one per review. It used to be a hand-written four-entry list;
// when the schedule grew a fifth review the last segment computed NaN and the
// line simply stopped.
const DIPS = REVIEW_GAPS.map((_, i) => Math.min(0.95, 0.82 + i * 0.03))
const TAIL_STRENGTH = 400

const W = 640
const H = 320
const PAD = { l: 40, r: 54, t: 24, b: 40 }
const PW = W - PAD.l - PAD.r
const PH = H - PAD.t - PAD.b
const LAST_REVIEW = REVIEW_DAYS[REVIEW_DAYS.length - 1]
// A week of runway past the final review, so the flat "it stuck" tail shows.
const DOMAIN = LAST_REVIEW + 8

const x = (day) => PAD.l + dayToFraction(day, DOMAIN) * PW
const y = (recall) => PAD.t + (1 - recall) * PH
const noReview = (day) => 0.1 + 0.9 * Math.exp(-day / 3.2)

// Sampled evenly across the drawing, not across days, so the steep first day
// gets enough points to render as a curve rather than corners.
function samplePath(fromDay, toDay, recallAt, steps) {
  const f0 = dayToFraction(fromDay, DOMAIN)
  const f1 = dayToFraction(toDay, DOMAIN)
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const day = fractionToDay(f0 + ((f1 - f0) * i) / steps, DOMAIN)
    pts.push([x(day), y(recallAt(day))])
  }
  return pts
}

function scheduledPoints() {
  const pts = []
  REVIEW_GAPS.forEach((gap, i) => {
    const start = REVIEW_DAYS[i]
    const strength = gap / Math.log(1 / DIPS[i])
    pts.push(...samplePath(start, start + gap, (d) => Math.exp(-(d - start) / strength), 60))
    pts.push([x(start + gap), y(1)])
  })
  pts.push(...samplePath(LAST_REVIEW, DOMAIN, (d) => Math.exp(-(d - LAST_REVIEW) / TAIL_STRENGTH), 30))
  return pts
}

const toPath = (pts) => `M${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}`
const close = (p) => `${p}L${x(DOMAIN).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`

const NO_REVIEW_PATH = toPath(samplePath(0, DOMAIN, noReview, 220))
const SCHEDULED_PATH = toPath(scheduledPoints())
const END_SCHEDULED = Math.exp(-(DOMAIN - LAST_REVIEW) / TAIL_STRENGTH)
const END_NO_REVIEW = noReview(DOMAIN)

export default function ForgettingCurve() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const draw = inView ? { pathLength: 1 } : {}

  return (
    <div ref={ref} className="bg-card rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="text-headline font-medium">How much you still remember</h3>
        <div className="flex items-center gap-4 text-footnote font-medium">
          <span className="flex items-center gap-2">
            <span className="h-[3px] w-5 rounded-full bg-red" /> With {APP_NAME}
          </span>
          <span className="flex items-center gap-2 text-label-2">
            <span className="h-[3px] w-5 rounded-full bg-label-3" /> No reviews
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full mt-4 overflow-visible"
        role="img"
        aria-label="Without reviews, recall drops to about ten percent within a week. With spaced reviews, each review returns it to full and each one holds longer, finishing near one hundred percent."
      >
        <defs>
          <linearGradient id="fc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--red)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[1, 0.5, 0].map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--separator)" strokeWidth="1" />
            <text x={PAD.l - 9} y={y(g) + 4} textAnchor="end" fill="var(--label-2)" fontSize="11" className="tabular">
              {g * 100}%
            </text>
          </g>
        ))}
        <motion.path d={close(NO_REVIEW_PATH)} fill="var(--label)" fillOpacity="0.04" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.7 }} />
        <motion.path d={close(SCHEDULED_PATH)} fill="url(#fc-area)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.9 }} />
        <motion.path d={NO_REVIEW_PATH} fill="none" stroke="var(--label-3)" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }} />
        <motion.path
          d={SCHEDULED_PATH}
          fill="none"
          stroke="var(--red)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={draw}
          transition={{ duration: 1.4, delay: 0.15, ease: 'easeInOut' }}
        />
        {REVIEW_DAYS.slice(1).map((day, i) => (
          <motion.circle
            key={day}
            cx={x(day)}
            cy={y(1)}
            r="5"
            fill="var(--red)"
            stroke="var(--card)"
            strokeWidth="2.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 340, damping: 20, delay: 0.5 + i * 0.15 }}
          />
        ))}
        <motion.text x={W - PAD.r + 9} y={y(END_SCHEDULED) + 4} fill="var(--red)" fontSize="14" fontWeight="700" fontFamily="Geist, sans-serif" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.4 }}>
          {Math.round(END_SCHEDULED * 100)}%
        </motion.text>
        <motion.text x={W - PAD.r + 9} y={y(END_NO_REVIEW) + 4} fill="var(--label-2)" fontSize="13" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}>
          {Math.round(END_NO_REVIEW * 100)}%
        </motion.text>
        {REVIEW_DAYS.map((day, i) => (
          <text key={day} x={x(day)} y={H - PAD.b + 22} textAnchor="middle" fill="var(--label-2)" fontSize="11">
            {i === 0 ? 'Day 0' : day}
          </text>
        ))}
      </svg>
    </div>
  )
}
