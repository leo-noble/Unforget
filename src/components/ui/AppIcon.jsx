import { useId, useMemo } from 'react'
import { appIconSVG } from './iconArt'

// The app icon, drawn inline — same art as the Home Screen icon.
export default function AppIcon({ size = 56, className = '' }) {
  const id = `ai${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const html = useMemo(() => appIconSVG({ id }), [id])
  return (
    <span
      role="img"
      aria-label="Unforget"
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size, filter: `drop-shadow(0 ${size * 0.06}px ${size * 0.14}px rgba(0, 0, 0, 0.22))` }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
