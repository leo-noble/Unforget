import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
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
import { PHASE_COLOR, PHASE_COLOR_2 } from '../components/focus/phase'
import { lockScroll } from '../components/ui/scrollLock'
import { snappy, bouncy, easeOut } from '../components/ui/motion'

const MODE_OPTIONS = PHASES.map((id) => ({ id, label: PHASE_META[id].label }))

// The countdown — one component so the page and fullscreen can never show the
// same timer two different ways.
function Dial({ timer, big = false }) {
  const gid = `dial${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const size = 100
  const stroke = big ? 3.2 : 5.5
  const R = (size - stroke) / 2 - 1
  const C = 2 * Math.PI * R
  const running = timer.status === 'running'
  return (
    <motion.div
      animate={timer.justCompleted ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className={`relative ${big ? 'w-[min(78vw,62vh,30rem)]' : 'w-[min(72vw,288px)]'} aspect-square`}
    >
      {/* Soft glow behind the ring that breathes while the clock runs. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[12%] rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${PHASE_COLOR[timer.phase]} 30%, transparent), transparent 70%)`,
        }}
        animate={running ? { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 0.55 }}
        transition={running ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      />
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={PHASE_COLOR[timer.phase]} />
            <stop offset="1" stopColor={PHASE_COLOR_2[timer.phase]} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--fill)" strokeWidth={stroke} />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - timer.progress) }}
          transition={{ duration: 0.35, ease: 'linear' }}
        />
      </svg>
      <div role="timer" aria-label={timer.timeLabel} className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={timer.phase}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="flex flex-col items-center"
          >
            <span
              aria-hidden="true"
              className={`font-rounded font-semibold tabular tracking-[-0.03em] leading-none ${
                big ? 'text-[clamp(4rem,14vw,8rem)]' : 'text-[clamp(3.25rem,15vw,4.25rem)]'
              }`}
            >
              {timer.mins}:{timer.secs}
            </span>
            <span
              className="mt-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-footnote font-semibold"
              style={{
                color: PHASE_COLOR[timer.phase],
                background: `color-mix(in srgb, ${PHASE_COLOR[timer.phase]} 15%, transparent)`,
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${running ? 'pulse-dot' : ''}`} style={{ background: 'currentColor' }} />
              {timer.status === 'paused' ? 'Paused' : timer.meta.label}
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
        className="rounded-full flex items-center justify-center text-white"
        style={{
          width: main,
          height: main,
          background: PHASE_COLOR[timer.phase],
          boxShadow: `0 14px 30px -10px color-mix(in srgb, ${PHASE_COLOR[timer.phase]} 70%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
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
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(70% 55% at 50% 45%, color-mix(in srgb, ${PHASE_COLOR[timer.phase]} 16%, transparent), transparent 75%)`,
        }}
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
              animate={{ width: i < inCycle ? 22 : 7 }}
              transition={snappy}
              className={`h-[7px] rounded-full ${i < inCycle ? 'bg-tint' : 'bg-fill-2'}`}
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
              className="mt-4 flex items-center gap-1.5 text-footnote font-semibold text-label-2 active:text-red overflow-hidden"
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
              <span className="h-[30px] w-[30px] rounded-[8px] bg-tint text-white flex items-center justify-center shrink-0">
                <BookOpen size={16} strokeWidth={2.3} />
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
            iconColor="var(--orange)"
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
