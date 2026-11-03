import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 360, damping: 32, mass: 0.85 }

// Four labelled destinations in a floating round glass capsule, with a glass
// lens that slides to the selected one. Add is the round glass button beside it.
export default function TabBar({ active, onSelect, onAdd, onOpenFocus, chapterMap, showFocusTimer = true }) {
  const { status } = useTimerStatus()
  const showTimer = showFocusTimer && status !== 'idle' && active !== 'focus'
  const navTabs = showFocusTimer ? TABS : TABS.filter((tab) => tab.id !== 'focus')
  const gridClass = navTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
  const activeIndex = Math.max(0, navTabs.findIndex((tab) => tab.id === active))

  // Pages pad their bottom by this so the last row clears the dock.
  useEffect(() => {
    document.documentElement.style.setProperty('--dock-space', showTimer ? '172px' : '104px')
  }, [showTimer])

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'max(calc(env(safe-area-inset-bottom) - 6px), 14px)' }}
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

        <div className="flex items-center gap-3">
          <nav
            aria-label="Main navigation"
            className={`liquid-dock relative grid h-[62px] min-w-0 flex-1 ${gridClass} items-center rounded-full p-[5px] pointer-events-auto`}
          >
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ x: `${activeIndex * 100}%` }}
              transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.82 }}
              className="dock-lens pointer-events-none absolute left-[5px] top-[5px] bottom-[5px] z-0 rounded-full"
              style={{ width: `calc((100% - 10px) / ${navTabs.length})` }}
            />
            {navTabs.map((tab) => <DockTab key={tab.id} tab={tab} active={active} onSelect={onSelect} />)}
          </nav>
          <AddDockButton onAdd={onAdd} />
        </div>
      </div>
    </div>
  )
}

function AddDockButton({ onAdd }) {
  return (
    <motion.button
      type="button"
      onClick={onAdd}
      whileTap={{ scale: 0.94 }}
      transition={pillSpring}
      aria-label="Add chapter"
      title="Add chapter"
      className="dock-action relative z-[1] pointer-events-auto mx-auto flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full"
    >
      <Plus size={26} strokeWidth={1.8} />
    </motion.button>
  )
}

function DockTab({ tab, active, onSelect }) {
  const selected = tab.id === active
  const Icon = tab.icon

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(tab.id)}
      whileTap={{ scale: 0.96 }}
      transition={pillSpring}
      aria-current={selected ? 'page' : undefined}
      className={`relative z-[1] flex h-full min-w-0 w-full flex-col items-center justify-center gap-0.5 rounded-full transition-colors ${selected ? 'text-label' : 'text-label-2'}`}
    >
      <Icon size={19} strokeWidth={selected ? 2 : 1.7} className="relative z-[1]" />
      <span className={`relative z-[1] text-caption-2 ${selected ? 'font-medium' : ''}`}>{tab.label}</span>
    </motion.button>
  )
}
