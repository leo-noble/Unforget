import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2, Settings2, BookOpen, ChevronsUpDown, Zap, Square } from 'lucide-react'
import Page from '../components/ui/Page'
import { Section, Row } from '../components/ui/List'
import { IconButton } from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import TimerSettingsSheet from '../components/focus/TimerSettingsSheet'
import { useTimer } from '../lib/TimerContext'
import { PHASES, PHASE_META } from '../lib/usePomodoro'
import { PHASE_COLOR, PHASE_FG } from '../components/focus/phase'
import { lockScroll } from '../components/ui/scrollLock'
import { snappy, bouncy, easeOut } from '../components/ui/motion'

const MODE_OPTIONS = PHASES.map((id) => ({ id, label: PHASE_META[id].label }))

// The countdown as a ring of sixty dots — one per second-hand tick — that
// light up as the session runs. One component, so the page and fullscreen can
// never show the same timer two different ways.
const TICKS = 60

function Dial({ timer, big = false }) {
  const running = timer.status === 'running'
  const color = PHASE_COLOR[timer.phase]
  const lit = Math.round(timer.progress * TICKS)
  return (
    <motion.div
      animate={timer.justCompleted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className={`relative ${big ? 'w-[min(80vw,62vh,30rem)]' : 'w-[min(76vw,300px)]'} aspect-square`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
        {Array.from({ length: TICKS }).map((_, i) => {
          const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2
          const on = i < lit
          const head = running && i === lit
          return (
            <circle
              key={i}
              cx={50 + Math.cos(a) * 46}
              cy={50 + Math.sin(a) * 46}
              r={i % 5 === 0 ? 1.55 : 1.15}
              fill={on || head ? color : 'var(--fill-2)'}
              className={head ? 'pulse-dot' : undefined}
              style={{ transition: 'fill 0.3s' }}
            />
          )
        })}
      </svg>
      <div role="timer" aria-label={timer.timeLabel} className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={timer.phase}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: easeOut }}
            className="flex flex-col items-center"
          >
            <span className="eyebrow text-label-2 mb-3 flex items-center gap-1.5">
              <span className={`h-[6px] w-[6px] rounded-full ${running ? 'pulse-dot' : ''}`} style={{ background: color }} />
              {timer.status === 'paused' ? 'Paused' : timer.meta.label}
            </span>
            <span
              aria-hidden="true"
              className={`font-dot tabular leading-none ${big ? 'text-[clamp(4.5rem,16vw,9rem)]' : 'text-[clamp(3.6rem,17vw,4.8rem)]'}`}
            >
              {timer.mins}:{timer.secs}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Reset · play/pause · skip — everything needed to run a session.
function Controls({ timer, big = false }) {
  const running = timer.status === 'running'
  const side = big ? 64 : 58
  const main = big ? 96 : 84
  return (
    <div className={`flex items-center ${big ? 'gap-7' : 'gap-6'}`}>
      <IconButton size={side} label="Reset this session" onClick={timer.reset} aria-keyshortcuts="R">
        <RotateCcw size={big ? 24 : 22} strokeWidth={2.2} />
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
              <Pause size={big ? 38 : 34} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={big ? 38 : 34} fill="currentColor" strokeWidth={0} className="ml-1" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <IconButton size={side} label="Skip to the next mode" onClick={timer.skip} aria-keyshortcuts="S">
        <SkipForward size={big ? 24 : 22} strokeWidth={2.2} />
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
      className="fixed inset-0 z-[90] bg-canvas flex flex-col items-center justify-center px-6"
    >
      <div
        aria-hidden="true"
        className="dot-grid dot-grid-fade absolute inset-0 pointer-events-none opacity-60"
      />
      <IconButton
        ref={exitRef}
        label="Exit fullscreen"
        onClick={onExit}
        className="!absolute right-5"
        style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <Minimize2 size={19} />
      </IconButton>
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...snappy, delay: 0.05 }}
        className="relative flex flex-col items-center"
      >
        {chapterTitle && <p className="text-headline text-label-2 mb-6 text-center max-w-[80vw] truncate">{chapterTitle}</p>}
        <Dial timer={timer} big />
        <div className="mt-12">
          <Controls timer={timer} big />
        </div>
      </motion.div>
      <p className="absolute text-footnote text-label-3 text-center px-4 hidden md:block" style={{ bottom: 28 }}>
        Space to start or pause · Esc to leave
      </p>
    </motion.div>,
    document.body
  )
}

