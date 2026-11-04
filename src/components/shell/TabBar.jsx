import { startTransition, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 360, damping: 32, mass: 0.85 }

// iOS 26 tab bar, icons only, on Liquid Glass (styles/liquid-glass.css): the
// lens springs to the selected tab with a transform, so it stays smooth on a
// phone. Add is the round glass button beside it.
export default function TabBar({ active, onSelect, onAdd, onOpenFocus, chapterMap, showFocusTimer = true }) {
  const { status } = useTimerStatus()
  const showTimer = showFocusTimer && status !== 'idle' && active !== 'focus'
  const navTabs = showFocusTimer ? TABS : TABS.filter((tab) => tab.id !== 'focus')
  // The lens moves the moment a tab is tapped; the page swap follows as a
  // low-priority update, so its render never holds up the slide.
  const [pending, setPending] = useState(null)
  const shown = pending ?? active
  const activeIndex = Math.max(0, navTabs.findIndex((tab) => tab.id === shown))
  useEffect(() => {
    if (pending && pending === active) setPending(null)
  }, [pending, active])

  function choose(id) {
    if (id === active) return onSelect(id)
    setPending(id)
    requestAnimationFrame(() => requestAnimationFrame(() => startTransition(() => onSelect(id))))
  }

  // Pages pad their bottom by this so the last row clears the dock.
  useEffect(() => {
    document.documentElement.style.setProperty('--dock-space', showTimer ? '162px' : '94px')
  }, [showTimer])

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'max(calc(env(safe-area-inset-bottom) - 16px), 12px)' }}
    >
      <div className="mx-auto max-w-[540px] px-4">
        <AnimatePresence>
          {showTimer && (
            <motion.div
              key="mini-timer"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={pillSpring}
              className="mb-2.5"
            >
              <MiniTimer onOpen={onOpenFocus} chapterMap={chapterMap} glass />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 pointer-events-auto">
          <nav aria-label="Main navigation" className="lg-glass lg-tabbar flex-1 min-w-0">
            <span
              aria-hidden="true"
              className="lg-tabbar-lens"
              style={{ width: `calc((100% - 8px) / ${navTabs.length})`, transform: `translateX(${activeIndex * 100}%)` }}
            />
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => choose(tab.id)}
                aria-current={tab.id === shown ? 'page' : undefined}
                aria-label={tab.label}
                title={tab.label}
                className="lg-tab"
              >
                <tab.icon size={22} strokeWidth={tab.id === shown ? 2.1 : 1.7} />
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add chapter"
            title="Add chapter"
            data-icon-only=""
            className="lg-button lg-glass shrink-0"
            style={{ width: 60, height: 60 }}
          >
            <Plus size={24} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  )
}
