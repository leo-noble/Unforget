import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider, useAuth, hasSignedInBefore } from './lib/useAuth'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Alert'
import Splash from './components/ui/Splash'
import { applyAppearance } from './lib/appearance'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AppShell from './AppShell'

// The marketing page is only for people who haven't signed in yet, so it's
// split out of the bundle everyone else downloads.
const LandingPage = lazy(() => import('./pages/LandingPage'))

/**
 * "/" decides where you actually wanted to go:
 *   signed in              → straight into the app
 *   signed out, been here  → sign-in (you've already read the pitch)
 *   first visit            → the landing page
 * It used to always render the landing page, so a signed-in user had to find
 * and press "Log in" every single time they opened the site.
 */
function Entry() {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/app" replace />
  if (hasSignedInBefore()) return <Navigate to="/login" replace />
  return (
    <Suspense fallback={<Splash />}>
      <LandingPage />
    </Suspense>
  )
}

// Gates /app behind a real session. While the stored session (or one coming
// back from Google in the URL) is being read, show the splash rather than
// bouncing to sign-in and back.
function RequireAuth({ children }) {
  const location = useLocation()
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) {
    // An OAuth failure comes back as ?error_description= (or in the hash);
    // carry it to the sign-in screen so the user sees why, not a silent bounce.
    const params = new URLSearchParams(location.search || location.hash.replace(/^#/, ''))
    const error = params.get('error_description')
    const to = new URLSearchParams({ redirect: location.pathname })
    if (error) to.set('error', error)
    // A string `to` keeps Navigate's effect deps stable (an object would
    // re-fire it every render).
    return <Navigate to={`/login?${to.toString()}`} replace />
  }
  return children
}

export default function App() {
  // Every screen, signed in or not, tracks the device's light/dark switch.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () =>
      applyAppearance({
        theme: document.documentElement.dataset.accent,
        themeMode: document.documentElement.dataset.themeMode || 'dark',
      })
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden="true" className="aurora fixed inset-0 -z-10 pointer-events-none" />
      <div aria-hidden="true" className="status-scrim" />
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Entry />} />
                <Route
                  path="/welcome"
                  element={
                    <Suspense fallback={<Splash />}>
                      <LandingPage />
                    </Suspense>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/app/*"
                  element={
                    <RequireAuth>
                      <AppShell />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