export default function FocusPage({ cadence, account }) {
  const { chapters, subjectMap, prefs, updatePrefs } = cadence
  const timer = useTimer()
  const [showSettings, setShowSettings] = useState(false)
  const fullscreen = useFullscreen()

  const activeChapters = useMemo(() => chapters.filter((c) => c.derivedStatus !== 'mastered'), [chapters])
  const linked = activeChapters.find((c) => c.id === timer.linkedChapterId) || null

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

  const inCycle =
    timer.cycleCount % timer.cycleLength === 0 && timer.cycleCount > 0 ? timer.cycleLength : timer.cycleCount % timer.cycleLength

  return (
    <Page
      title="Focus"
      eyebrow={
        timer.phase === 'work' ? `Session ${(timer.cycleCount % timer.cycleLength) + 1} of ${timer.cycleLength}` : 'Break time'
      }
      trailing={
        <>
          <IconButton size={40} label="Fullscreen" onClick={fullscreen.enter} aria-keyshortcuts="F">
            <Maximize2 size={17} />
          </IconButton>
          <IconButton size={40} label="Timer settings" onClick={() => setShowSettings(true)}>
            <Settings2 size={18} />
          </IconButton>
          {account}
        </>
      }
    >
      <p className="sr-only" role="status" aria-live="polite">
        {timer.announcement}
      </p>

      <div className="flex flex-col items-center">
        <Segmented
          layoutId="focus-mode"
          ariaLabel="Timer mode"
          value={timer.phase}
          onChange={timer.switchMode}
          options={MODE_OPTIONS}
          className="w-full max-w-[400px]"
        />

        <div
          className="flex items-center gap-2 mt-5"
          role="img"
          aria-label={`${inCycle} of ${timer.cycleLength} focus sessions done before the long break`}
        >
          {Array.from({ length: timer.cycleLength }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i < inCycle ? 1 : 0.7 }}
              transition={snappy}
              className="h-[9px] w-[9px] rounded-full"
              style={{
                background: i < inCycle ? 'var(--label)' : 'transparent',
                boxShadow: i < inCycle ? 'none' : 'inset 0 0 0 1.5px var(--label-3)',
              }}
            />
          ))}
        </div>

        <div className="my-7">
          <Dial timer={timer} />
        </div>

        <Controls timer={timer} />

        <AnimatePresence>
          {!timer.isPristine && (
            <motion.button
              type="button"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={timer.stop}
              className="mt-4 flex items-center gap-1.5 text-footnote font-medium text-label-2 active:text-red overflow-hidden"
            >
              <Square size={12} fill="currentColor" /> End and reset the cycle
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 space-y-6 max-w-[560px] mx-auto">
        {activeChapters.length > 0 && (
          <Section title="Studying" footer="Optional — shows on the timer so you remember what this session is for.">
            {/* A native select laid over the row: on a phone it opens the
                system wheel picker, which is exactly the iOS behaviour. */}
            <label className="relative flex items-center gap-3 px-4 min-h-[56px] active:bg-fill">
              <span className="h-[30px] w-[30px] rounded-full bg-fill text-label flex items-center justify-center shrink-0">
                <BookOpen size={15} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-body truncate ${linked ? '' : 'text-label-2'}`}>
                  {linked ? linked.title : 'Choose a chapter'}
                </span>
                {linked && (
                  <span className="block text-footnote text-label-2 truncate">{subjectMap.get(linked.subjectId)?.name}</span>
                )}
              </span>
              <ChevronsUpDown size={17} className="text-label-3 shrink-0" />
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

        <Section title="Today">
          <Row
            icon={Zap}
            title={`${timer.todayStats.sessions} session${timer.todayStats.sessions === 1 ? '' : 's'}`}
            detail={`${timer.todayStats.minutes} min`}
          />
        </Section>
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
