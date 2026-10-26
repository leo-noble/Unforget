import { useMemo } from 'react'
import { appIconSVG } from './iconArt'

// The app icon, drawn inline — same art as the Home Screen icon. A hairline
// edge keeps the black tile visible on a black canvas.
export default function AppIcon({ size = 56, className = '' }) {
  const html = useMemo(() => appIconSVG({ outline: true }), [])
  return (
    <span
      role="img"
      aria-label="Mnora"
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
