// Appearance: an accent colour plus light / dark / automatic, applied as two
// attributes on <html> that every token in index.css keys off.
//
// `prefs.theme` used to name a whole palette family (slate / aurora / forest).
// It now names an accent, and the old values map onto the nearest one, so a
// preference synced down from an older device still lands somewhere sensible.

export const ACCENTS = [
  { id: 'indigo', label: 'Indigo', light: '#5856D6', dark: '#5E5CE6' },
  { id: 'blue', label: 'Blue', light: '#007AFF', dark: '#0A84FF' },
  { id: 'teal', label: 'Teal', light: '#30B0C7', dark: '#40C8E0' },
  { id: 'green', label: 'Green', light: '#34C759', dark: '#30D158' },
  { id: 'orange', label: 'Orange', light: '#FF9500', dark: '#FF9F0A' },
  { id: 'pink', label: 'Pink', light: '#FF2D55', dark: '#FF375F' },
  { id: 'purple', label: 'Purple', light: '#AF52DE', dark: '#BF5AF2' },
]

export const DEFAULT_ACCENT = 'indigo'

const LEGACY_THEME = {
  slate: 'indigo', // the old default maps to the new default
  aurora: 'purple',
  forest: 'green',
  linen: 'green',
  fog: 'indigo',
  graphite: 'indigo',
  verdant: 'green',
}

export function resolveAccent(theme) {
  if (ACCENTS.some((a) => a.id === theme)) return theme
  return LEGACY_THEME[theme] || DEFAULT_ACCENT
}

// Light and dark always follow the device. A stored themeMode from an older
// version is ignored rather than deleted, so it still syncs harmlessly.
export function resolveMode() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Mirrors the canvas colour so the status bar and the browser chrome blend
// into the page instead of sitting on it as a separate stripe.
const CANVAS = { light: '#F3F1F8', dark: '#0B0A14' }

// Signed-in prefs live under a per-user key, which the inline boot script in
// index.html can't know before auth resolves. This is the one global copy it
// reads, so a returning user's first frame is already in their colours.
const BOOT_KEY = 'unforget.appearance'

export function applyAppearance({ theme, themeMode } = {}) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const accent = resolveAccent(theme)
  const mode = resolveMode(themeMode)
  const changed = root.dataset.accent !== accent || root.dataset.mode !== mode
  if (changed && root.dataset.mode) {
    // Cross-fade only while the switch is happening. A permanent transition on
    // every element (what this used to do) made every press and scroll on a
    // phone pay for colour interpolation it never needed.
    root.classList.add('appearance-switching')
    clearTimeout(applyAppearance._t)
    applyAppearance._t = setTimeout(() => root.classList.remove('appearance-switching'), 320)
  }
  root.dataset.accent = accent
  root.dataset.mode = mode
  root.style.colorScheme = mode
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute('content', CANVAS[mode])
    m.removeAttribute('media')
  })
  try {
    localStorage.setItem(BOOT_KEY, JSON.stringify({ accent, themeMode: themeMode || 'system' }))
  } catch {
    // storage can be unavailable (private mode); the defaults still apply
  }
}

export function accentHex(theme, mode = resolveMode()) {
  const a = ACCENTS.find((x) => x.id === resolveAccent(theme)) || ACCENTS[0]
  return mode === 'dark' ? a.dark : a.light
}
