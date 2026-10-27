import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { easeOut } from './motion'

function useScrolledPast(threshold) {
  const [past, setPast] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold)
  useEffect(() => {
    let frame = 0
    function on() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setPast(window.scrollY > threshold))
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', on)
    }
  }, [threshold])
  return past
}

// The navigation bar: transparent over the large title, then — once the title
// has scrolled under it — a blurred bar with the title inline, exactly how a
// UINavigationController with prefersLargeTitles behaves.
export function NavBar({ title, leading, trailing }) {
  const scrolled = useScrolledPast(38)
  return (
    <header
      className="fixed top-0 right-0 left-0 md:left-[var(--sidebar-w)] z-30 pointer-events-none transition-[left] duration-300 ease-ios"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bar-glass hairline-b transition-opacity duration-200 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="relative mx-auto max-w-[var(--page-max)] h-[52px] px-4 sm:px-6 flex items-center gap-2">
        <div className="pointer-events-auto flex-1 flex items-center gap-2 min-w-0">{leading}</div>
        <motion.p
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 6 }}
          transition={{ duration: 0.2, ease: easeOut }}
          className="eyebrow text-label truncate max-w-[50%] text-center"
        >
          {title}
        </motion.p>
        <div className="pointer-events-auto flex-1 flex items-center justify-end gap-2.5">{trailing}</div>
      </div>
    </header>
  )
}

// A screen: nav bar, large title, and the content column. `wide` is for the
// calendar, which needs the room; everything else reads best in a column.
export default function Page({ title, eyebrow, subtitle, trailing, leading, wide = false, children, titleAccessory }) {
  return (
    <div style={{ '--page-max': wide ? '1180px' : '760px' }}>
      <NavBar title={title} leading={leading} trailing={trailing} />
      <div
        className="mx-auto w-full max-w-[var(--page-max)] px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+var(--dock-space,112px))] md:pb-14"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)' }}
      >
        <div className="pt-1 pb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow text-label-2 mb-2">{eyebrow}</p>}
            <h1 className="font-display text-[26px] leading-[32px] truncate">{title}</h1>
            {subtitle && <p className="text-subhead text-label-2 mt-1">{subtitle}</p>}
          </div>
          {titleAccessory}
        </div>
        {children}
      </div>
    </div>
  )
}
