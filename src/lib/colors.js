// Subject and study-block colours.
//
// New subjects get one of Apple's system colours. Subjects created before the
// redesign carry the old muted palette (near-black, maroon, greys), which is
// invisible on a dark canvas — so those exact hexes are re-mapped at render
// time. The stored value is never rewritten, so nothing changes in sync.

export const SUBJECT_PALETTE = [
  '#0A84FF', // blue
  '#5E5CE6', // indigo
  '#AF52DE', // purple
  '#FF2D55', // pink
  '#FF9500', // orange
  '#34C759', // green
  '#30B0C7', // teal
  '#A2845E', // brown
]

const LEGACY = {
  '#1b181c': '#5E5CE6',
  '#7a2e3a': '#FF2D55',
  '#a5342a': '#FF9500',
  '#8b8b85': '#30B0C7',
  '#4a4448': '#AF52DE',
  '#726d70': '#34C759',
}

export function subjectColor(hex) {
  if (!hex || typeof hex !== 'string') return 'var(--tint)'
  return LEGACY[hex.toLowerCase()] || hex
}

export function nextSubjectColor(subjects = []) {
  return SUBJECT_PALETTE[subjects.length % SUBJECT_PALETTE.length]
}
