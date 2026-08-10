import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Square, Settings2, X, Minus, Plus, Zap,
  SkipForward, Maximize2, Minimize2,
} from 'lucide-react'
import { usePomodoro, PHASE_META, PHASES } from '../lib/usePomodoro'
import PageShell, { PageHeader } from '../components/PageShell'
import SegmentedControl from '../components/SegmentedControl'
import Grabber from '../components/Grabber'

const MODE_OPTIONS = PHASES.map((id) => ({ id, label: PHASE_META[id].short }))

const stepBtn =
  'h-7 w-7 flex items-center justify-center rounded-full bg-paper text-ink-soft hover:text-ink disabled:opacity-30 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

function Stepper({ label, value, onChange, min = 1, max = 120, unit = 'm' }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-ui text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className={stepBtn}
        >
          <Minus size={13} />
        </button>
        {/* Announced on change so the new value is heard, not just seen. */}
        <span aria-live="polite" className="w-9 text-center font-tabular text-ui text-ink">
          {value}
          {unit}
        </span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label.toLowerCase()}`}
          className={stepBtn}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}

// The whole row is the control, not just the 42px track: the label is the
// button's own accessible name, and role/aria-checked make it announce as a
// switch that's on or off.
function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-2.5 text-left rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <span className="text-ui text-ink-soft">{label}</span>
      <span
        aria-hidden="true"
        className={`relative w-[42px] h-[25px] shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-brand' : 'bg-divider'}`}
      >
        <span
          className={`absolute top-0.5 h-[21px] w-[21px] rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-[19px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

// Everything beyond start/pause/skip lives in here, so the timer itself stays
// a countdown and three buttons.
function PomodoroSettingsSheet({ prefs, updatePrefs, isIdle, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Timer settings"
        className="w-full md:max-w-sm bg-surface rounded-t-card md:rounded-card shadow-sheet pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-y-auto"
      >
        <Grabber />
        <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
          <h2 className="font-display text-display-xs font-semibold text-ink">Timer settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="h-8 w-8 flex items-center justify-center rounded-full text-ink-soft hover:text-ink active:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {!isIdle && (
            <p className="text-meta text-ink-soft mb-3 leading-relaxed">
              New durations apply to the next session — the one running now keeps its length.
            </p>
          )}
          <div className="rounded-card bg-paper border border-divider overflow-hidden divide-y divide-divider px-5">
            <Stepper label="Focus" value={prefs.pomodoroWork ?? 25} onChange={(v) => updatePrefs({ pomodoroWork: v })} />
            <Stepper label="Short break" value={prefs.pomodoroShortBreak ?? 5} onChange={(v) => updatePrefs({ pomodoroShortBreak: v })} />
            <Stepper label="Long break" value={prefs.pomodoroLongBreak ?? 15} onChange={(v) => updatePrefs({ pomodoroLongBreak: v })} />
            <Stepper
              label="Sessions per long break"
              value={prefs.pomodoroCycleLength ?? 4}
              onChange={(v) => updatePrefs({ pomodoroCycleLength: v })}
              min={2}
              max={8}
              unit=""
            />
          </div>

          <div className="rounded-card bg-paper border border-divider overflow-hidden divide-y divide-divider px-5 mt-4">
            <Toggle
              label="Auto-start next session"
              checked={!!prefs.pomodoroAutoTransition}
              onChange={(v) => updatePrefs({ pomodoroAutoTransition: v })}
            />
            <Toggle
              label="Notification sound"
              checked={prefs.pomodoroSound !== false}
              onChange={(v) => updatePrefs({ pomodoroSound: v })}
            />
          </div>

          <p className="text-eyebrow font-semibold uppercase text-ink-soft mt-5 mb-2 px-1">Keyboard</p>
          <dl className="px-1 space-y-1.5">
            {[
              ['Space', 'Start, pause or resume'],
              ['R', 'Reset this session'],
              ['S', 'Skip to the next mode'],
              ['F', 'Fullscreen focus mode'],
              ['1 / 2 / 3', 'Focus / short / long'],
            ].map(([key, what]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <dt className="text-meta font-tabular text-ink">{key}</dt>
                <dd className="text-meta text-ink-soft">{what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </motion.div>
  )
}
// The countdown itself — one component so the page and the fullscreen overlay
// can never drift into showing the same timer two different ways.
function TimerDial({ phase, meta, mins, secs, progress, justCompleted, timeLabel, big = false }) {
  const R = 45
  const C = 2 * Math.PI * R
  const stroke = big ? 2.5 : 4
  return (
    <motion.div
      animate={justCompleted ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex items-center justify-center ${big ? 'w-[min(80vw,64vh,28rem)] aspect-square' : 'w-64 h-64'}`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth={stroke} className="stroke-divider" />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - progress) }}
          strokeLinecap="round"
          className={meta.ring}
          transition={{ duration: 0.4, ease: 'linear' }}
        />
      </svg>
      {/* role="timer" with a coarse minutes-only label: a per-second live
          region would make the page unusable with a screen reader on. */}
      <div role="timer" aria-label={timeLabel} className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span
              aria-hidden="true"
              className={`font-display font-semibold text-ink font-tabular tracking-tightest ${
                big ? 'text-[clamp(3.75rem,13vw,7rem)] leading-none' : 'text-display-xl'
              }`}
            >
              {mins}:{secs}
            </span>
            <span
              className={`mt-3 text-eyebrow font-semibold uppercase px-2.5 py-1 rounded-full ${meta.chip}`}
            >
              {meta.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const ghostBtn =
  'flex items-center justify-center rounded-full bg-surface border border-divider shadow-elevated text-ink-soft hover:text-ink active:opacity-70 disabled:opacity-30 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

// Reset · play/pause · skip. Everything needed to run a session, nothing else.
function Controls({ status, onToggle, onReset, onSkip, big = false }) {
  const side = big ? 'h-14 w-14' : 'h-11 w-11'
  const main = big ? 'h-20 w-20' : 'h-16 w-16'
  const isRunning = status === 'running'
  return (
    <div className={`flex items-center ${big ? 'gap-5' : 'gap-3'}`}>
      <button onClick={onReset} aria-label="Reset this session" aria-keyshortcuts="R" className={`${side} ${ghostBtn}`}>
        <RotateCcw size={big ? 20 : 16} />
      </button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.button
          key={isRunning ? 'pause' : 'play'}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.18 }}
          onClick={onToggle}
          aria-label={isRunning ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
          aria-keyshortcuts="Space"
          className={`${main} flex items-center justify-center rounded-full bg-brand text-white shadow-fab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper`}
        >
          {isRunning ? <Pause size={big ? 30 : 24} /> : <Play size={big ? 30 : 24} className="ml-0.5" />}
        </motion.button>
      </AnimatePresence>

      <button onClick={onSkip} aria-label="Skip to the next mode" aria-keyshortcuts="S" className={`${side} ${ghostBtn}`}>
        <SkipForward size={big ? 20 : 16} />
      </button>
    </div>
  )
}

