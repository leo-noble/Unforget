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

// The navigation bar: transparent over the title, then, once the title has
// scrolled under it, a solid bar on the page ground with the title inline.
export function NavBar({ title, leading, trailing }) {
  const scrolled = useScrolledPast(38)
  return (
    <header
      className="fixed top-0 right-0 left-0 md:left-[var(--sidebar-w)] z-40 pointer-events-none transition-[left] duration-300 ease-ios"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bar-glass hairline-b transition-opacity duration-200 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="relative mx-auto max-w-[var(--page-max)] h-12 px-4 sm:px-8 flex items-center gap-2">
        <div className="pointer-events-auto flex-1 flex items-center gap-2 min-w-0">{leading}</div>
        <motion.p
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 6 }}
          transition={{ duration: 0.2, ease: easeOut }}
          className="text-subhead font-medium text-label truncate max-w-[50%] text-center"
        >
          {title}
        </motion.p>
        <div className="pointer-events-auto flex-1 flex items-center justify-end gap-2.5">{trailing}</div>
      </div>
    </header>
  )
}

// A screen: nav bar, the title row, and the content column. The title row
// holds the screen's name with a grey `meta` after it (the date, a count), the
// screen's finding as one line under it, and its main action on the right.
export default function Page({ title, eyebrow, meta, subtitle, trailing, leading, wide = false, children, titleAccessory }) {
  const after = meta ?? eyebrow
  return (
    <div style={{ '--page-max': wide ? '1120px' : '760px' }}>
      <NavBar title={title} leading={leading} trailing={trailing} />
      <div
        className="mx-auto w-full max-w-[var(--page-max)] px-4 sm:px-8 pb-[calc(env(safe-area-inset-bottom)+var(--dock-space,100px))] md:pb-14"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }}
      >
        <div className="pt-2 md:pt-4 pb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title text-[22px] leading-[28px] md:text-[24px] md:leading-[30px] truncate">
              {title}
              {after && <span className="ml-2.5 text-subhead font-normal tracking-normal text-label-2">{after}</span>}
            </h1>
            {subtitle && <p className="text-subhead text-label-2 mt-1">{subtitle}</p>}
          </div>
          {titleAccessory}
        </div>
        {children}
      </div>
    </div>
  )
}
