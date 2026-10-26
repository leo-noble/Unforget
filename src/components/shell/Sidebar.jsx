import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChartColumn } from 'lucide-react'
import { TABS } from './tabs'
import AppIcon from '../ui/AppIcon'
import Avatar from './Avatar'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'
import { APP_NAME } from '../../brand'
import { snappy } from '../ui/motion'

function Item({ icon: Icon, label, selected, onClick, badge }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={snappy}
      aria-current={selected ? 'page' : undefined}
      className={`relative w-full h-11 flex items-center gap-3 px-3 rounded-full text-body ${
        selected ? 'text-label font-medium' : 'text-label-2 hover:bg-fill hover:text-label'
      }`}
    >
      {selected && (
        <motion.span layoutId="sidebar-pill" transition={snappy} className="absolute inset-0 rounded-full bg-fill" />
      )}
      <Icon size={20} strokeWidth={selected ? 2 : 1.6} className="relative" />
      <span className="relative flex-1 text-left">{label}</span>
      {selected && !(badge > 0) && <span className="relative h-[6px] w-[6px] rounded-full bg-red" />}
      {badge > 0 && (
        <span className="relative min-w-[22px] h-[22px] px-1.5 rounded-full bg-red text-white text-caption font-medium flex items-center justify-center tabular">
          {badge}
        </span>
      )}
    </motion.button>
  )
}

// iPadOS 26's floating sidebar: a glass panel inset from the window edges.
export default function Sidebar({
  active,
  onSelect,
  onAdd,
  onOpenInsights,
  onOpenSettings,
  profile,
  dueCount,
  chapterMap,
}) {
  const { status } = useTimerStatus()
  const showTimer = status !== 'idle' && active !== 'focus'
  return (
    <aside className="hidden md:flex fixed left-3 top-3 bottom-3 z-40 w-[260px] glass-strong rounded-[28px] flex-col p-3">
      <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-4">
        <AppIcon size={34} />
        <span className="font-display text-[22px] leading-none tracking-[-0.04em]">{APP_NAME}</span>
      </div>

      <motion.button
        type="button"
        onClick={onAdd}
        whileTap={{ scale: 0.97 }}
        transition={snappy}
        className="tint-fill text-tint-fg h-11 rounded-full flex items-center justify-center gap-2 text-subhead font-medium mb-4"
      >
        <Plus size={18} strokeWidth={2.6} /> New Chapter
      </motion.button>

      <nav className="flex flex-col gap-0.5" aria-label="Sections">
        {TABS.map((t) => (
          <Item
            key={t.id}
            icon={t.icon}
            label={t.label}
            selected={active === t.id}
            onClick={() => onSelect(t.id)}
            badge={t.id === 'today' ? dueCount : 0}
          />
        ))}
        <div className="h-px bg-separator mx-3 my-2" />
        <Item icon={ChartColumn} label="Insights" onClick={onOpenInsights} />
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <AnimatePresence>
          {showTimer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={snappy}
            >
              <MiniTimer compact chapterMap={chapterMap} onOpen={() => onSelect('focus')} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 p-2 rounded-[18px] hover:bg-fill text-left"
        >
          <Avatar name={profile?.name} src={profile?.avatarUrl} size={38} />
          <span className="min-w-0 flex-1">
            <span className="block text-subhead font-medium truncate">{profile?.name || 'Account'}</span>
            <span className="block text-caption text-label-2 truncate">{profile?.email || 'Settings'}</span>
          </span>
        </button>
      </div>
    </aside>
  )
}
