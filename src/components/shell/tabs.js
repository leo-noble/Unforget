import { SunMedium, LibraryBig, CalendarDays, Timer } from 'lucide-react'

// Four tabs, never more — iOS tab bars stop reading at a glance past that.
// Stats moved into Insights (opened from Today) and Settings into the account
// button, which is where Apple's own apps keep them.
export const TABS = [
  { id: 'today', path: '/app', label: 'Today', icon: SunMedium },
  { id: 'library', path: '/app/library', label: 'Library', icon: LibraryBig },
  { id: 'plan', path: '/app/plan', label: 'Plan', icon: CalendarDays },
  { id: 'focus', path: '/app/focus', label: 'Focus', icon: Timer },
]

export function tabFromPath(pathname) {
  const seg = pathname.replace(/^\/app\/?/, '').split('/')[0]
  return TABS.find((t) => t.id === seg)?.id || 'today'
}
