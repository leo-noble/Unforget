import { motion } from 'framer-motion'

// The shell every app screen sits in. Before this, six pages each hand-rolled
// their own wrapper and had drifted to four different container widths
// (max-w-2xl / max-w-5xl / max-w-md) and a px-4 gutter that didn't match the
// landing page's px-6 — so moving between tabs shifted the content edge and
// the app read as several apps.
//
// `width` is the one axis a page may vary, because it's genuinely content-
// driven: a reading column of chapter rows wants a narrow measure, a week
// calendar does not. Everything else — gutters, vertical rhythm, the space
// under the bottom nav on mobile — is fixed here.
const WIDTH = {
  // Reading column: Today, Library, Stats, Settings.
  base: 'max-w-2xl',
  // Anything grid-shaped that needs the room. Calendar.
  wide: 'max-w-5xl',
  // A single centred control. Focus.
  narrow: 'max-w-md',
}

export default function PageShell({ children, width = 'base', className = '' }) {
  return (
    <div className={`${WIDTH[width]} mx-auto px-6 md:px-8 pt-8 pb-28 md:pb-12 ${className}`}>
      {children}
    </div>
  )
}

// Shared header treatment for every app screen: a small tracked eyebrow in the
// accent colour, a serif title, and a short brand rule. This is the one
// repeated signature that ties the screens together as one design system.
export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mb-7 w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-eyebrow font-semibold uppercase text-brand mb-1.5">{eyebrow}</p>
          )}
          <h1 className="font-display text-display-md font-semibold text-ink">{title}</h1>
          {subtitle && <p className="text-body text-ink-soft mt-1">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
      <div className="h-px w-14 bg-brand mt-4 rounded-full" />
    </motion.div>
  )
}
