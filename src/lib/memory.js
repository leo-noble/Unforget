// How well each chapter is probably remembered, and how many reviews land on
// each coming day. Everything here is derived from the chapters and review
// events the engine already stores; nothing is written back.
//
// The model is a plain forgetting curve: recall halves every `h` days since
// the last review, where `h` is the gap the schedule gives the current stage
// (1, 3, 7, 15, 30 days). So a chapter sits at 50% on the day its review is
// due, and keeps sliding the longer it's left: exactly what the schedule is
// built to catch.
import { addDays, buildTimeline, daysBetween, toISODate, INTERVALS_FROM_DAY0 } from './srs'

const GAPS = INTERVALS_FROM_DAY0.map((day, i) => day - (INTERVALS_FROM_DAY0[i - 1] || 0)) // [1, 3, 7, 15, 30]
const MASTERED_HALF_LIFE = 90

// Strength bands, strongest first. `step` is the shade on the memory map.
export const BANDS = [
  { id: 'strong', label: 'Strong', min: 0.8, step: 4 },
  { id: 'steady', label: 'Steady', min: 0.6, step: 3 },
  { id: 'fading', label: 'Fading', min: 0.4, step: 2 },
  { id: 'slipping', label: 'Slipping', min: 0, step: 1 },
]

export function bandFor(value) {
  return BANDS.find((b) => value >= b.min) || BANDS[BANDS.length - 1]
}

// Latest completed review per chapter, from the event log.
export function lastReviewMap(events = []) {
  const map = new Map()
  events.forEach((e) => {
    if (e.action !== 'completed' && e.action !== 'skipped_ahead') return
    const prev = map.get(e.chapterId)
    if (!prev || e.completedDate > prev) map.set(e.chapterId, e.completedDate)
  })
  return map
}

export function halfLife(chapter) {
  if (chapter.status === 'mastered' || !chapter.nextReviewDate) return MASTERED_HALF_LIFE
  const stage = Math.min(chapter.currentReviewIndex || 0, GAPS.length - 1)
  const h = GAPS[stage]
  return chapter.struggleFlag ? h / 2 : h
}

/** Estimated recall between 0 and 1. */
export function retention(chapter, lastReviewed, today = new Date()) {
  const since = lastReviewed || chapter.lastActionDate || chapter.studiedDate
  const t = Math.max(0, daysBetween(since, toISODate(today)))
  return Math.pow(2, -t / halfLife(chapter))
}

/** Every chapter with its recall, grouped under its subject (weakest first inside each). */
export function memoryMap(chapters, subjects, events, today = new Date()) {
  const last = lastReviewMap(events)
  const bySubject = new Map(subjects.map((s) => [s.id, { subject: s, items: [] }]))
  chapters.forEach((c) => {
    const value = retention(c, last.get(c.id), today)
    const group = bySubject.get(c.subjectId)
    if (group) group.items.push({ chapter: c, value, band: bandFor(value) })
  })
  return [...bySubject.values()]
    .filter((g) => g.items.length)
    .map((g) => {
      g.items.sort((a, b) => a.value - b.value)
      const active = g.items.filter((i) => i.chapter.status !== 'mastered')
      const pool = active.length ? active : g.items
      g.average = pool.reduce((sum, i) => sum + i.value, 0) / pool.length
      return g
    })
}

/** The subject whose active chapters have the lowest average recall. */
export function weakestSubject(groups) {
  const active = groups.filter((g) => g.items.some((i) => i.chapter.status !== 'mastered'))
  return active.length ? active.reduce((a, b) => (b.average < a.average ? b : a)) : null
}

/**
 * Reviews per day for the next `days` days, today first. Overdue reviews are
 * counted on today, since that's when they'll actually be done.
 */
export function forecast(chapters, days = 14, today = new Date()) {
  const start = toISODate(today)
  const list = Array.from({ length: days }, (_, i) => ({ date: toISODate(addDays(today, i)), count: 0, overdue: 0 }))
  const index = new Map(list.map((d, i) => [d.date, i]))
  chapters.forEach((c) => {
    if (c.status === 'mastered' || !c.nextReviewDate) return
    buildTimeline(c).forEach((step) => {
      if (step.state === 'done') return
      let date = step.date
      // The current review keeps the date it was snoozed to.
      if (step.state === 'next') date = c.nextReviewDate
      if (date < start) {
        list[0].count += 1
        list[0].overdue += 1
        return
      }
      const i = index.get(date)
      if (i != null) list[i].count += 1
    })
  })
  return list
}
