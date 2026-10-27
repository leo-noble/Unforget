import { SunMedium, LibraryBig, CalendarDays, Timer } from 'lucide-react'

// Four tabs, never more — iOS tab bars stop reading at a glance past that.
// Stats moved into Insights (opened from Today) and Settings into the account
// button, which is where Apple's own apps keep them.
export const TABS = [
  { id: 'today', path: '/dashboard', label: 'Today', icon: SunMedium },
  { id: 'library', path: '/dashboard/library', label: 'Library', icon: LibraryBig },
  { id: 'plan', path: '/dashboard/plan', label: 'Plan', icon: CalendarDays },
  { id: 'focus', path: '/dashboard/focus', label: 'Focus', icon: Timer },
]

export function tabFromPath(pathname) {
  const seg = pathname.replace(/^\/dashboard\/?/, '').split('/')[0]
  return TABS.find((t) => t.id === seg)?.id || 'today'
}
