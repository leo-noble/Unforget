// The Mnora mark: five dots on a line, each gap one step wider than the last
// (1, 2, 3, 4) — the shape of the review schedule. Black and white only.
//
// A plain string builder (no JSX) so the same art renders the in-app icon
// and, via scripts/generate-icons.mjs, every PNG the Home Screen uses.

const UNIT = 78 // one step of the schedule
const LIT = [0, 1, 3, 6, 10] // gaps of 1, 2, 3, 4 steps

export function appIconSVG({ shape = 'squircle', glyphScale = 1, outline = false } = {}) {
  const left = 512 - (UNIT * 10) / 2
  const dots = LIT.map((step) => `<circle cx="${(left + step * UNIT).toFixed(1)}" cy="512" r="27" fill="#fff"/>`).join('')
  const rx = shape === 'squircle' ? 232 : 0
  const edge = outline
    ? `<rect x="2" y="2" width="1020" height="1020" rx="${rx}" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="4"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" aria-hidden="true">
  <rect width="1024" height="1024" rx="${rx}" fill="#000"/>
  <g transform="translate(512 512) scale(${glyphScale}) translate(-512 -512)">${dots}</g>
  ${edge}
</svg>`
}
