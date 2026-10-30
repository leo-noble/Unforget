import { appIconSVG } from './iconArt'

// The app icon, drawn inline — same art as the Home Screen icon.
export default function AppIcon({ size = 56, className = '', bare = false }) {
  const html = bare ? appIconSVG({ background: false, dotColor: 'var(--label)' }) : appIconSVG()
  return (
    <span
      role="img"
      aria-label="Unforget"
      className={`inline-block shrink-0 ${className}`}
      style={{ width: size, height: size, filter: bare ? undefined : `drop-shadow(0 ${size * 0.06}px ${size * 0.14}px rgba(0, 0, 0, 0.22))` }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
