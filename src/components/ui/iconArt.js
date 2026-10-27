// The Unforget mark: five dots on a line, each gap one step wider than the
// last (1, 2, 3, 4) — the shape of the review schedule — on the same aurora
// that sits behind the app.
//
// A plain string builder (no JSX) so the same art renders the in-app icon
// and, via scripts/generate-icons.mjs, every PNG the Home Screen uses. `id`
// namespaces the gradient ids: two inline SVGs sharing an id would both
// resolve to whichever came first, which breaks if that one is hidden.

const UNIT = 78 // one step of the schedule
const LIT = [0, 1, 3, 6, 10] // gaps of 1, 2, 3, 4 steps

export function appIconSVG({ id = 'ui', shape = 'squircle', glyphScale = 1 } = {}) {
  const g = (n) => `${id}-${n}`
  const left = 512 - (UNIT * 10) / 2
  const dots = LIT.map((step) => `<circle cx="${(left + step * UNIT).toFixed(1)}" cy="512" r="29" fill="#fff"/>`).join('')
  const rx = shape === 'squircle' ? 232 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" aria-hidden="true">
  <defs>
    <linearGradient id="${g('bg')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5B45FF"/>
      <stop offset="0.55" stop-color="#3A1E9E"/>
      <stop offset="1" stop-color="#1A0F3D"/>
    </linearGradient>
    <radialGradient id="${g('pink')}" cx="0.95" cy="0.1" r="0.7">
      <stop offset="0" stop-color="#FF4FA8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#FF4FA8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${g('cyan')}" cx="0.1" cy="1" r="0.75">
      <stop offset="0" stop-color="#35C2FF" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#35C2FF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${g('sheen')}" cx="0.3" cy="0" r="0.8">
      <stop offset="0" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" rx="${rx}" fill="url(#${g('bg')})"/>
  <rect width="1024" height="1024" rx="${rx}" fill="url(#${g('pink')})"/>
  <rect width="1024" height="1024" rx="${rx}" fill="url(#${g('cyan')})"/>
  <rect width="1024" height="1024" rx="${rx}" fill="url(#${g('sheen')})"/>
  <g transform="translate(512 512) scale(${glyphScale}) translate(-512 -512)">${dots}</g>
</svg>`
}
