import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 }

// Four destinations stay together in the floating glass dock. The add action
// gets its own button beside the dock, with the live timer pill above both.
export default function TabBar({ active, onSelect, onAdd, onOpenFocus, chapterMap }) {
  const { status } = useTimerStatus()
  const showTimer = status !== 'idle' && active !== 'focus'

  // Pages pad their bottom by this so the last row clears the dock.
  useEffect(() => {
    document.documentElement.style.setProperty('--dock-space', showTimer ? '178px' : '112px')
  }, [showTimer])

  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none"
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
              <MiniTimer onOpen={onOpenFocus} chapterMap={chapterMap} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <nav
            aria-label="Main navigation"
            className="liquid-dock relative flex h-[62px] min-w-0 flex-1 items-center rounded-full p-1 pointer-events-auto"
          >
            {TABS.map((tab) => (
              <DockTab key={tab.id} tab={tab} active={active} onSelect={onSelect} />
            ))}
          </nav>

          <motion.button
            type="button"
            onClick={onAdd}
            whileTap={{ scale: 0.9 }}
            transition={pillSpring}
            aria-label="Add chapter"
            title="Add chapter"
            className="liquid-add relative z-[1] pointer-events-auto flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full"
          >
            <Plus size={25} strokeWidth={1.9} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function DockTab({ tab, active, onSelect }) {
  const selected = tab.id === active
  const Icon = tab.icon

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(tab.id)}
      whileTap={{ scale: 0.9 }}
      transition={pillSpring}
      aria-current={selected ? 'page' : undefined}
      aria-label={tab.label}
      title={tab.label}
      className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full ${selected ? 'text-label' : 'text-label-2'}`}
    >
      {selected && (
        <motion.span
          layoutId="tabbar-lens"
          transition={pillSpring}
          className="dock-lens absolute inset-[3px] rounded-full"
        />
      )}
      <Icon size={21} strokeWidth={selected ? 2.1 : 1.8} className="relative z-[1]" />
      <span className="relative z-[1] text-[10px] leading-none font-medium">{tab.label}</span>
    </motion.button>
  )
}
