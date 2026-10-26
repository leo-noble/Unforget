import { useId, useMemo } from 'react'
import { orbitIconSVG } from './iconArt'

// The app icon, drawn inline. Same art as the Home Screen icon, so the app's
// own chrome and what's on the user's phone are visibly the same thing.
export default function AppIcon({ size = 56, className = '', shadow = true }) {
  const raw = useId()
  const id = `ai${raw.replace(/[^a-zA-Z0-9]/g, '')}`
  const html = useMemo(() => orbitIconSVG({ id }), [id])
  return (
    <span
      role="img"
      aria-label="Orbit"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        filter: shadow ? `drop-shadow(0 ${size * 0.08}px ${size * 0.16}px rgba(42, 35, 144, 0.28))` : undefined,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
