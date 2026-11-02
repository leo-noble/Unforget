import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChartNoAxesCombined, PanelLeft, PanelLeftClose, Search } from 'lucide-react'
import { TABS, MOD } from './tabs'
import AppIcon from '../ui/AppIcon'
import Avatar from './Avatar'
import MiniTimer from './MiniTimer'
import { useTimerStatus } from '../../lib/TimerContext'
import { APP_NAME } from '../../brand'
import { snappy } from '../ui/motion'

const widthSpring = { type: 'spring', stiffness: 420, damping: 42 }

// One sidebar row: 32px tall on a 34px pitch, a 16px outline icon, the label
// unchanged when selected and a grey pill behind it.
function Item({ icon: Icon, label, selected, onClick, count, hint, collapsed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? (count ? `${label}, ${count} due` : label) : undefined}
      aria-current={selected ? 'page' : undefined}
      className={`relative h-8 flex items-center rounded-control text-subhead ${collapsed ? 'w-9 justify-center' : 'w-full gap-2.5 px-2.5'} ${
        selected ? 'text-label' : 'text-label-2 hover:text-label hover:bg-fill'
      }`}
    >
      {selected && <motion.span layoutId="sidebar-pill" transition={snappy} className="desktop-nav-active absolute inset-0 rounded-control" />}
      <span className="relative">
        <Icon size={16} strokeWidth={1.6} />
        {collapsed && count > 0 && <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-data" />}
      </span>
      {!collapsed && <span className="relative flex-1 text-left whitespace-nowrap">{label}</span>}
      {!collapsed && count > 0 && <span className="relative text-footnote text-label-2 tabular">{count}</span>}
      {!collapsed && hint && <span className="relative kbd">{hint}</span>}
    </button>
  )
}

// The laptop sidebar, on the page ground with one hairline. It collapses to an
// icon rail: the button in its header, or ⌘\ / Ctrl+\.
export default function Sidebar({
  active,
  onSelect,
  onAdd,
  onSearch,
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
  const ToggleIcon = collapsed ? PanelLeft : PanelLeftClose

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 248 }}
      transition={widthSpring}
      className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 desktop-sidebar flex-col pt-4 pb-3 overflow-hidden ${
        collapsed ? 'items-center px-0' : 'px-3'
      }`}
    >
      <div className={`flex items-center h-9 mb-3 ${collapsed ? 'justify-center' : 'gap-2 pl-1.5'}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            title={`Show sidebar (${MOD}\\)`}
            aria-label="Show sidebar"
            className="group relative h-9 w-9 rounded-control flex items-center justify-center text-label-2 hover:text-label hover:bg-fill"
          >
            <AppIcon size={24} bare className="transition-opacity duration-150 group-hover:opacity-0 group-focus-visible:opacity-0" />
            <ToggleIcon size={16} strokeWidth={1.6} className="absolute opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        ) : (
          <>
            <AppIcon size={24} bare />
            <span className="text-headline font-semibold tracking-[-0.02em] flex-1">{APP_NAME}</span>
            <button
              type="button"
              onClick={onToggle}
              title={`Hide sidebar (${MOD}\\)`}
              aria-label="Hide sidebar"
              className="h-8 w-8 rounded-control flex items-center justify-center text-label-3 hover:text-label hover:bg-fill"
            >
              <ToggleIcon size={16} strokeWidth={1.6} />
            </button>
          </>
        )}
      </div>

      <div className={`flex flex-col gap-0.5 mb-5 ${collapsed ? 'items-center' : ''}`}>
        <Item icon={Search} label="Search" hint={`${MOD}K`} collapsed={collapsed} onClick={onSearch} />
        <Item icon={Plus} label="New chapter" hint={`${MOD}N`} collapsed={collapsed} onClick={onAdd} />
      </div>

      <nav className={`flex flex-col gap-0.5 ${collapsed ? 'items-center' : ''}`} aria-label="Sections">
        {!collapsed && <p className="px-2.5 mb-1 text-footnote text-label-2">Study</p>}
        {TABS.filter((tab) => showFocusTimer || tab.id !== 'focus').map((t) => (
          <Item
            key={t.id}
            icon={t.icon}
            label={t.label}
            collapsed={collapsed}
            selected={active === t.id}
            onClick={() => onSelect(t.id)}
            count={t.id === 'today' ? dueCount : 0}
          />
        ))}
        <Item icon={ChartNoAxesCombined} label="Insights" collapsed={collapsed} selected={active === 'insights'} onClick={onOpenInsights} />
      </nav>

      <div className={`mt-auto flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
        <AnimatePresence>
          {showTimer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <MiniTimer compact chapterMap={chapterMap} onOpen={() => onSelect('focus')} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onOpenSettings}
          title={collapsed ? 'Account and settings' : undefined}
          aria-label="Account and settings"
          className={`flex items-center gap-2.5 rounded-control hover:bg-fill text-left ${collapsed ? 'p-1' : 'w-full p-1.5'}`}
        >
          <Avatar name={profile?.name} src={profile?.avatarUrl} size={28} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-subhead truncate">{profile?.name || 'Account'}</span>
              <span className="block text-caption text-label-2 truncate">{profile?.email || 'Settings'}</span>
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
