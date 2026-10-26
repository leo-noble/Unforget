import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 }

// The floating tab bar: a liquid-glass capsule lifted off the bottom edge, a
// glass lens that slides to the selected tab, and the primary action as its
// own ink circle rather than a fifth tab. The live timer pill sits above it while a session is running.
export default function TabBar({ active, onSelect, onAdd, onOpenFocus, chapterMap }) {
  const { status } = useTimerStatus()
  const showTimer = status !== 'idle' && active !== 'focus'

  // Pages pad their bottom by this so the last row clears the dock.
  useEffect(() => {
    document.documentElement.style.setProperty('--dock-space', showTimer ? '178px' : '112px')
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
              <MiniTimer onOpen={onOpenFocus} chapterMap={chapterMap} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <nav aria-label="Tabs" className="glass pointer-events-auto flex-1 h-[64px] rounded-full p-[5px] flex">
            {TABS.map((t) => {
              const selected = t.id === active
              const Icon = t.icon
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t.id)}
                  whileTap={{ scale: 0.92 }}
                  transition={pillSpring}
                  aria-current={selected ? 'page' : undefined}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-[4px] rounded-full ${
                    selected ? 'text-label' : 'text-label-2'
                  }`}
                >
                  {selected && (
                    <motion.span layoutId="tabbar-lens" transition={pillSpring} className="glass-lens absolute inset-0 rounded-full" />
                  )}
                  <Icon size={22} strokeWidth={selected ? 2.1 : 1.7} className="relative" />
                  <span className={`relative text-[10px] leading-none ${selected ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
                </motion.button>
              )
            })}
          </nav>

          <motion.button
            type="button"
            onClick={onAdd}
            whileTap={{ scale: 0.88 }}
            transition={pillSpring}
            aria-label="Add chapter"
            className="glass-tint pointer-events-auto h-[64px] w-[64px] shrink-0 rounded-full flex items-center justify-center shadow-float"
          >
            <Plus size={26} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
