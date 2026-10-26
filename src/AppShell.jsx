import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import TabBar from './components/shell/TabBar'
import Sidebar from './components/shell/Sidebar'
import Avatar from './components/shell/Avatar'
import { TABS, tabFromPath } from './components/shell/tabs'
import AddChapterSheet from './components/chapter/AddChapterSheet'
import ChapterDetailSheet from './components/chapter/ChapterDetailSheet'
import { useChapterActions } from './components/chapter/useChapterActions'
import SettingsSheet from './components/sheets/SettingsSheet'
import InsightsSheet from './components/sheets/InsightsSheet'
import TodayPage from './pages/TodayPage'
import LibraryPage from './pages/LibraryPage'
import PlanPage from './pages/PlanPage'
import FocusPage from './pages/FocusPage'
import { useCadence } from './lib/useCadence'
import { useAuth } from './lib/useAuth'
import { TimerProvider } from './lib/TimerContext'
import { applyAppearance } from './lib/appearance'
import { getLastNotifiedDate, setLastNotifiedDate } from './lib/storage'
import { toISODate } from './lib/srs'
import { APP_NAME } from './brand'

const TAB_PATH = Object.fromEntries(TABS.map((t) => [t.id, t.path]))
const SIDEBAR_KEY = 'mnora.sidebarCollapsed'

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, displayName, avatarUrl } = useAuth()
  const cadence = useCadence(user?.id)
  const actions = useChapterActions(cadence)
  const tab = tabFromPath(location.pathname)
  const [sheet, setSheet] = useState(null) // 'add' | 'settings' | 'insights'
  const [openChapterId, setOpenChapterId] = useState(null)
  // Laptop sidebar: full panel or icon rail, remembered on this device.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), [])
  useEffect(() => {
    document.documentElement.dataset.sidebar = sidebarCollapsed ? 'collapsed' : 'open'
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0')
    } catch {
      // best-effort
    }
  }, [sidebarCollapsed])
  const profile = useMemo(() => ({ name: displayName, email: user?.email, avatarUrl }), [displayName, user?.email, avatarUrl])
  const { prefs, updatePrefs } = cadence

  // ---- appearance ----
  // Follows the device's light/dark setting live, without a reload.
  useEffect(() => {
    applyAppearance(prefs)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyAppearance(prefs)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
    // Only the accent matters here; prefs itself changes identity on any edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.theme])

  // ---- tabs ----
  // Each tab keeps its own scroll position, like a UITabBarController; tapping
  // the tab you're already on scrolls it back to the top.
  const scrollByTab = useRef({})
  const selectTab = useCallback(
    (id) => {
      if (id === tab) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      scrollByTab.current[tab] = window.scrollY
      navigate(TAB_PATH[id], { replace: true })
    },
    [tab, navigate]
  )
  useLayoutEffect(() => {
    window.scrollTo(0, scrollByTab.current[tab] || 0)
  }, [tab])

  // ---- reminders ----
  // Keep the stored preference honest: permission revoked in the browser's own
  // site settings would otherwise leave the switch showing "on" forever.
  useEffect(() => {
    if (!('Notification' in window)) return
    function sync() {
      if (prefs.notificationsEnabled && Notification.permission !== 'granted') {
        updatePrefs({ notificationsEnabled: false })
      }
    }
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [prefs.notificationsEnabled, updatePrefs])

  // Best-effort in-tab reminder: once a minute, after the configured time, if
  // anything is due and nothing has been sent today.
  const dueCount = cadence.overdue.length + cadence.dueToday.length
  useEffect(() => {
    if (!prefs.notificationsEnabled) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    function check() {
      const now = new Date()
      const today = toISODate(now)
      if (getLastNotifiedDate() === today) return
      const [h, m] = (prefs.notificationTime || '09:00').split(':').map(Number)
      const at = new Date(now)
      at.setHours(h || 0, m || 0, 0, 0)
      if (now < at || dueCount === 0) return
      setLastNotifiedDate(today)
      new Notification(APP_NAME, { body: `${dueCount} chapter${dueCount === 1 ? '' : 's'} to review today.` })
    }
    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [prefs.notificationsEnabled, prefs.notificationTime, dueCount])

  // The engine flags a fresh mastery for a celebration; the toast from the
  // action already covers it, so just let the flag lapse.
  const { justMastered, clearJustMastered } = cadence
  useEffect(() => {
    if (!justMastered) return
    const t = setTimeout(clearJustMastered, 2400)
    return () => clearTimeout(t)
  }, [justMastered, clearJustMastered])

  // ---- keyboard: ⌘/Ctrl+N adds a chapter, ⌘/Ctrl+\ toggles the sidebar ----
  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() === 'n' && !sheet) {
        e.preventDefault()
        setSheet('add')
      } else if (e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, toggleSidebar])

  const chapterMap = useMemo(() => new Map(cadence.chapters.map((c) => [c.id, c])), [cadence.chapters])
  const openChapter = openChapterId ? chapterMap.get(openChapterId) : null
  const onOpenChapter = useCallback((c) => setOpenChapterId(c.id), [])
  const openSettings = useCallback(() => setSheet('settings'), [])
  const openAdd = useCallback(() => setSheet('add'), [])
  const closeSheet = useCallback(() => setSheet(null), [])

  // The account button on phones; on wide screens it lives in the sidebar.
  const account = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={openSettings}
      aria-label="Account and settings"
      className="md:hidden rounded-full p-[2px] glass"
    >
      <Avatar name={displayName} src={avatarUrl} size={34} />
    </motion.button>
  )

  const pageProps = { cadence, actions, profile, onOpenChapter, account }

  return (
    <TimerProvider prefs={prefs} updatePrefs={updatePrefs}>
      <div className="relative min-h-screen">

        <Sidebar
          active={tab}
          onSelect={selectTab}
          onAdd={openAdd}
          onOpenInsights={() => setSheet('insights')}
          onOpenSettings={openSettings}
          profile={profile}
          dueCount={dueCount}
          chapterMap={chapterMap}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />

        <main className="relative md:pl-[var(--sidebar-w)] transition-[padding] duration-300 ease-ios">
          {/* Opacity only: a transform here would become the containing block
              for each page's fixed nav bar and drag it along mid-animation. */}
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {tab === 'today' && <TodayPage {...pageProps} onAdd={openAdd} onOpenInsights={() => setSheet('insights')} />}
            {tab === 'library' && <LibraryPage {...pageProps} onAdd={openAdd} />}
            {tab === 'plan' && <PlanPage {...pageProps} />}
            {tab === 'focus' && <FocusPage {...pageProps} />}
          </motion.div>
        </main>

        <TabBar
          active={tab}
          onSelect={selectTab}
          onAdd={openAdd}
          onOpenFocus={() => selectTab('focus')}
          chapterMap={chapterMap}
        />
      </div>

      <AnimatePresence>
        {sheet === 'add' && (
          <AddChapterSheet
            key="add"
            subjects={cadence.subjects}
            onClose={closeSheet}
            onCreateSubject={cadence.createSubject}
            onCreateChapter={cadence.createChapter}
          />
        )}
        {sheet === 'settings' && <SettingsSheet key="settings" cadence={cadence} onClose={closeSheet} />}
        {sheet === 'insights' && <InsightsSheet key="insights" cadence={cadence} onClose={closeSheet} />}
      </AnimatePresence>

      <AnimatePresence>
        {openChapter && (
          <ChapterDetailSheet
            key="chapter"
            chapter={openChapter}
            subject={cadence.subjectMap.get(openChapter.subjectId)}
            actions={actions}
            onRename={cadence.renameChapter}
            onClose={() => setOpenChapterId(null)}
          />
        )}
      </AnimatePresence>
    </TimerProvider>
  )
}
