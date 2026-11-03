import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2, Settings2, ChevronsUpDown, Square } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section } from '../components/ui/List'
import { IconButton } from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import TimerSettingsSheet from '../components/focus/TimerSettingsSheet'
import { useTimer } from '../lib/TimerContext'
import { PHASES, PHASE_META } from '../lib/usePomodoro'
import { PHASE_COLOR, PHASE_FG } from '../components/focus/phase'
import { lockScroll } from '../components/ui/scrollLock'
import { snappy, bouncy, easeOut } from '../components/ui/motion'
import { daysBetween, startOfDay, toISODate } from '../lib/srs'
import { estimateChapterMinutes, formatMinutes, weeklyFocusStats } from '../lib/studyCoach'

const MODE_OPTIONS = PHASES.map((id) => ({ id, label: PHASE_META[id].label }))

// The countdown as one thin ring that fills in the phase colour (the data
// hue while focusing, grey on a break), with the time and what it's for in
// the middle. One component, so the page and fullscreen can never show the
// same timer two different ways.
function Dial({ timer, chapterTitle, big = false }) {
  const color = PHASE_COLOR[timer.phase]
  const R = 46
  const C = 2 * Math.PI * R
  return (
    <motion.div
      animate={timer.justCompleted ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className={`relative ${big ? 'w-[min(76vw,56vh,26rem)]' : 'w-[min(76vw,300px)]'} aspect-square`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--fill-2)" strokeWidth="1.4" />
        {/* Nothing until the session has started, so a fresh timer shows no stray dot. */}
        {timer.progress > 0.005 && <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - timer.progress)}
          style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s' }}
        />}
      </svg>
      <div role="timer" aria-label={timer.timeLabel} className="absolute inset-0 flex flex-col items-center justify-center px-10">
        <span className="text-footnote text-label-2 mb-2">
          {timer.status === 'paused' ? 'Paused' : timer.meta.label}
        </span>
        <span
          aria-hidden="true"
          className={`font-display tabular leading-none tracking-[-0.04em] ${big ? 'text-[clamp(3rem,10vw,6rem)]' : 'text-[clamp(3.4rem,15vw,4.4rem)]'}`}
        >
          {timer.mins}:{timer.secs}
        </span>
        <span className="mt-2.5 h-[18px] text-footnote text-label-2 truncate max-w-full">{chapterTitle || ''}</span>
      </div>
    </motion.div>
  )
}

