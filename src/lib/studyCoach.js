import { addDays, daysBetween, toISODate } from './srs'
const DEFAULT_ESTIMATE_MINUTES = 25

function calendarDate(date) {
  return toISODate(date)
}

export function estimateChapterMinutes(chapterId, sessions = []) {
  const history = sessions
    .filter((session) => session.chapterId === chapterId && Number.isFinite(session.minutes) && session.minutes > 0)
    .map((session) => session.minutes)
    .sort((a, b) => a - b)

  if (history.length === 0) return { minutes: DEFAULT_ESTIMATE_MINUTES, label: 'rough estimate' }
  const middle = Math.floor(history.length / 2)
  const minutes = Math.round(
    history.length % 2 ? history[middle] : (history[middle - 1] + history[middle]) / 2
  )
  return {
    minutes,
    label: history.length >= 3 ? 'your usual focus time' : 'early estimate',
  }
}

export function recommendChapters(chapters = [], now = new Date()) {
  const today = calendarDate(now)
  const active = chapters.filter((chapter) => chapter.status !== 'mastered' && chapter.nextReviewDate)
  const rank = (chapter) => {
    if (chapter.derivedStatus === 'overdue') return 0
    if (chapter.derivedStatus === 'due') return 1
    if (chapter.struggleFlag) return 2
    return 3
  }

  return [...active]
    .sort((a, b) => {
      const priority = rank(a) - rank(b)
      if (priority) return priority
      if (a.nextReviewDate !== b.nextReviewDate) return a.nextReviewDate.localeCompare(b.nextReviewDate)
      return a.title.localeCompare(b.title)
    })
    .slice(0, 3)
    .map((chapter) => {
      const days = daysBetween(today, chapter.nextReviewDate)
      let reason
      if (chapter.derivedStatus === 'overdue') {
        reason = `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
      } else if (chapter.derivedStatus === 'due') {
        reason = 'Due today'
      } else {
        reason = `Due in ${days} day${days === 1 ? '' : 's'}`
      }
      if (chapter.struggleFlag) reason += ' · marked for extra attention'
      return { ...chapter, coachReason: reason }
    })
}

export function weeklyFocusStats(sessions = [], dailyLog = {}, now = new Date()) {
  const today = calendarDate(now)
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monday = addDays(todayDate, -((todayDate.getDay() + 6) % 7))
  const dates = Array.from({ length: 7 }, (_, index) => calendarDate(addDays(monday, index)))
  const perDay = new Map(dates.map((date) => [date, { sessions: 0, minutes: 0 }]))

  sessions.forEach((session) => {
    const day = perDay.get(session.date)
    if (!day) return
    day.sessions += 1
    day.minutes += Number(session.minutes) || 0
  })

  let minutes = 0
  let count = 0
  dates.forEach((date) => {
    if (date > today) return
    const tracked = perDay.get(date)
    const legacy = dailyLog[date] || {}
    // Older builds only kept a daily total. Use the larger of that legacy
    // value and the merged session records so we never double-count them.
    minutes += Math.max(tracked.minutes, Number(legacy.minutes) || 0)
    count += Math.max(tracked.sessions, Number(legacy.sessions) || 0)
  })

  return { minutes, sessions: count, startDate: dates[0], endDate: dates[6] }
}

export function formatMinutes(minutes) {
  const value = Math.max(0, Math.round(minutes || 0))
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const remainder = value % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

