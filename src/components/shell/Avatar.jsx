import { useState } from 'react'

// The user's Google photo when there is one, else their initial on the
// accent gradient — the same disc Apple uses for the account button.
export default function Avatar({ name, src, size = 36, className = '' }) {
  const [broken, setBroken] = useState(false)
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`tint-gradient rounded-full shrink-0 flex items-center justify-center text-tint-fg font-medium ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
