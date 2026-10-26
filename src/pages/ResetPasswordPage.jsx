import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck } from 'lucide-react'
import AuthLayout, { FieldGroup, Field, ErrorNote } from '../components/auth/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/useAuth'
import { isSupabaseConfigured } from '../lib/supabaseClient'

// Supabase's reset email links here with a recovery token in the URL, which
// detectSessionInUrl turns into a short-lived session — so updatePassword()
// can be called directly, with no token handling here.
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Use at least 6 characters.')
    if (password !== confirm) return setError('Those passwords don’t match.')
    setSubmitting(true)
    try {
      const { error: e2 } = await updatePassword(password)
      if (e2) return setError(e2.message || 'Couldn’t update your password. The link may have expired — request a new one.')
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <AuthLayout title="Not set up yet" subtitle="Connect a Supabase project before passwords can be reset." />
    )
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You’re all set." back={false}>
        <div className="flex flex-col items-center">
          <span className="h-14 w-14 rounded-full bg-green/15 text-green flex items-center justify-center">
            <CheckCheck size={28} />
          </span>
          <Button size="lg" block className="mt-6" onClick={() => navigate('/app', { replace: true })}>
            Open Today
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Something you haven’t used before." back={false}>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field label="New password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
          <Field label="Confirm password" type="password" autoComplete="new-password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" />
        </FieldGroup>
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" size="lg" block className="mt-5" disabled={!password || !confirm || submitting}>
          {submitting ? 'Updating…' : 'Update Password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
