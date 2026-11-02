import { SunMedium, LibraryBig, CalendarDays, Timer } from 'lucide-react'

// Keep the mobile dock to four quick destinations. Insights is reachable from
// the desktop sidebar and Today summary.
export const TABS = [
  { id: 'today', path: '/dashboard', label: 'Today', icon: SunMedium },
  { id: 'library', path: '/dashboard/library', label: 'Library', icon: LibraryBig },
  { id: 'plan', path: '/dashboard/plan', label: 'Plan', icon: CalendarDays },
  { id: 'focus', path: '/dashboard/focus', label: 'Focus', icon: Timer },
]

export function tabFromPath(pathname) {
  const seg = pathname.replace(/^\/dashboard\/?/, '').split('/')[0]
  return seg === 'insights' ? 'insights' : TABS.find((t) => t.id === seg)?.id || 'today'
}

// The modifier key as people know it on this machine, for shortcut hints.
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD = isMac ? '⌘' : 'Ctrl '
