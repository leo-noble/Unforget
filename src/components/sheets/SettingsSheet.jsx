import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, BellRing, Clock, RefreshCw, Info, LogOut, Smartphone, Share, SquarePlus, Cloud, CloudOff } from 'lucide-react'
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

const SYNC_LABEL = {
  synced: 'Up to date',
  syncing: 'Syncing…',
  offline: 'Offline — saved on this device',
  idle: 'Not signed in',
}

export default function SettingsSheet({ cadence, onClose }) {
  const { prefs, updatePrefs, subjects, chapters, events, syncState, syncNow } = cadence
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user, displayName, avatarUrl, signOut } = useAuth()
  const [message, setMessage] = useState('')

  const mode = prefs.themeMode === 'light' || prefs.themeMode === 'dark' ? prefs.themeMode : 'system'
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
        <Section title="Appearance">
          <div className="px-4 py-3.5">
            <Segmented
              layoutId="settings-mode"
              ariaLabel="Appearance"
              value={mode}
              onChange={(m) => updatePrefs({ themeMode: m })}
              options={[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'Auto' },
              ]}
              className="w-full"
            />
          </div>
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
        <Section title="Sync" footer="Your chapters sync to every device you sign in on.">
          <Row
            icon={syncState === 'offline' ? CloudOff : Cloud}
            title="Cloud sync"
            subtitle={SYNC_LABEL[syncState] || SYNC_LABEL.synced}
            trailing={
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => syncNow()}
                disabled={syncState === 'syncing'}
                aria-label="Sync now"
                className="h-9 w-9 rounded-full bg-fill flex items-center justify-center text-label disabled:opacity-40"
              >
                <RefreshCw size={17} className={syncState === 'syncing' ? 'animate-spin' : ''} />
              </motion.button>
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
            <span className="flex items-center gap-2 text-body text-red">
              <LogOut size={18} /> Sign Out
            </span>
          </Row>
        </Section>

        <p className="text-center text-footnote text-label-3 pb-2">{APP_NAME} · {TAGLINE.replace(/\.$/, '')}</p>
      </div>
    </Sheet>
  )
}
