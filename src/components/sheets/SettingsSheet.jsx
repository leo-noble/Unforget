import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, Clock, Timer, RefreshCw, Check, Info, LogOut, Smartphone, Share, SquarePlus, Cloud, CloudOff, Monitor, Sun, Moon } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section, Row } from '../ui/List'
import Switch from '../ui/Switch'
import Avatar from '../shell/Avatar'
import { useAuth } from '../../lib/useAuth'
import { useConfirm } from '../ui/Alert'
import { enablePushNotifications, disablePushNotifications } from '../../lib/push'
import { flushCloudData } from '../../lib/cloudSync'
import { isIOS, isStandalone } from '../ui/useMediaQuery'
import { APP_NAME, TAGLINE } from '../../brand'

const SYNC_LABEL = {
  synced: 'Synced across devices',
  syncing: 'Saving changes…',
  offline: 'Offline — changes will retry automatically',
  idle: 'Sign in to sync across devices',
}

const APPEARANCE_MODES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
]

export default function SettingsSheet({ cadence, onClose }) {
  const { prefs, updatePrefs, subjects, chapters, events, syncState } = cadence
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
    const ok = await confirm({ title: 'Sign out?', message: 'Your chapters stay safe in your account.', confirmLabel: 'Sign Out', destructive: true })
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
        <div className="flex flex-col items-center text-center pt-1">
          <Avatar name={displayName} src={avatarUrl} size={76} />
          <p className="text-title-2 font-medium mt-4">{displayName || 'Your account'}</p>
          {user?.email && <p className="text-subhead text-label-2">{user.email}</p>}
          <div className="mt-5 grid grid-cols-3 w-full max-w-[360px] bg-card rounded-cell py-4">
            {[
              [subjects.length, 'Subjects'],
              [chapters.length, 'Chapters'],
              [completed, 'Reviews'],
            ].map(([n, label], i) => (
              <div key={label} className={i > 0 ? 'border-l border-separator' : ''}>
                <p className="font-display text-[30px] leading-none tabular">{n}</p>
                <p className="eyebrow text-label-2 mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <Section title="Appearance" footer="Dark is the default. System follows your iPhone or browser setting." listClassName="!rounded-full">
          <div className="p-1 bg-fill rounded-full grid grid-cols-3 gap-1" role="group" aria-label="Appearance">
            {APPEARANCE_MODES.map(({ id, label, icon: Icon }) => {
              const selected = (prefs.themeMode || 'dark') === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => updatePrefs({ themeMode: id })}
                  aria-pressed={selected}
                  className={`h-10 rounded-full flex items-center justify-center gap-1.5 text-subhead transition-colors ${
                    selected ? 'text-label shadow-card' : 'text-label-2 hover:text-label'
                  }`}
                  style={{ background: selected ? 'var(--glass-selected)' : undefined }}
                >
                  <Icon size={15} strokeWidth={1.8} /> {label}
                </button>
              )
            })}
          </div>
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
                    className="bg-fill rounded-[10px] px-3 text-subhead text-label outline-none tabular"
                    aria-label="Reminder time"
                  />
                }
              />
              <Row icon={BellRing} title="Send a test notification" onClick={testNotification} chevron />
            </>
          )}
        </Section>

        {/* Sync */}
        <Section title="Sync" footer="Your chapters, plans, progress, and settings sync automatically across your devices.">
          <Row
            icon={syncState === 'offline' ? CloudOff : Cloud}
            title="Automatic cloud sync"
            subtitle={SYNC_LABEL[syncState] || SYNC_LABEL.synced}
            trailing={
              <span className="h-9 w-9 rounded-full bg-fill flex items-center justify-center text-label-2" aria-hidden="true">
                {syncState === 'syncing' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : syncState === 'offline' ? (
                  <CloudOff size={17} />
                ) : syncState === 'synced' ? (
                  <Check size={17} />
                ) : (
                  <Cloud size={17} />
                )}
              </span>
            }
          />
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
          <Row icon={Info} title={`About ${APP_NAME}`} chevron onClick={() => navigate('/welcome')} />
        </Section>

        <Section>
          <Row onClick={handleSignOut} center>
            <span className="flex items-center gap-2 text-body text-accent">
              <LogOut size={18} /> Sign Out
            </span>
          </Row>
        </Section>

        <p className="text-center text-footnote text-label-3 pb-2">{APP_NAME} · {TAGLINE.replace(/\.$/, '')}</p>
      </div>
    </Sheet>
  )
}
