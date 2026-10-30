import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChartNoAxesCombined, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { TABS } from './tabs'
import AppIcon from '../ui/AppIcon'
import Avatar from './Avatar'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'
import { APP_NAME } from '../../brand'
import { snappy } from '../ui/motion'

const widthSpring = { type: 'spring', stiffness: 380, damping: 38 }

function Item({ icon: Icon, label, selected, onClick, badge, collapsed }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={snappy}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={selected ? 'page' : undefined}
      className={`relative h-11 flex items-center rounded-full text-body ${collapsed ? 'w-11 justify-center' : 'w-full gap-3 px-3.5'} ${
        selected ? 'text-label font-medium' : 'text-label-2 hover:text-label hover:bg-fill'
      }`}
    >
      {selected && <motion.span layoutId="sidebar-lens" transition={snappy} className="glass-lens absolute inset-0 rounded-full" />}
      <span className="relative">
        <Icon size={20} strokeWidth={selected ? 2.1 : 1.7} />
        {collapsed && badge > 0 && (
          <span className="absolute -top-1 -right-1.5 h-[15px] min-w-[15px] px-1 rounded-full bg-accent text-tint-fg text-[9px] font-semibold flex items-center justify-center tabular">
            {badge}
          </span>
        )}
      </span>
      {!collapsed && <span className="relative flex-1 text-left whitespace-nowrap">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="relative min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-tint-fg text-caption font-semibold flex items-center justify-center tabular">
          {badge}
        </span>
      )}
    </motion.button>
  )
}

// The laptop sidebar: a floating glass panel inset from the window edges.
// It collapses to an icon rail — the button in its header, or ⌘\ / Ctrl+\.
export default function Sidebar({
  active,
  onSelect,
  onAdd,
  onOpenInsights,
  onOpenSettings,
  profile,
  dueCount,
  chapterMap,
  collapsed,
  onToggle,
  showFocusTimer = true,
}) {
  const { status } = useTimerStatus()
  const showTimer = showFocusTimer && status !== 'idle' && active !== 'focus' && !collapsed
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 260 }}
      transition={widthSpring}
      className={`hidden md:flex fixed left-3 top-3 bottom-3 z-40 glass desktop-glass flex-col py-3 overflow-hidden ${
        collapsed ? 'rounded-[34px]' : 'rounded-[28px]'
      } ${
        collapsed ? 'items-center px-0' : 'px-3'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'flex-col gap-3 pb-4' : 'gap-2.5 pl-2 pr-0.5 pt-1 pb-4'}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            title="Show sidebar (⌘\)"
            aria-label="Show sidebar"
            className="h-11 w-11 rounded-full flex items-center justify-center text-label-2 hover:text-label hover:bg-fill"
          >
            <ToggleIcon size={19} strokeWidth={1.7} />
          </button>
        ) : (
          <>
            <AppIcon size={30} />
            <span className="font-display text-[21px] leading-none tracking-[-0.04em] flex-1">{APP_NAME}</span>
            <button
              type="button"
              onClick={onToggle}
              title="Hide sidebar (⌘\)"
              aria-label="Hide sidebar"
              className="h-9 w-9 rounded-full flex items-center justify-center text-label-2 hover:text-label hover:bg-fill"
            >
              <ToggleIcon size={18} strokeWidth={1.7} />
            </button>
          </>
        )}
      </div>

      <motion.button
        type="button"
        onClick={onAdd}
        whileTap={{ scale: 0.96 }}
        transition={snappy}
        title={collapsed ? 'New chapter (⌘N)' : undefined}
        aria-label="New chapter"
        className={`glass-tint h-11 rounded-full flex items-center justify-center gap-2 text-subhead font-medium mb-4 shrink-0 ${
          collapsed ? 'w-11' : 'w-full'
        }`}
      >
        <Plus size={18} strokeWidth={2.2} />
        {!collapsed && <span className="whitespace-nowrap">New chapter</span>}
      </motion.button>

      <nav className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`} aria-label="Sections">
        {TABS.filter((tab) => showFocusTimer || tab.id !== 'focus').map((t) => (
          <Item
            key={t.id}
            icon={t.icon}
            label={t.label}
            collapsed={collapsed}
            selected={active === t.id}
            onClick={() => onSelect(t.id)}
            badge={t.id === 'today' ? dueCount : 0}
          />
        ))}
        <div className={`h-px bg-separator my-2 ${collapsed ? 'w-8' : 'mx-3'}`} />
        <Item
          icon={ChartNoAxesCombined}
          label="Insights"
          collapsed={collapsed}
          selected={active === 'insights'}
          onClick={onOpenInsights}
        />
      </nav>

      <div className={`mt-auto flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
        <AnimatePresence>
          {showTimer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={snappy}>
              <MiniTimer compact chapterMap={chapterMap} onOpen={() => onSelect('focus')} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onOpenSettings}
          title={collapsed ? 'Account and settings' : undefined}
          aria-label="Account and settings"
          className={`flex items-center gap-3 rounded-full hover:bg-fill text-left ${collapsed ? 'p-1' : 'w-full p-1.5 pr-3'}`}
        >
          <Avatar name={profile?.name} src={profile?.avatarUrl} size={38} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-subhead font-medium truncate">{profile?.name || 'Account'}</span>
              <span className="block text-caption text-label-2 truncate">{profile?.email || 'Settings'}</span>
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
