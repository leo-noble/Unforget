import { MAX_REVIEW_INDEX, daysBetween, startOfDay } from '../../lib/srs'
import { relativeDay } from '../../lib/format'

// What a chapter's status looks like on screen — one place, so a row, a sheet
// and a toast can't describe the same chapter three different ways.
export const STATUS_TONE = {
  overdue: 'var(--accent)',
  due: 'var(--tint)',
  upcoming: 'var(--label-2)',
  mastered: 'var(--green)',
}

export function reviewLabel(chapter) {
  if (chapter.status === 'mastered' || chapter.derivedStatus === 'mastered') return 'Mastered'
  return `Review ${Math.min(chapter.currentReviewIndex + 1, MAX_REVIEW_INDEX)} of ${MAX_REVIEW_INDEX}`
}

export function whenLabel(chapter, today = new Date()) {
  const s = chapter.derivedStatus
  if (s === 'mastered' || !chapter.nextReviewDate) return ''
  if (s === 'due') return 'Due today'
  if (s === 'overdue') {
    const n = -daysBetween(today, chapter.nextReviewDate)
    return n === 1 ? '1 day overdue' : `${n} days overdue`
  }
  return relativeDay(chapter.nextReviewDate, today)
}

/** Compact form for the trailing edge of a row: "2d late", "Today", "Tomorrow", "Thu". */
export function shortWhen(chapter, today = new Date()) {
  const s = chapter.derivedStatus
  if (s === 'mastered' || !chapter.nextReviewDate) return ''
  const diff = daysBetween(today, chapter.nextReviewDate)
  if (s === 'overdue') return `${-diff}d late`
  if (s === 'due') return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return startOfDay(chapter.nextReviewDate).toLocaleDateString(undefined, { weekday: 'short' })
  return startOfDay(chapter.nextReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const isActionable = (chapter) => chapter.derivedStatus === 'due' || chapter.derivedStatus === 'overdue'
