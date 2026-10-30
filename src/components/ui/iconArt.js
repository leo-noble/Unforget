// The Unforget mark: five dots on a line, each gap one step wider than the
// last (1, 2, 3, 4) — the shape of the review schedule — in white on graphite.
//
// A plain string builder (no JSX) so the same art renders the in-app icon
// and, via scripts/generate-icons.mjs, every PNG the Home Screen uses. `id`
// namespaces the gradient ids: two inline SVGs sharing an id would both
// resolve to whichever came first, which breaks if that one is hidden.

const UNIT = 78 // one step of the schedule
const LIT = [0, 1, 3, 6, 10] // gaps of 1, 2, 3, 4 steps

export function appIconSVG({ shape = 'squircle', glyphScale = 1, background = true, dotColor = '#f1f1ed' } = {}) {
  const left = 512 - (UNIT * 10) / 2
  const dots = LIT.map((step) => `<circle cx="${(left + step * UNIT).toFixed(1)}" cy="512" r="29" fill="${dotColor}"/>`).join('')
  const rx = shape === 'squircle' ? 232 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" aria-hidden="true">
  <defs>
  </defs>
  ${background ? `<rect width="1024" height="1024" rx="${rx}" fill="#191a19"/>` : `<rect x="9" y="9" width="1006" height="1006" rx="${rx}" fill="var(--fill)" stroke="${dotColor}" stroke-opacity="0.2" stroke-width="18"/>`}
  <g transform="translate(512 512) scale(${glyphScale}) translate(-512 -512)">${dots}</g>
</svg>`
}
