// Local-only preview account, so the signed-in screens can be opened and
// screenshotted without a real sign-in. Only reachable in `vite dev` (every
// caller checks import.meta.env.DEV, so production builds drop it), and only
// after visiting a dashboard URL with ?preview=1 once in the tab.
import { addDays, nextReviewDateForIndex, toISODate, INTERVALS_FROM_DAY0, MAX_REVIEW_INDEX } from './srs'

const FLAG = 'unforget.devPreview'
export const PREVIEW_USER_ID = 'preview'

const SUBJECTS = [
  { id: 'sub-chem', name: 'Organic chemistry', colorTag: '#1B181C' },
  { id: 'sub-calc', name: 'Calculus II', colorTag: '#7A2E3A' },
  { id: 'sub-hist', name: 'Modern history', colorTag: '#A5342A' },
  { id: 'sub-span', name: 'Spanish B1', colorTag: '#8B8B85' },
]

// [subject, title, studied N days ago, reviews missed so far]
const CHAPTERS = [
  ['sub-chem', 'Alkenes and addition reactions', 12, 1],
  ['sub-chem', 'Stereochemistry and chirality', 5, 0],
  ['sub-chem', 'SN1 and SN2 mechanisms', 4, 0],
  ['sub-chem', 'Aromatic compounds', 27, 0],
  ['sub-chem', 'Carbonyl chemistry', 1, 0],
  ['sub-calc', 'Integration by parts', 9, 0],
  ['sub-calc', 'Trigonometric substitution', 11, 0],
  ['sub-calc', 'Series and convergence tests', 3, 1],
  ['sub-calc', 'Polar coordinates', 0, 0],
  ['sub-hist', 'The Treaty of Versailles', 20, 0],
  ['sub-hist', 'Rise of fascism in Italy', 15, 0],
  ['sub-hist', 'The Cold War begins', 2, 0],
  ['sub-hist', 'Industrial Revolution', 70, 0],
  ['sub-span', 'Preterite vs imperfect', 6, 1],
  ['sub-span', 'Subjunctive mood', 10, 0],
  ['sub-span', 'Food and restaurants vocabulary', 30, 0],
]

export function isDevPreview() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('preview') === '1') sessionStorage.setItem(FLAG, '1')
    return sessionStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}

export function previewSession() {
  return {
    user: { id: PREVIEW_USER_ID, email: 'maya.preview@localhost', user_metadata: { name: 'Maya Okafor' } },
  }
}

// Writes the sample account into the preview user's storage bucket the first
// time, so a refresh keeps whatever you did to it.
export function seedPreviewData() {
  const key = (name) => `cadence.u_${PREVIEW_USER_ID}.${name}`
  if (localStorage.getItem(key('chapters'))) return
  const today = new Date()
  const iso = (n) => toISODate(addDays(today, -n))
  const chapters = []
  const events = []
  CHAPTERS.forEach(([subjectId, title, ago, missed], i) => {
    const id = `ch-${i}`
    const studiedDate = iso(ago)
    const doneOnTime = INTERVALS_FROM_DAY0.filter((offset) => offset < ago).length
    const index = Math.max(0, doneOnTime - missed)
    const mastered = index >= MAX_REVIEW_INDEX
    for (let r = 0; r < index; r++) {
      const day = addDays(studiedDate, INTERVALS_FROM_DAY0[r])
      events.push({ id: `ev-${i}-${r}`, chapterId: id, scheduledDate: toISODate(day), completedDate: toISODate(day), action: 'completed' })
    }
    chapters.push({
      id,
      subjectId,
      title,
      notes: '',
      studiedDate,
      currentReviewIndex: mastered ? MAX_REVIEW_INDEX : index,
      nextReviewDate: mastered ? null : nextReviewDateForIndex(studiedDate, index),
      status: mastered ? 'mastered' : 'active',
      struggleFlag: title.startsWith('Preterite'),
      snoozeStreak: 0,
      createdAt: new Date(addDays(today, -ago)).toISOString(),
    })
  })
  const focusSessions = [
    [1, 32, 'ch-1'],
    [1, 25, 'ch-6'],
    [2, 41, 'ch-0'],
    [3, 25, 'ch-9'],
    [4, 18, 'ch-14'],
    [5, 25, 'ch-5'],
  ].map(([ago, minutes, chapterId], i) => ({ id: `fs-${i}`, date: iso(ago), minutes, chapterId, completedAt: new Date(addDays(today, -ago)).toISOString() }))

  localStorage.setItem(key('subjects'), JSON.stringify(SUBJECTS.map((s) => ({ ...s, createdAt: new Date().toISOString() }))))
  localStorage.setItem(key('chapters'), JSON.stringify(chapters))
  localStorage.setItem(key('events'), JSON.stringify(events))
  localStorage.setItem(key('focusSessions'), JSON.stringify(focusSessions))
  localStorage.setItem(key('prefs'), JSON.stringify({ themeMode: 'system', appearanceVersion: 1, weeklyFocusGoalMinutes: 300, onboarded: true }))
}
