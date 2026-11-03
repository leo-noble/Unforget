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
import CommandPalette from './components/shell/CommandPalette'
import ShortcutsSheet from './components/shell/ShortcutsSheet'
import GuideSheet from './components/sheets/GuideSheet'
import { shortcutsBlocked } from './lib/useShortcuts'
import { recommendChapters } from './lib/studyCoach'
import { lastReviewMap } from './lib/memory'
import { Search } from 'lucide-react'
import TodayPage from './pages/TodayPage'
import LibraryPage from './pages/LibraryPage'
import PlanPage from './pages/PlanPage'
import FocusPage from './pages/FocusPage'
import { useCadence } from './lib/useCadence'
import { useAuth } from './lib/useAuth'
import { TimerProvider, useTimer } from './lib/TimerContext'
import { applyAppearance } from './lib/appearance'
import { getLastNotifiedDate, setLastNotifiedDate, getChapter } from './lib/storage'
import { toISODate } from './lib/srs'
import { APP_NAME } from './brand'

const TAB_PATH = Object.fromEntries(TABS.map((t) => [t.id, t.path]))
TAB_PATH.insights = '/dashboard/insights'
const SIDEBAR_KEY = 'unforget.sidebarCollapsed'

// The timer lives in a provider rendered below the shell; this hands the
// shell a handle on it for the command palette.
function TimerBridge({ timerRef }) {
  timerRef.current = useTimer()
  return null
}

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, displayName, avatarUrl } = useAuth()
  const cadence = useCadence(user?.id)
  const actions = useChapterActions(cadence)
  const tab = tabFromPath(location.pathname)
  const [sheet, setSheet] = useState(null) // 'add' | 'settings' | 'insights' | 'palette' | 'shortcuts'
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

  useEffect(() => {
    if (tab === 'focus' && prefs.showFocusTimer === false) navigate('/dashboard', { replace: true })
  }, [tab, prefs.showFocusTimer, navigate])

  // ---- appearance ----
  // Apply the chosen appearance live; system mode tracks the device.
  useEffect(() => {
    const appearance = { theme: prefs.theme, themeMode: prefs.themeMode }
    applyAppearance(appearance)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => {
      if (prefs.themeMode === 'system') applyAppearance(appearance)
    }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [prefs.theme, prefs.themeMode])

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

  // ---- keyboard ----
  // ⌘/Ctrl+K search, ⌘/Ctrl+N add, ⌘/Ctrl+\ sidebar; and, when nothing is
  // focused or open, ? for the shortcut list and 1-4 for the tabs.
  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey) {
        const k = e.key.toLowerCase()
        if (k === 'k') {
          e.preventDefault()
          setSheet((s) => (s === 'palette' ? null : s ? s : 'palette'))
        } else if (k === 'n' && !sheet) {
          e.preventDefault()
          setSheet('add')
        } else if (e.key === '\\') {
          e.preventDefault()
          toggleSidebar()
        }
        return
      }
      if (shortcutsBlocked(e) || sheet) return
      if (e.key === '?') {
        e.preventDefault()
        setSheet('shortcuts')
      } else if (/^[1-4]$/.test(e.key)) {
        const visible = TABS.filter((t) => prefs.showFocusTimer !== false || t.id !== 'focus')
        const target = visible[Number(e.key) - 1]
        if (target) selectTab(target.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, toggleSidebar, selectTab, prefs.showFocusTimer])

  const chapterMap = useMemo(() => new Map(cadence.chapters.map((c) => [c.id, c])), [cadence.chapters])
  const openChapter = openChapterId ? chapterMap.get(openChapterId) : null
  const lastReviewed = useMemo(() => lastReviewMap(cadence.events), [cadence.events])
  // Notes save onto the stored chapter, not the display copy with its
  // derived fields.
  const { updateChapter } = cadence
  const saveNotes = useCallback(
    (id, notes) => {
      const stored = getChapter(id)
      if (stored && stored.notes !== notes) updateChapter({ ...stored, notes })
    },
    [updateChapter]
  )
  const onOpenChapter = useCallback((c) => setOpenChapterId(c.id), [])
  const openSettings = useCallback(() => setSheet('settings'), [])
  const openAdd = useCallback(() => setSheet('add'), [])
  const closeSheet = useCallback(() => setSheet(null), [])
  const openPalette = useCallback(() => setSheet('palette'), [])
  const openSubject = useCallback(
    (id) => {
      if (tab !== 'library') scrollByTab.current[tab] = window.scrollY
      navigate(id ? `/dashboard/library?subject=${id}` : '/dashboard/library', { replace: true })
      window.scrollTo(0, 0)
    },
    [tab, navigate]
  )
  const sidebarSubjects = useMemo(() => {
    const due = new Map()
    ;[...cadence.overdue, ...cadence.dueToday].forEach((c) => due.set(c.subjectId, (due.get(c.subjectId) || 0) + 1))
    return cadence.subjects.map((s) => ({ ...s, due: due.get(s.id) || 0 }))
  }, [cadence.subjects, cadence.overdue, cadence.dueToday])
  const timerRef = useRef(null)

  const runCommand = useCallback(
    (id, chapter) => {
      if (id === 'chapter') return setOpenChapterId(chapter.id)
      if (id.startsWith('tab:')) return selectTab(id.slice(4))
      if (id === 'add') return setSheet('add')
      if (id === 'settings') return setSheet('settings')
      if (id === 'shortcuts') return setSheet('shortcuts')
      if (id === 'guide') return setSheet('guide')
      if (id === 'sidebar') return toggleSidebar()
      if (id === 'focus-next') {
        const next = recommendChapters(cadence.chapters)[0]
        const timer = timerRef.current
        if (next && timer?.status === 'idle') timer.startForChapter(next.id)
        selectTab('focus')
      }
    },
    [selectTab, toggleSidebar, cadence.chapters]
  )

  // Search and the account button on phones; on wide screens both live in
  // the sidebar.
  const account = (
    <div className="md:hidden flex items-center gap-1">
      <button type="button" onClick={openPalette} aria-label="Search" className="h-9 w-9 rounded-control flex items-center justify-center text-label-2 hover:bg-fill">
        <Search size={18} strokeWidth={1.7} />
      </button>
      <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={openSettings} aria-label="Account and settings" className="rounded-full">
        <Avatar name={displayName} src={avatarUrl} size={30} />
      </motion.button>
    </div>
  )

  const pageProps = { cadence, actions, profile, onOpenChapter, account }

  return (
    <TimerProvider prefs={prefs} updatePrefs={updatePrefs}>
      <TimerBridge timerRef={timerRef} />
      <div className="relative min-h-[100dvh]">

        <Sidebar
          active={tab}
          onSelect={selectTab}
          onAdd={openAdd}
          onSearch={openPalette}
          onOpenInsights={() => selectTab('insights')}
          subjects={sidebarSubjects}
          activeSubjectId={tab === 'library' ? new URLSearchParams(location.search).get('subject') : null}
          onSelectSubject={openSubject}
          onOpenSettings={openSettings}
          profile={profile}
          dueCount={dueCount}
          chapterMap={chapterMap}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          showFocusTimer={prefs.showFocusTimer !== false}
        />

        <main className="relative md:pl-[var(--sidebar-w)] transition-[padding] duration-300 ease-ios">
          <div key={tab}>
            {tab === 'today' && <TodayPage {...pageProps} onAdd={openAdd} onOpenGuide={() => setSheet('guide')} onOpenFocus={() => selectTab('focus')} onOpenInsights={() => selectTab('insights')} onOpenLibrary={() => selectTab('library')} />}
            {tab === 'library' && <LibraryPage {...pageProps} onAdd={openAdd} onSelectSubject={openSubject} />}
            {tab === 'plan' && <PlanPage {...pageProps} />}
            {tab === 'focus' && <FocusPage {...pageProps} />}
            {tab === 'insights' && <InsightsSheet cadence={cadence} asPage account={account} onOpenChapter={onOpenChapter} />}
          </div>
        </main>

        <TabBar
          active={tab === 'insights' ? 'today' : tab}
          onSelect={selectTab}
          onAdd={openAdd}
          onOpenFocus={() => selectTab('focus')}
          chapterMap={chapterMap}
          showFocusTimer={prefs.showFocusTimer !== false}
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
        {sheet === 'settings' && <SettingsSheet key="settings" cadence={cadence} onClose={closeSheet} onOpenShortcuts={() => setSheet('shortcuts')} onOpenGuide={() => setSheet('guide')} />}
        {sheet === 'insights' && <InsightsSheet key="insights" cadence={cadence} onClose={closeSheet} onOpenChapter={onOpenChapter} />}
        {sheet === 'shortcuts' && <ShortcutsSheet key="shortcuts" onClose={closeSheet} />}
        {sheet === 'guide' && <GuideSheet key="guide" onClose={closeSheet} />}
        {sheet === 'palette' && (
          <CommandPalette
            key="palette"
            cadence={cadence}
            showFocusTimer={prefs.showFocusTimer !== false}
            onClose={closeSheet}
            run={runCommand}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openChapter && (
          <ChapterDetailSheet
            key="chapter"
            chapter={openChapter}
            subject={cadence.subjectMap.get(openChapter.subjectId)}
            actions={actions}
            onRename={cadence.renameChapter}
            onSaveNotes={saveNotes}
            lastReviewed={lastReviewed.get(openChapter.id)}
            onClose={() => setOpenChapterId(null)}
          />
        )}
      </AnimatePresence>
    </TimerProvider>
  )
}
