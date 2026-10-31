import { supabase, isSupabaseConfigured } from './supabaseClient'

// Anonymous visit counting for the admin page. Each device gets a random id
// (no IPs, no fingerprinting); a signed-in user's id rides along so the admin
// can see who's active. Rows are write-only from the browser — only the
// admin_overview() function can read them back.

const VISITOR_KEY = 'unforget.visitor'
const DEDUPE_MS = 30 * 60 * 1000
const lastLogged = new Map()

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return 'nostorage-' + Math.random().toString(36).slice(2, 10)
  }
}

// Tabs inside the app count as one area, so flipping Today ↔ Plan isn't
// twenty "visits".
function bucket(path) {
  if (path.startsWith('/dashboard')) return '/dashboard'
  return path.slice(0, 200) || '/'
}

export function trackPageView(pathname, userId) {
  if (!isSupabaseConfigured || typeof window === 'undefined') return
  if (import.meta.env.DEV) return
  const path = bucket(pathname)
  if (path === '/admin') return
  const key = `${path}|${userId || ''}`
  const now = Date.now()
  if (now - (lastLogged.get(key) || 0) < DEDUPE_MS) return
  lastLogged.set(key, now)

  let referrer = null
  try {
    if (document.referrer && new URL(document.referrer).origin !== location.origin) {
      referrer = new URL(document.referrer).hostname.slice(0, 300)
    }
  } catch {
    // ignore a malformed referrer
  }

  supabase
    .from('page_views')
    .insert({ path, visitor_id: visitorId(), user_id: userId || null, referrer })
    .then(() => {}, () => {})
}
