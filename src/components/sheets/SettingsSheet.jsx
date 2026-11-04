import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, Clock, Timer, Info, LogOut, Smartphone, Share, SquarePlus, HelpCircle, Monitor, Sun, Moon } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section, Row } from '../ui/List'
import Switch from '../ui/Switch'
import Segmented from '../ui/Segmented'
import Avatar from '../shell/Avatar'
import { useAuth } from '../../lib/useAuth'
import { useConfirm } from '../ui/Alert'
import { enablePushNotifications, disablePushNotifications } from '../../lib/push'
import { flushCloudData } from '../../lib/cloudSync'
import { isIOS, isStandalone } from '../ui/useMediaQuery'
import { APP_NAME, TAGLINE } from '../../brand'

const APPEARANCE_MODES = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]



export default function SettingsSheet({ cadence, onClose, onOpenGuide }) {
  const { prefs, updatePrefs, chapters, events } = cadence
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user, displayName, avatarUrl, signOut } = useAuth()
  const [message, setMessage] = useState('')

  const completed = events.filter((e) => e.action === 'completed').length

  function flash(text, ms = 3600) {
    setMessage(text)
    setTimeout(() => setMessage(''), ms)
  }

  async function handleSignOut() {
    const ok = await confirm({ title: 'Sign out?', message: 'Your chapters stay safe in your account.', confirmLabel: 'Sign out', destructive: true })
    if (!ok) return
    // Flush queued writes first — signing out tears down the session the
    // push needs, so anything still debounced would be lost.
    await flushCloudData()
    await signOut()
    navigate('/login', { replace: true })
  }

  async function toggleNotifications(next) {
    if (!('Notification' in window)) {
      flash('Notifications aren’t supported in this browser.')
      return
    }
    if (!next) {
      updatePrefs({ notificationsEnabled: false })
      disablePushNotifications()
      return
    }
    if (Notification.permission === 'denied') {
      flash('Notifications are blocked for this site — allow them in your browser’s site settings, then try again.', 5000)
      return
    }
    try {
      const perm = await Notification.requestPermission()
      updatePrefs({ notificationsEnabled: perm === 'granted' })
      if (perm === 'granted') {
        new Notification(APP_NAME, { body: 'Reminders are on — you’ll hear from us when something’s due.' })
        enablePushNotifications(user?.id)
      } else {
        flash('Permission wasn’t granted.')
      }
    } catch {
      flash('Couldn’t ask for notification permission in this browser.')
    }
  }

  function testNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    new Notification(APP_NAME, { body: 'This is a test — if you can see it, reminders are working.' })
    flash('Test notification sent.')
  }

  const showInstallHint = isIOS() && !isStandalone()

  return (
    <Sheet title="Settings" onClose={onClose} size="lg" trailing={null}>
      <div className="space-y-7">
        {/* Account */}
        <div className="flex items-center gap-3.5 bg-card rounded-cell px-4 py-3.5">
          <Avatar name={displayName} src={avatarUrl} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-body font-medium truncate">{displayName || 'Your account'}</p>
            {user?.email && <p className="text-footnote text-label-2 truncate">{user.email}</p>}
          </div>
          <p className="hidden xs:block text-footnote text-label-2 text-right tabular shrink-0">
            {chapters.length} chapters
            <br />
            {completed} reviews
          </p>
        </div>

        {/* Appearance */}
        <Section title="Appearance" footer="System follows your phone or computer's light and dark setting." listClassName="!bg-transparent !shadow-none">
          <Segmented
            ariaLabel="Appearance"
            value={prefs.themeMode || 'system'}
            onChange={(themeMode) => updatePrefs({ themeMode })}
            options={APPEARANCE_MODES}
            className="w-full"
          />
        </Section>

        <Section title="Navigation" footer="Turn Focus off to hide its timer, estimates and study-time summaries, and stop any active timer.">
          <Row
            icon={Timer}
            title="Show Focus timer"
            subtitle="Keep Focus in app navigation"
            trailing={
              <Switch
                checked={prefs.showFocusTimer !== false}
                onChange={(showFocusTimer) => updatePrefs({ showFocusTimer })}
                label="Show Focus timer"
              />
            }
          />
        </Section>

        {/* Reminders */}
        <Section
          title="Reminders"
          footer={
            message || (
              <>
                {showInstallHint && `On iPhone, add ${APP_NAME} to your Home Screen first — that's what lets reminders reach you. `}
                A daily nudge when chapters are due. Today's list is always accurate, whether or not a reminder fires.
              </>
            )
          }
        >
          <Row
            icon={Bell}
            title="Daily reminder"
            trailing={
              <Switch
                checked={!!prefs.notificationsEnabled}
                onChange={toggleNotifications}
                label="Daily reminder"
              />
            }
          />
          {prefs.notificationsEnabled && (
            <>
              <Row
                icon={Clock}
                title="Time"
                trailing={
                  <input
                    type="time"
                    value={prefs.notificationTime || '09:00'}
                    onChange={(e) => updatePrefs({ notificationTime: e.target.value || '09:00' })}
                    className="bg-fill-2 rounded-control px-3 text-subhead text-label outline-none tabular"
                    aria-label="Reminder time"
                  />
                }
              />
              <Row icon={BellRing} title="Send a test notification" onClick={testNotification} chevron />
            </>
          )}
        </Section>

        {showInstallHint && (
          <Section title="Install">
            <Row icon={Smartphone} title="Add to Home Screen">
              <span className="flex-1 min-w-0">
                <span className="block text-body">Add to Home Screen</span>
                <span className="block text-footnote text-label-2 mt-0.5">
                  Tap <Share size={13} className="inline -mt-0.5" /> Share, then <SquarePlus size={13} className="inline -mt-0.5" /> Add to Home Screen.
                </span>
              </span>
            </Row>
          </Section>
        )}

        <Section>
          {onOpenGuide && <Row icon={HelpCircle} title="How Unforget works" onClick={onOpenGuide} chevron />}
          <Row icon={Info} title={`About ${APP_NAME}`} chevron onClick={() => navigate('/welcome')} />
        </Section>

        <Section>
          <Row onClick={handleSignOut} center>
            <span className="flex items-center gap-2 text-body text-negative">
              <LogOut size={16} /> Sign out
            </span>
          </Row>
        </Section>

        <p className="text-center text-footnote text-label-3 pb-2">{APP_NAME} · {TAGLINE.replace(/\.$/, '')}</p>
      </div>
    </Sheet>
  )
}
