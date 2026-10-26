import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MailCheck, Eye, EyeOff } from 'lucide-react'
import AuthLayout, { FieldGroup, Field, ErrorNote } from '../components/auth/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth, safeRedirectPath } from '../lib/useAuth'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { APP_NAME } from '../brand'

// Google's brand guidelines ask that the "G" not be recoloured, so this is
// the full four-colour glyph rather than a currentColor icon.
function GoogleGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.98a9 9 0 0 0 0 8.08l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

const EMAIL_MAX = 200
const NAME_MAX = 80

function Sent({ title, body, onBack }) {
  return (
    <div className="bg-card rounded-cell p-6 text-center shadow-card">
      <span className="mx-auto h-14 w-14 rounded-full bg-tint/15 text-tint flex items-center justify-center">
        <MailCheck size={26} />
      </span>
      <h2 className="text-title-3 font-bold mt-4">{title}</h2>
      <p className="text-subhead text-label-2 mt-1.5">{body}</p>
      <Button variant="tinted" className="mt-5" onClick={onBack}>
        Back to sign in
      </Button>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, signInWithPassword, signUp, signInWithGoogle, resetPasswordForEmail } = useAuth()

  const params = new URLSearchParams(location.search)
  // Only same-site paths are followed — a crafted ?redirect= can't send
  // someone off to another site after they sign in.
  const redirectTo = safeRedirectPath(params.get('redirect'))

  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(() => params.get('error') || '')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(null) // 'confirm' | 'reset'
  const [googleLoading, setGoogleLoading] = useState(false)

  // Already signed in (or a session just arrived) → straight into the app.
  useEffect(() => {
    if (session) navigate(redirectTo, { replace: true })
  }, [session, navigate, redirectTo])

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  async function google() {
    setError('')
    setGoogleLoading(true)
    const { error: e } = await signInWithGoogle(redirectTo)
    if (e) {
      setError(e.message || 'Could not start Google sign-in.')
      setGoogleLoading(false)
    }
    // On success the browser leaves for Google.
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        const { error: e2 } = await resetPasswordForEmail(trimmed)
        if (e2) return setError(e2.message || 'Could not send the reset email.')
        setSent('reset')
        return
      }
      if (!password) return
      if (mode === 'signin') {
        const { error: e2 } = await signInWithPassword(trimmed, password)
        if (e2) return setError(e2.message || 'Could not sign in.')
        navigate(redirectTo, { replace: true })
      } else {
        const { data, error: e2 } = await signUp(trimmed, password, name.trim())
        if (e2) return setError(e2.message || 'Could not create the account.')
        // With email confirmation on, a new account has no session yet.
        if (!data?.session) setSent('confirm')
        else navigate(redirectTo, { replace: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <AuthLayout title="Sign-in isn’t set up" subtitle="Connect a Supabase project to enable accounts.">
        <p className="bg-card rounded-cell p-5 text-subhead text-label-2 shadow-card">
          Copy <code className="text-label">.env.example</code> to <code className="text-label">.env</code> and add your
          project’s URL and anon key.
        </p>
      </AuthLayout>
    )
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox">
        <Sent
          title={sent === 'confirm' ? 'Confirm your email' : 'Reset link sent'}
          body={
            sent === 'confirm'
              ? `We sent a link to ${email.trim()}. Open it to finish creating your account.`
              : `We sent a password reset link to ${email.trim()}.`
          }
          onBack={() => {
            setSent(null)
            setPassword('')
            switchMode('signin')
          }}
        />
      </AuthLayout>
    )
  }

  const titles = {
    signin: [`Welcome to ${APP_NAME}`, 'Sign in to see what’s due today.'],
    signup: ['Create your account', 'Free. Takes ten seconds.'],
    forgot: ['Reset password', 'We’ll email you a link to choose a new one.'],
  }

  return (
    <AuthLayout
      title={titles[mode][0]}
      subtitle={titles[mode][1]}
      footer={
        mode === 'forgot' ? (
          <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-tint">
            Back to sign in
          </button>
        ) : (
          <>
            {mode === 'signin' ? 'New here? ' : 'Have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-tint">
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </>
        )
      }
    >
      {mode !== 'forgot' && (
        <>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={google}
            disabled={googleLoading || submitting}
            className="w-full h-[52px] rounded-full bg-card shadow-card flex items-center justify-center gap-2.5 text-headline font-semibold disabled:opacity-50"
            style={{ boxShadow: 'inset 0 0 0 0.5px var(--separator), var(--shadow-card)' }}
          >
            <GoogleGlyph />
            {googleLoading ? 'Opening Google…' : 'Continue with Google'}
          </motion.button>
          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-separator" />
            <span className="text-footnote text-label-2">or use email</span>
            <span className="h-px flex-1 bg-separator" />
          </div>
        </>
      )}

      <form onSubmit={submit}>
        <FieldGroup>
          <AnimatePresence initial={false}>
            {mode === 'signup' && (
              <motion.div key="name" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Field label="Name" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} placeholder="Name" autoComplete="name" />
              </motion.div>
            )}
          </AnimatePresence>
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            value={email}
            maxLength={EMAIL_MAX}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          {mode !== 'forgot' && (
            <div className="relative" style={{ '--inset': '16px' }}>
              <Field
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full flex items-center justify-center text-label-2"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          )}
        </FieldGroup>

        {mode === 'signin' && (
          <div className="text-right mt-2.5 px-1">
            <button type="button" onClick={() => switchMode('forgot')} className="text-footnote font-semibold text-tint">
              Forgot password?
            </button>
          </div>
        )}

        <ErrorNote>{error}</ErrorNote>

        <Button
          type="submit"
          size="lg"
          block
          className="mt-5"
          disabled={!email.trim() || (mode !== 'forgot' && !password) || submitting}
        >
          {submitting ? 'One moment…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </Button>
      </form>
    </AuthLayout>
  )
}
