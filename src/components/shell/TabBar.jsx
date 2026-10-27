import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 }

// Compact, Instagram-inspired floating dock: four destinations and a centered
// create action in one glass surface. The live timer pill sits above it.
export default function TabBar({ active, onSelect, onAdd, onOpenFocus, chapterMap }) {
  const { status } = useTimerStatus()
  const showTimer = status !== 'idle' && active !== 'focus'

  // Pages pad their bottom by this so the last row clears the dock.
  useEffect(() => {
    document.documentElement.style.setProperty('--dock-space', showTimer ? '184px' : '120px')
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

        <nav
          aria-label="Main navigation"
          className="liquid-dock relative pointer-events-auto mx-auto flex h-[62px] max-w-[410px] items-center rounded-full p-1"
        >
          {TABS.slice(0, 2).map((tab) => (
            <DockTab key={tab.id} tab={tab} active={active} onSelect={onSelect} />
          ))}

          <motion.button
            type="button"
            onClick={onAdd}
            whileTap={{ scale: 0.9 }}
            transition={pillSpring}
            aria-label="Add chapter"
            title="Add chapter"
            className="dock-action relative z-[1] mx-1 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-label"
          >
            <Plus size={21} strokeWidth={1.8} />
          </motion.button>

          {TABS.slice(2).map((tab) => (
            <DockTab key={tab.id} tab={tab} active={active} onSelect={onSelect} />
          ))}
        </nav>
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
      className={`relative flex h-full min-w-0 flex-1 items-center justify-center rounded-full ${selected ? 'text-label' : 'text-label-2'}`}
    >
      {selected && (
        <motion.span
          layoutId="tabbar-lens"
          transition={pillSpring}
          className="glass-lens dock-lens absolute inset-[5px] rounded-full"
        />
      )}
      <Icon size={21} strokeWidth={selected ? 2 : 1.7} className="relative z-[1]" />
    </motion.button>
  )
}
