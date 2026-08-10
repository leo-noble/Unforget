import { Reveal } from './Reveal'

// Section rhythm lives here so no individual section invents its own padding.
// Sections are separated by space and by a change of surface — never by a rule.
//
// One band height, not three. Every section previously paid 160px top AND
// 160px bottom, so adjacent bands put 320px of dead space between two lines of
// text — the page read as sparse without any section actually being sparse.
// A single `band` value applied symmetrically means the gap between any two
// sections is identical and predictable, and `tight` exists only for a band
// that follows one it's argumentatively continuous with.
const PAD = {
  tight: 'py-16 md:py-20',
  base: 'py-20 md:py-band',
}

// One container width for the whole page — nav, every section, the closing CTA
// and the footer all read off this, so nothing can drift out of alignment.
export const CONTAINER = 'max-w-[76rem] mx-auto px-6 md:px-8'

// The measure every column of prose is capped to. Long-form copy past ~68
// characters stops being scannable, and a lede that runs the full 1216px
// container is the single loudest "unbalanced" signal on a wide page.
export const MEASURE = 'max-w-[34rem]'

export function Section({ id, children, className = '', tone = 'paper', size = 'base' }) {
  const surface = {
    paper: '',
    // A single step up in lightness reads as a distinct band without a border.
    raised: 'bg-surface/50',
  }[tone]

  return (
    <section id={id} className={`relative scroll-mt-24 ${surface} ${className}`}>
      {tone === 'raised' && (
        // The tint arrives gradually instead of snapping on at a hard edge, so
        // the band starts without reading as a horizontal rule.
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-paper to-transparent"
        />
      )}
      <div className={`relative ${CONTAINER} ${PAD[size]}`}>{children}</div>
    </section>
  )
}

export function Eyebrow({ children, className = '' }) {
  return (
    <p className={`text-eyebrow font-semibold uppercase text-brand ${className}`}>{children}</p>
  )
}

// One heading component for every section header on the page. Previously three
// sections hand-rolled their own — which is how the page ended up with 44px,
// 42px and 52px all serving as the same semantic level. Everything routes
// through here now, so an H2 is an H2 everywhere.
export function SectionHead({ eyebrow, title, lede, align = 'left', className = '', children }) {
  const centered = align === 'center'
  return (
    <div className={`${centered ? 'text-center mx-auto' : ''} ${MEASURE} ${className}`}>
      {eyebrow && (
        <Reveal>
          <Eyebrow className="mb-3.5">{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="font-display text-display-lg font-semibold text-balance">{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p className={`text-prose text-ink-soft mt-4 ${centered ? 'mx-auto' : ''}`}>{lede}</p>
        </Reveal>
      )}
      {children && (
        <Reveal delay={0.18}>
          <div className="mt-7">{children}</div>
        </Reveal>
      )}
    </div>
  )
}

// Ambient light behind a section. Purely decorative and never interactive, so
// it sits under everything and ignores pointer events.
export function Glow({ className = '', color = 'bg-brand/15', size = 420, drift = true }) {
  return (
    <span
      aria-hidden="true"
      className={`glow-orb ${drift ? 'orb-drift' : ''} ${color} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
