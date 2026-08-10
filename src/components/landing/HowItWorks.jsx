import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Stagger } from './Reveal'
import { EASE } from './anim'

// The three steps as a three-up grid.
//
// This was a sticky scroll-story: the copy column scrolled while a single mock
// stayed pinned beside it. It read well in isolation but cost `space-y-52` +
// `pb-56` of structural padding — the sticky child unpins the moment its own
// bottom reaches its container's, so the empty space below step 3 was
// load-bearing rather than decorative. That made this band 1918px tall against
// a 709px FAQ, and the rhythm of the whole page bent around one section.
//
// Three columns show the same three screens in a fifth of the height, and each
// step now sits directly beside its own mock instead of being explained by a
// mock the reader has to scroll to reveal.

function StepCard({ children }) {
  return (
    <div className="rounded-card bg-surface border border-divider shadow-elevated p-4 h-[212px] flex flex-col justify-center">
      {children}
    </div>
  )
}

const STEPS = [
  {
    n: 1,
    title: 'Add it the day you study it',
    body: 'Subject, title, save. About ten seconds — and the only typing Cadence ever asks for.',
    mock: (
      <StepCard>
        <p className="text-eyebrow font-semibold uppercase text-ink-soft mb-2.5">New chapter</p>
        <div className="space-y-2">
          <div className="rounded-control bg-surface-2/50 px-3 py-2">
            <p className="text-[10px] text-ink-soft mb-0.5">Subject</p>
            <p className="text-ui font-medium">Higher Math</p>
          </div>
          <div className="rounded-control bg-surface-2/50 px-3 py-2 ring-1 ring-brand/30">
            <p className="text-[10px] text-ink-soft mb-0.5">Chapter</p>
            <p className="text-ui font-medium">
              Coordinate Geometry
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-px h-[13px] align-middle bg-brand ml-0.5"
              />
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-capsule bg-brand text-white text-meta font-medium py-1.5 text-center">
          Save chapter
        </div>
      </StepCard>
    ),
  },
  {
    n: 2,
    title: 'Five dates appear on their own',
    body: 'Tomorrow, then three days, a week, a fortnight, then a month. Nothing to configure, so nothing to get wrong.',
    mock: (
      <StepCard>
        <p className="text-eyebrow font-semibold uppercase text-ink-soft mb-2.5">
          Scheduled automatically
        </p>
        <div className="space-y-1.5">
          {[
            ['Review 1', 'Tomorrow', 'Day 1'],
            ['Review 2', 'Fri 12 Sep', 'Day 4'],
            ['Review 3', 'Fri 19 Sep', 'Day 11'],
            ['Review 4', 'Sat 4 Oct', 'Day 26'],
            ['Review 5', 'Mon 3 Nov', 'Day 56'],
          ].map(([label, when, day], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.09, ease: EASE }}
              className="flex items-center gap-2.5 rounded-chip bg-surface-2/40 px-2.5 py-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
              <p className="text-meta font-medium flex-1">{label}</p>
              <p className="text-[11px] text-ink-soft font-tabular">{when}</p>
              <span className="text-[10px] font-semibold text-brand bg-brand/10 rounded-full px-1.5 py-0.5 font-tabular">
                {day}
              </span>
            </motion.div>
          ))}
        </div>
      </StepCard>
    ),
  },
  {
    n: 3,
    title: 'Clear the short list each morning',
    body: 'Revise what is due from your own notes and tick it off. Empty list means you are done for the day.',
    mock: (
      <StepCard>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-eyebrow font-semibold uppercase text-ink-soft">Today</p>
          <p className="text-eyebrow text-brand font-medium font-tabular">1 left</p>
        </div>
        <div className="space-y-1.5">
          {[
            ['Periodic Trends', true],
            ['Vector Algebra', true],
            ['Coordinate Geometry', false],
          ].map(([title, done]) => (
            <div
              key={title}
              className={`flex items-center gap-2.5 rounded-chip px-2.5 py-2 ${
                done ? 'bg-surface-2/40' : 'bg-surface border border-divider'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                  done ? 'bg-brand' : 'border-[1.5px] border-ink-soft/40'
                }`}
              >
                {done && <Check size={9} strokeWidth={3.5} className="text-white" />}
              </span>
              <p className={`text-meta font-medium truncate ${done ? 'text-ink-soft line-through' : ''}`}>
                {title}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-soft mt-2.5 text-center">Roughly six minutes.</p>
      </StepCard>
    ),
  },
]

export default function HowItWorks() {
  return (
    <Stagger className="grid sm:grid-cols-3 gap-x-8 gap-y-12 mt-14" stagger={0.1}>
      {STEPS.map((s) => (
        <Stagger.Item key={s.n}>
          {/* Mock first: the screen is the explanation, the copy is the caption. */}
          {s.mock}
          <div className="mt-5 flex items-baseline gap-2.5">
            <span className="font-tabular text-meta font-semibold text-brand">{s.n}</span>
            <h3 className="font-display text-display-xs font-semibold">{s.title}</h3>
          </div>
          <p className="text-body text-ink-soft mt-2">{s.body}</p>
        </Stagger.Item>
      ))}
    </Stagger>
  )
}
