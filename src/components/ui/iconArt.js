// The Fivedot mark: a dot-matrix field with five lit dots on its middle row,
// each gap one step wider than the last (1, 2, 3, 4) — the shape of the
// review schedule itself. The fifth dot, mastery, is the red one.
//
// A plain string builder (no JSX) so the same art renders the in-app icon
// and, via scripts/generate-icons.mjs, every PNG the Home Screen uses.

const COLS = 13
const LIT = [1, 2, 4, 7, 11] // gaps of 1, 2, 3, 4 across a 13-dot row
const ROW = 6

export function appIconSVG({ shape = 'squircle', glyphScale = 1, outline = false } = {}) {
  const step = 1024 / COLS
  const c = (i) => (step * (i + 0.5)).toFixed(1)
  const field = []
  for (let r = 0; r < COLS; r++) {
    for (let col = 0; col < COLS; col++) {
      if (r === ROW && LIT.includes(col)) continue
      // Dots fade toward the edges so the field reads as a glow, not a grid.
      const o = Math.max(0, 0.22 - (Math.hypot(col - 6, r - 6) / 8.5) * 0.18)
      if (o > 0.01) field.push(`<circle cx="${c(col)}" cy="${c(r)}" r="9" fill="#fff" fill-opacity="${o.toFixed(3)}"/>`)
    }
  }
  const lit = LIT.map(
    (col, i) => `<circle cx="${c(col)}" cy="${c(ROW)}" r="34" fill="${i === LIT.length - 1 ? '#D71921' : '#FFFFFF'}"/>`
  ).join('')

  const rx = shape === 'squircle' ? 232 : 0
  const edge = outline
    ? `<rect x="2" y="2" width="1020" height="1020" rx="${rx}" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="4"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" aria-hidden="true">
  <rect width="1024" height="1024" rx="${rx}" fill="#000"/>
  <g transform="translate(512 512) scale(${glyphScale}) translate(-512 -512)">${field.join('')}${lit}</g>
  ${edge}
</svg>`
}
