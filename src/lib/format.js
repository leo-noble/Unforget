import { daysBetween, startOfDay, toISODate } from './srs'

// Human-readable dates for the UI. Everything here takes the engine's local
// "YYYY-MM-DD" strings and goes through startOfDay, never `new Date(iso)`,
// which would parse as UTC and drift a day in half the world's timezones.

export const todayISO = () => toISODate(new Date())

/** "Tue, Oct 28" */
export function formatDay(iso, opts = {}) {
  if (!iso) return ''
  return startOfDay(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...opts })
}

/** "Oct 28" */
export function formatShort(iso) {
  if (!iso) return ''
  return startOfDay(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** "Today" / "Tomorrow" / "Yesterday" / "In 3 days" / "3 days ago" */
export function relativeDay(iso, today = new Date()) {
  if (!iso) return ''
  const diff = daysBetween(today, iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return `In ${diff} days`
  if (diff < -1) return `${-diff} days ago`
  return formatDay(iso)
}

/** For mid-sentence use: "today" / "tomorrow" / "in 3 days" / "on Tue, Oct 28" */
export function relativeDayInline(iso, today = new Date()) {
  if (!iso) return ''
  const diff = daysBetween(today, iso)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 1 && diff < 7) return `in ${diff} days`
  if (diff < -1) return `${-diff} days ago`
  return `on ${formatDay(iso)}`
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