// Reset · play/pause · skip — everything needed to run a session.
function Controls({ timer, big = false }) {
  const running = timer.status === 'running'
  const side = big ? 52 : 44
  const main = big ? 80 : 68
  return (
    <div className={`flex items-center ${big ? 'gap-7' : 'gap-6'}`}>
      <IconButton size={side} label="Reset this session" onClick={timer.reset} aria-keyshortcuts="R">
        <RotateCcw size={big ? 22 : 19} strokeWidth={1.8} />
      </IconButton>
      <motion.button
        type="button"
        onClick={timer.toggle}
        whileTap={{ scale: 0.9 }}
        transition={bouncy}
        aria-label={running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start'}
        aria-keyshortcuts="Space"
        className="rounded-full flex items-center justify-center"
        style={{ width: main, height: main, background: PHASE_COLOR[timer.phase], color: PHASE_FG[timer.phase] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={running ? 'pause' : 'play'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="flex"
          >
            {running ? (
              <Pause size={big ? 30 : 26} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={big ? 30 : 26} fill="currentColor" strokeWidth={0} className="ml-1" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <IconButton size={side} label="Skip to the next mode" onClick={timer.skip} aria-keyshortcuts="S">
        <SkipForward size={big ? 22 : 19} strokeWidth={1.8} />
      </IconButton>
    </div>
  )
}

// Real fullscreen where the browser allows it, and an opaque overlay either
// way — so a blocked Fullscreen API (iPhone Safari) still gets the
// distraction-free layout.
function useFullscreen() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    function onChange() {
      if (!document.fullscreenElement) setActive(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const enter = useCallback(() => {
    setActive(true)
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])
  const exit = useCallback(() => {
    setActive(false)
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }, [])
  return useMemo(() => ({ active, enter, exit, toggle: () => (active ? exit() : enter()) }), [active, enter, exit])
}

function FullscreenTimer({ timer, chapterTitle, onExit }) {
  const exitRef = useRef(null)
  useEffect(() => {
    exitRef.current?.focus()
    return lockScroll()
  }, [])
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen focus"
      className="aurora fixed inset-0 z-[90] flex flex-col items-center justify-center px-6"
    >
      <IconButton
        ref={exitRef}
        label="Exit fullscreen"
        onClick={onExit}
        className="!absolute right-5"
        style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <Minimize2 size={17} />
      </IconButton>
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...snappy, delay: 0.05 }}
        className="relative flex flex-col items-center"
      >
        <Dial timer={timer} chapterTitle={chapterTitle} big />
        <div className="mt-12">
          <Controls timer={timer} big />
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

function sessionDay(iso) {
  const diff = daysBetween(iso, toISODate(new Date()))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return startOfDay(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
}

export default function FocusPage({ cadence, account }) {
  const { chapters, subjectMap, prefs, updatePrefs } = cadence
  const timer = useTimer()
  const [showSettings, setShowSettings] = useState(false)
  const fullscreen = useFullscreen()

  const activeChapters = useMemo(() => chapters.filter((c) => c.derivedStatus !== 'mastered'), [chapters])
  const linked = activeChapters.find((c) => c.id === timer.linkedChapterId) || null
  const estimate = linked ? estimateChapterMinutes(linked.id, cadence.focusSessions) : null
  const weeklyStats = useMemo(() => weeklyFocusStats(cadence.focusSessions, cadence.pomodoroLog), [cadence.focusSessions, cadence.pomodoroLog])
  const chapterMap = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters])
  const recent = useMemo(
    () => [...(cadence.focusSessions || [])].sort((a, b) => (b.completedAt || b.date).localeCompare(a.completedAt || a.date)).slice(0, 6),
    [cadence.focusSessions]
  )

  // Keyboard shortcuts, ignored while typing and with modifiers held so they
  // never shadow browser shortcuts like ⌘R.
  const { toggle, reset, skip, switchMode } = timer
  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target
      if (el?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el?.tagName)) return
      if (showSettings) return
      const key = e.key.toLowerCase()
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        toggle()
      } else if (key === 'r') reset()
      else if (key === 's') skip()
      else if (key === 'f') fullscreen.toggle()
      else if (e.key === 'Escape' && fullscreen.active) fullscreen.exit()
      else if (['1', '2', '3'].includes(e.key)) switchMode(PHASES[Number(e.key) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, reset, skip, switchMode, fullscreen, showSettings])

  return (
    <Page
      title="Focus"
      meta={timer.phase === 'work' ? `Session ${(timer.cycleCount % timer.cycleLength) + 1} of ${timer.cycleLength}` : 'Break'}
      subtitle={timer.phase === 'work' ? `A long break comes after ${timer.cycleLength} focus sessions.` : 'Step away from the screen for a bit.'}
      wide
      trailing={
        <>
          <IconButton label="Timer settings" onClick={() => setShowSettings(true)}>
            <Settings2 size={17} />
          </IconButton>
          {account}
        </>
      }
    >
      <p className="sr-only" role="status" aria-live="polite">
        {timer.announcement}
      </p>

      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 bg-card rounded-cell px-5 py-8 flex flex-col items-center">
          <Segmented
            ariaLabel="Timer mode"
            value={timer.phase}
            onChange={timer.switchMode}
            options={MODE_OPTIONS}
            className="w-full max-w-[360px]"
          />

          <div className="my-8">
            <Dial timer={timer} chapterTitle={timer.phase === 'work' ? linked?.title : null} />
          </div>

          <Controls timer={timer} />

          <div className="mt-6 flex items-center gap-5 text-footnote text-label-2">
            <button type="button" onClick={fullscreen.enter} aria-keyshortcuts="F" className="flex items-center gap-1.5 hover:text-label">
              <Maximize2 size={13} /> Full screen
            </button>
            {!timer.isPristine && (
              <button type="button" onClick={timer.stop} className="flex items-center gap-1.5 hover:text-label">
                <Square size={10} fill="currentColor" /> Reset cycle
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 min-w-0">
          {activeChapters.length > 0 && (
            <Section prominent title="Studying" footer="Shows on the timer, and its sessions teach the time estimate.">
              {/* A native select laid over the row: on a phone it opens the
                  system wheel picker. */}
              <label className="relative flex items-center gap-3 px-4 min-h-[52px] hover:bg-fill">
                <span className="min-w-0 flex-1">
                  <span className={`block text-body truncate ${linked ? '' : 'text-label-2'}`}>
                    {linked ? linked.title : 'Choose a chapter'}
                  </span>
                  {linked && (
                    <span className="block text-footnote text-label-2 truncate">{subjectMap.get(linked.subjectId)?.name} · {estimate.label}: {formatMinutes(estimate.minutes)}</span>
                  )}
                </span>
                <ChevronsUpDown size={15} className="text-label-3 shrink-0" />
                <select
                  value={timer.linkedChapterId}
                  onChange={(e) => timer.setLinkedChapterId(e.target.value)}
                  aria-label="Chapter you're studying"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  <option value="">No chapter</option>
                  {activeChapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {subjectMap.get(c.subjectId)?.name ? `${subjectMap.get(c.subjectId).name} — ` : ''}
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            </Section>
          )}

          <section>
            <h2 className="text-subhead font-medium px-0.5 mb-2.5 min-h-6 flex items-center">Focused</h2>
            <div className="bg-card rounded-cell grid grid-cols-2 divide-x divide-separator">
              <div className="px-5 py-4">
                <p className="text-footnote text-label-2">Today</p>
                <p className="mt-1 font-display text-[28px] leading-[32px] tabular">{formatMinutes(timer.todayStats.minutes)}</p>
                <p className="text-footnote text-label-2">{timer.todayStats.sessions} session{timer.todayStats.sessions === 1 ? '' : 's'}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-footnote text-label-2">This week</p>
                <p className="mt-1 font-display text-[28px] leading-[32px] tabular">{formatMinutes(weeklyStats.minutes)}</p>
                <p className="text-footnote text-label-2">
                  {cadence.prefs.weeklyFocusGoalMinutes ? `of ${formatMinutes(cadence.prefs.weeklyFocusGoalMinutes)} goal` : `${weeklyStats.sessions} session${weeklyStats.sessions === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
          </section>

          <Section prominent title="Recent sessions">
            {recent.length === 0 ? (
              <p className="px-4 py-4 text-subhead text-label-2">Finished sessions show up here.</p>
            ) : (
              recent.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 h-11">
                  <span className="w-[72px] shrink-0 text-footnote text-label-2 tabular">{sessionDay(s.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-subhead">{chapterMap.get(s.chapterId)?.title || 'No chapter'}</span>
                  <span className="shrink-0 text-subhead tabular">{s.minutes} min</span>
                </div>
              ))
            )}
          </Section>
        </div>
      </div>

      <AnimatePresence>
        {fullscreen.active && (
          <FullscreenTimer key="fs" timer={timer} chapterTitle={timer.phase === 'work' ? linked?.title : null} onExit={fullscreen.exit} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <TimerSettingsSheet
            key="timer-settings"
            prefs={prefs}
            updatePrefs={updatePrefs}
            isIdle={timer.status === 'idle'}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
