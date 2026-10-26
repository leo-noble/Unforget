import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 }

// iOS 26's floating tab bar: a glass capsule lifted off the bottom edge, with
// the primary action as its own glass circle beside it rather than a fifth
// tab. The live timer pill sits above it while a session is running.
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
          <nav aria-label="Tabs" className="glass pointer-events-auto flex-1 h-[62px] rounded-full p-[5px] flex">
            {TABS.map((t) => {
              const selected = t.id === active
              const Icon = t.icon
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t.id)}
                  whileTap={{ scale: 0.9 }}
                  transition={pillSpring}
                  aria-current={selected ? 'page' : undefined}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] rounded-full ${
                    selected ? 'text-tint' : 'text-label'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="tabbar-pill"
                      transition={pillSpring}
                      className="absolute inset-0 rounded-full bg-fill"
                    />
                  )}
                  <Icon
                    size={23}
                    strokeWidth={selected ? 2.3 : 2}
                    fill={selected ? 'currentColor' : 'none'}
                    fillOpacity={selected ? 0.16 : 0}
                    className="relative"
                  />
                  <span className="relative text-[10px] leading-none font-semibold tracking-[0.01em]">{t.label}</span>
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
            className="glass-tint pointer-events-auto h-[62px] w-[62px] shrink-0 rounded-full flex items-center justify-center"
          >
            <Plus size={27} strokeWidth={2.6} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
