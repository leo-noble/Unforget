import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { TABS } from './tabs'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'

const pillSpring = { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 }

// Glass dock with a connected four-stop indicator; add stays a separate,
// tactile control. The live timer pill sits above it during a session.
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

        <div className="flex items-center gap-3">
          <nav aria-label="Main navigation" className="liquid-dock relative pointer-events-auto flex-1 h-[68px] rounded-[22px] p-1.5 flex">
            <span aria-hidden="true" className="dock-track" />
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
                  title={t.label}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] pb-2 rounded-[16px] ${
                    selected ? 'text-label' : 'text-label-2'
                  }`}
                >
                  {selected && (
                    <motion.span layoutId="tabbar-lens" transition={pillSpring} className="glass-lens absolute inset-0 rounded-[16px]" />
                  )}
                  <Icon size={19} strokeWidth={selected ? 2 : 1.65} className="relative z-[1]" />
                  <span className={`relative z-[1] text-[10px] leading-none ${selected ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
                  <span aria-hidden="true" className="dock-node" />
                  {selected && <motion.span layoutId="dock-bead" transition={pillSpring} className="dock-bead" />}
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
            className="glass liquid-add pointer-events-auto h-[54px] w-[54px] shrink-0 rounded-full flex items-center justify-center"
          >
            <Plus size={22} strokeWidth={1.9} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
