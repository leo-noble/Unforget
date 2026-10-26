import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

// Supabase Auth's session, read once at the root and shared through context
// so every screen agrees on who's signed in without each re-reading it.
// `loading` covers the brief check for a stored session on first load —
// routes wait for it before deciding where to send the user.

const AuthContext = createContext(null)

// Set the first time a session is seen on this device. A signed-out visitor
// who has used the app before goes straight to sign-in, not the marketing page.
const RETURNING_KEY = 'fivedot.returning'

export function hasSignedInBefore() {
  try {
    if (localStorage.getItem(RETURNING_KEY) === '1') return true
    // Accounts that signed in before this flag existed left user-scoped
    // cache keys behind (see storage.js) — those count too.
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('cadence.u_')) return true
    }
  } catch {
    // storage unavailable — treat as a first visit
  }
  return false
}

function markReturning() {
  try {
    localStorage.setItem(RETURNING_KEY, '1')
  } catch {
    // best-effort
  }
}

/**
 * Only same-site paths are followed after sign-in. Anything else — a full URL,
 * a protocol-relative `//host` — falls back to the app, so a crafted
 * `?redirect=` link can't bounce someone off to another site.
 */
export function safeRedirectPath(path, fallback = '/app') {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return fallback
  }
  return path
}

// Where Supabase sends the browser back to after Google or an email link. A
// plain path on this same origin, with no query string: Supabase matches it
// against the project's Redirect URL allowlist, and anything that doesn't
// match falls back to the Site URL instead — which is how sign-in used to end
// up on a different (password-protected) Vercel deployment.
const returnURL = (path) => `${window.location.origin}${safeRedirectPath(path)}`

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    // getSession() resolves only after the client has finished reading any
    // OAuth tokens out of the URL, so a just-returned Google sign-in is
    // already a session by the time `loading` flips.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) markReturning()
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next) markReturning()
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.signInWithPassword({ email, password })
  }, [])

  const signUp = useCallback(async (email, password, name) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: returnURL('/app') },
    })
  }, [])

  // Google redirects straight back into the app. The session is picked up
  // from the URL on load, and RequireAuth waits for it before rendering.
  const signInWithGoogle = useCallback(async (redirectPath = '/app') => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: returnURL(redirectPath) },
    })
  }, [])

  // Emails a reset link. It lands on /reset-password with a recovery token,
  // which detectSessionInUrl turns into a short-lived session for
  // updatePassword below.
  const resetPasswordForEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: returnURL('/reset-password') })
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.updateUser({ password })
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(() => {
    const user = session?.user || null
    // Prefer the display name set at sign-up, then Google's full name, then
    // the local part of the email, so there's always something to greet with.
    const displayName =
      user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
    return {
      session,
      user,
      displayName,
      avatarUrl,
      loading,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      resetPasswordForEmail,
      updatePassword,
      signOut,
    }
  }, [session, loading, signInWithPassword, signUp, signInWithGoogle, resetPasswordForEmail, updatePassword, signOut])

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
