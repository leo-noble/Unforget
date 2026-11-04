import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TabBar as GlassTabBar, Button as GlassButton } from 'glisse'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 360, damping: 32, mass: 0.85 }

// Apple's Liquid Glass tab bar (from Glisse), icons only: the selection
// springs between tabs and lifts into a lens while held. Add is a round glass
// button beside it.
export default function TabBar({ active, onSelect, onAdd, onOpenFocus, chapterMap, showFocusTimer = true }) {
  const { status } = useTimerStatus()
  const showTimer = showFocusTimer && status !== 'idle' && active !== 'focus'
  const navTabs = showFocusTimer ? TABS : TABS.filter((tab) => tab.id !== 'focus')

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

        <div className="flex items-end justify-center gap-3 pointer-events-auto">
          <GlassTabBar
            aria-label="Main navigation"
            items={navTabs.map((tab) => ({
              value: tab.id,
              label: <span className="sr-only">{tab.label}</span>,
              icon: <tab.icon size={22} strokeWidth={1.8} />,
            }))}
            value={active}
            onValueChange={onSelect}
            className="unf-tabbar"
          />
          <GlassButton icon={<Plus size={24} strokeWidth={1.8} />} aria-label="Add chapter" onClick={onAdd} className="unf-dock-add" />
        </div>
      </div>
    </div>
  )
}