// Real fullscreen where the browser allows it, and an opaque themed overlay
// either way — so a blocked or unsupported Fullscreen API degrades to the
// distraction-free layout rather than to nothing at all.
function useFullscreen() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Leaving browser fullscreen by any route the app didn't drive (Esc, F11,
    // a trackpad gesture) has to drop the overlay too, or the user is left in
    // a stripped-down view with no obvious way back.
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

  // Memoised so the page's keydown listener isn't torn down and re-bound on
  // every tick of the countdown.
  return useMemo(() => ({ active, enter, exit, toggle: () => (active ? exit() : enter()) }), [active, enter, exit])
}
// Distraction-free mode: the countdown, what session it is, and the three
// controls that run it. No stats, no chapter picker, no navigation.
function FullscreenTimer({ timer, onExit }) {
  const exitRef = useRef(null)

  // Move focus in on open so the keyboard shortcuts land here and a screen
  // reader announces the mode rather than leaving the user on a button that
  // is now behind an overlay.
  useEffect(() => {
    exitRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen focus mode"
      className="fixed inset-0 z-[60] bg-paper flex flex-col items-center justify-center px-6"
    >
      <button
        ref={exitRef}
        onClick={onExit}
        aria-label="Exit fullscreen"
        aria-keyshortcuts="Escape F"
        className={`absolute top-5 right-5 h-11 w-11 ${ghostBtn}`}
      >
        <Minimize2 size={17} />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="flex flex-col items-center"
      >
        <TimerDial
          big
          phase={timer.phase}
          meta={timer.meta}
          mins={timer.mins}
          secs={timer.secs}
          progress={timer.progress}
          justCompleted={timer.justCompleted}
          timeLabel={timer.timeLabel}
        />

        <div className="mt-12">
          <Controls
            big
            status={timer.status}
            onToggle={timer.toggle}
            onReset={timer.reset}
            onSkip={timer.skip}
          />
        </div>
      </motion.div>

      <p className="absolute bottom-7 text-meta text-ink-soft/70 text-center px-4">
        Space to start or pause · Esc to leave fullscreen
      </p>
    </motion.div>
  )
}

export default function FocusPage({ cadence }) {
  const { chapters, subjectMap, prefs, updatePrefs } = cadence
  const timer = usePomodoro({ prefs, updatePrefs })
  const [showSettings, setShowSettings] = useState(false)
  const fullscreen = useFullscreen()

  const activeChapters = useMemo(() => chapters.filter((c) => c.derivedStatus !== 'mastered'), [chapters])
  const linkedChapter = activeChapters.find((c) => c.id === timer.linkedChapterId) || null

  // Keyboard shortcuts. Ignored while a field has focus so typing a chapter
  // name can't pause the timer, and never fired with a modifier held, which
  // would shadow browser shortcuts like ⌘R.
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
      } else if (key === 'r') {
        reset()
      } else if (key === 's') {
        skip()
      } else if (key === 'f') {
        fullscreen.toggle()
      } else if (e.key === 'Escape' && fullscreen.active) {
        fullscreen.exit()
      } else if (['1', '2', '3'].includes(e.key)) {
        switchMode(PHASES[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, reset, skip, switchMode, fullscreen, showSettings])

  const dotsInCycle =
    timer.cycleCount % timer.cycleLength === 0 && timer.cycleCount > 0
      ? timer.cycleLength
      : timer.cycleCount % timer.cycleLength

  return (
    <PageShell width="narrow" className="flex flex-col items-center">
      {/* Every state change the timer wants spoken goes through one polite
          live region — phase changes and transitions only, never the tick. */}
      <p className="sr-only" role="status" aria-live="polite">
        {timer.announcement}
      </p>

      <PageHeader
        eyebrow={timer.meta.label}
        title="Focus"
        subtitle={timer.phase === 'work' && linkedChapter ? linkedChapter.title : undefined}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fullscreen.enter}
              aria-label="Enter fullscreen focus mode"
              aria-keyshortcuts="F"
              className={`h-9 w-9 ${ghostBtn}`}
            >
              <Maximize2 size={15} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Timer settings"
              className={`h-9 w-9 ${ghostBtn}`}
            >
              <Settings2 size={16} />
            </button>
          </div>
        }
      />

      {/* Mode switcher — available at any time, not only between sessions. */}
      <SegmentedControl
        layoutId="pomodoro-mode-segment"
        value={timer.phase}
        onChange={timer.switchMode}
        options={MODE_OPTIONS}
        className="mb-6"
      />

      {/* Cycle progress: how far through the run of focus sessions that ends
          in a long break. */}
      <div
        className="flex items-center gap-2 mb-7"
        role="img"
        aria-label={`${dotsInCycle} of ${timer.cycleLength} focus sessions done before the long break`}
      >
        {Array.from({ length: timer.cycleLength }).map((_, i) => (
          <motion.span
            key={i}
            animate={{ width: i < dotsInCycle ? 24 : 6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`h-1.5 rounded-full ${i < dotsInCycle ? 'bg-brand' : 'bg-divider'}`}
          />
        ))}
      </div>

      <div className="mb-8">
        <TimerDial
          phase={timer.phase}
          meta={timer.meta}
          mins={timer.mins}
          secs={timer.secs}
          progress={timer.progress}
          justCompleted={timer.justCompleted}
          timeLabel={timer.timeLabel}
        />
      </div>

      <div className="flex items-center gap-3 mb-7">
        <Controls status={timer.status} onToggle={timer.toggle} onReset={timer.reset} onSkip={timer.skip} />
        <button
          onClick={timer.stop}
          aria-label="Stop and return to the start of the cycle"
          disabled={timer.isPristine}
          className={`h-11 w-11 hover:!text-status-overdue ${ghostBtn}`}
        >
          <Square size={15} />
        </button>
      </div>

      <div className="w-full rounded-card bg-surface border border-divider shadow-elevated p-4 mb-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-ui text-ink-soft">
          <Zap size={14} className="text-brand" /> Today
        </span>
        <span className="text-ui text-ink font-tabular text-right">
          {timer.todayStats.sessions} session{timer.todayStats.sessions === 1 ? '' : 's'} · {timer.todayStats.minutes}m focused
        </span>
      </div>

      {activeChapters.length > 0 && (
        <div className="w-full">
          <label
            htmlFor="focus-chapter"
            className="block text-eyebrow font-semibold uppercase text-ink-soft mb-2 px-1"
          >
            Studying (optional)
          </label>
          <div className="rounded-card bg-surface border border-divider shadow-elevated overflow-hidden">
            <select
              id="focus-chapter"
              value={timer.linkedChapterId}
              onChange={(e) => timer.setLinkedChapterId(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-body text-ink focus:outline-none"
            >
              <option value="">No chapter selected</option>
              {activeChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {subjectMap.get(c.subjectId)?.name} — {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <AnimatePresence>
        {fullscreen.active && (
          <FullscreenTimer key="pomodoro-fullscreen" timer={timer} onExit={fullscreen.exit} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <PomodoroSettingsSheet
            key="pomodoro-settings"
            prefs={prefs}
            updatePrefs={updatePrefs}
            isIdle={timer.status === 'idle'}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  )
}
