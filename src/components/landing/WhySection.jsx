import { SectionHead } from './Section'
import { Stagger } from './Reveal'

// The counter-argument: what most students do instead, and why the schedule
// beats it. Plain prose separated by space and a change of weight — no cards,
// no icons, because this part is an argument and decoration would undercut it.
//
// The header routes through SectionHead rather than hand-rolling an h2, which
// is what previously put a 42px heading next to the page's 44px ones — close
// enough to look like a mistake, far enough to break the hierarchy.
const HABITS = [
  {
    label: 'Re-reading the chapter',
    body: 'Familiarity is not recall. You recognise the page without being able to reproduce it.',
  },
  {
    label: 'Cramming the week before',
    body: 'Works for Friday, gone by the following month. August has to be learned again in December.',
  },
  {
    label: 'Highlighting and re-writing notes',
    body: 'Hours spent producing a tidier copy of something you already have. The tidying is not the studying.',
  },
]

export default function WhySection() {
  return (
    <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 items-start">
      <SectionHead
        eyebrow="Why it works"
        title="Revision fails for boring reasons."
        lede="Not because students are lazy — because the habits everyone falls back on all feel like work while doing very little for memory."
      />

      <Stagger className="space-y-7 md:pt-2" stagger={0.09}>
        {HABITS.map((h) => (
          <Stagger.Item key={h.label}>
            <div className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 rounded-full bg-ink-soft/40 shrink-0"
              />
              <div>
                <h3 className="text-body font-medium mb-1">{h.label}</h3>
                <p className="text-body text-ink-soft">{h.body}</p>
              </div>
            </div>
          </Stagger.Item>
        ))}
        <Stagger.Item>
          {/* The payoff row. Tinted rather than bulleted, so the eye lands on
              the answer instead of reading it as a fourth complaint. */}
          <div className="flex gap-4 rounded-card bg-brand/[0.06] p-4 -ml-4">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
            <div>
              <h3 className="text-body font-medium mb-1 text-brand">Five spaced reviews</h3>
              <p className="text-body text-ink-soft">
                Around fifty minutes per chapter, spread over eight weeks, and it is still there at
                the end of the year. The only hard part is doing it on the right day.
              </p>
            </div>
          </div>
        </Stagger.Item>
      </Stagger>
    </div>
  )
}
