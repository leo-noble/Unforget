import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, Clock, Timer, RefreshCw, Check, Info, LogOut, Smartphone, Share, SquarePlus, Cloud, CloudOff, Download, Upload, CalendarPlus, Keyboard } from 'lucide-react'
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
import { exportAllData, importAllData, exportChaptersToICS } from '../../lib/storage'
import { toISODate } from '../../lib/srs'

const SYNC_LABEL = {
  synced: 'Synced across devices',
  syncing: 'Saving changes…',
  offline: 'Offline — changes will retry automatically',
  idle: 'Sign in to sync across devices',
}

const APPEARANCE_MODES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Reads a backup just far enough to describe it before anything is replaced.
function describeBackup(text) {
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object' || !Array.isArray(data.chapters)) return null
    return {
      chapters: data.chapters.length,
      subjects: Array.isArray(data.subjects) ? data.subjects.length : 0,
      date: data.exportedAt ? new Date(data.exportedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null,
    }
  } catch {
    return null
  }
}

export default function SettingsSheet({ cadence, onClose, onOpenShortcuts }) {
  const { prefs, updatePrefs, chapters, events, syncState } = cadence
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user, displayName, avatarUrl, signOut } = useAuth()
  const [message, setMessage] = useState('')
  const [dataMessage, setDataMessage] = useState('')
  const fileRef = useRef(null)

  function exportBackup() {
    download(`unforget-backup-${toISODate(new Date())}.json`, exportAllData(), 'application/json')
    setDataMessage('Backup saved to your downloads.')
  }

  function exportCalendar() {
    download('unforget-reviews.ics', exportChaptersToICS(), 'text/calendar')
    setDataMessage('Calendar file saved. Open it to add your reviews to Calendar.')
  }

  async function importBackup(file) {
    if (!file) return
    const text = await file.text()
    const info = describeBackup(text)
    if (!info) {
      setDataMessage('That file isn’t an Unforget backup.')
      return
    }
    const ok = await confirm({
      title: 'Restore this backup?',
      message: `${info.chapters} chapters in ${info.subjects} subjects${info.date ? `, saved ${info.date}` : ''}. It replaces what’s in your account now.`,
      confirmLabel: 'Restore',
      destructive: true,
    })
    if (!ok) return
    const result = importAllData(text)
    if (!result.ok) {
      setDataMessage(result.error)
      return
    }
    // Reload so every screen reads the restored data; sync then pushes it.
    window.location.reload()
  }

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

        {/* Sync */}
        <Section title="Sync" footer="Your chapters, plans, progress, and settings sync automatically across your devices.">
          <Row
            icon={syncState === 'offline' ? CloudOff : Cloud}
            title="Automatic cloud sync"
            subtitle={SYNC_LABEL[syncState] || SYNC_LABEL.synced}
            trailing={
              <span className="flex items-center justify-center text-label-2" aria-hidden="true">
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

        <Section title="Your data" footer={dataMessage || 'A backup holds every subject, chapter, review and setting. Restoring one replaces your current data.'}>
          <Row icon={Download} title="Download a backup" subtitle=".json, restorable here" onClick={exportBackup} chevron />
          <Row icon={Upload} title="Restore from a backup" onClick={() => fileRef.current?.click()} chevron />
          <Row icon={CalendarPlus} title="Add reviews to your calendar" subtitle=".ics for Apple, Google or Outlook Calendar" onClick={exportCalendar} chevron />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              importBackup(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </Section>

        <Section>
          {onOpenShortcuts && <Row icon={Keyboard} title="Keyboard shortcuts" detail="?" onClick={onOpenShortcuts} chevron />}
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
