// The Retavo mark: a planet with one ring and a small moon on it — the
// chapter, and the review that keeps coming back around to it. Kept as a plain string builder
// (no JSX) so the same art renders the in-app icon and, via
// scripts/generate-icons.mjs, every PNG the Home Screen and browsers use.
//
// `id` namespaces the gradient ids: two inline SVGs sharing an id would both
// resolve to whichever came first, which breaks if that one is display:none.

export function appIconSVG({ id = 'appicon', shape = 'squircle', glyphScale = 1 } = {}) {
  const g = (name) => `${id}-${name}`
  const bg =
    shape === 'squircle'
      ? `<rect width="1024" height="1024" rx="232" fill="url(#${g('bg')})"/>
         <rect width="1024" height="1024" rx="232" fill="url(#${g('sheen')})"/>`
      : `<rect width="1024" height="1024" fill="url(#${g('bg')})"/>
         <rect width="1024" height="1024" fill="url(#${g('sheen')})"/>`

  const s = glyphScale
  const t = `translate(512 512) scale(${s}) rotate(-22)`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" aria-hidden="true">
  <defs>
    <linearGradient id="${g('bg')}" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#8E7DFF"/>
      <stop offset="0.5" stop-color="#5A48EE"/>
      <stop offset="1" stop-color="#2A2390"/>
    </linearGradient>
    <radialGradient id="${g('sheen')}" cx="0.3" cy="0.02" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.42"/>
      <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${g('planet')}" cx="0.36" cy="0.3" r="0.78">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#E4E0FF"/>
      <stop offset="1" stop-color="#A79DFF"/>
    </radialGradient>
    <linearGradient id="${g('ring')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.85"/>
    </linearGradient>
    <radialGradient id="${g('moon')}" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#FFF6D6"/>
      <stop offset="0.6" stop-color="#FFD15C"/>
      <stop offset="1" stop-color="#FF9F2E"/>
    </radialGradient>
    <radialGradient id="${g('glow')}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${bg}
  <circle cx="512" cy="512" r="${300 * s}" fill="url(#${g('glow')})"/>
  <g transform="${t}">
    <path d="M -356 0 A 356 124 0 0 1 356 0" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="44" stroke-linecap="butt"/>
  </g>
  <circle cx="512" cy="512" r="${166 * s}" fill="url(#${g('planet')})"/>
  <g transform="${t}">
    <path d="M -356 0 A 356 124 0 0 0 356 0" fill="none" stroke="#2A2390" stroke-opacity="0.22" stroke-width="64" stroke-linecap="butt"/>
    <path d="M -356 0 A 356 124 0 0 0 356 0" fill="none" stroke="url(#${g('ring')})" stroke-width="44" stroke-linecap="butt"/>
    <circle cx="226" cy="96" r="50" fill="#2A2390" fill-opacity="0.25"/>
    <circle cx="226" cy="92" r="44" fill="url(#${g('moon')})"/>
  </g>
</svg>`
}
