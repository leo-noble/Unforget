import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toISODate } from './srs'
import { logPomodoroSession, getPomodoroLog, getTimerState, saveTimerState, clearTimerState } from './storage'
import { APP_NAME } from '../brand'

// The Pomodoro timer's whole brain. Extracted from FocusPage so the same
// running timer can be rendered by two different shells — the normal page and
// the fullscreen overlay — without either one owning the state or the two
// falling out of step.

export const PHASES = ['work', 'short_break', 'long_break']

export const PHASE_META = {
  work: {
    label: 'Focus',
    short: 'Focus',
    ring: 'stroke-tint',
    text: 'text-tint',
    chip: 'text-tint bg-tint/10',
    // What to say when this phase ends.
    done: 'Focus session complete — time for a break.',
  },
  short_break: {
    label: 'Short break',
    short: 'Short',
    ring: 'stroke-green',
    text: 'text-green',
    chip: 'text-green bg-green/10',
    done: 'Break over — back to it.',
  },
  long_break: {
    label: 'Long break',
    short: 'Long',
    ring: 'stroke-teal',
    text: 'text-teal',
    chip: 'text-teal bg-teal/10',
    done: 'Long break over — back to it.',
  },
}

// A short two-tone chime via the Web Audio API — no asset to ship or fail to
// load. Work ends on a falling interval (settle down), breaks end on a rising
// one (pick it up), so the two are distinguishable without looking. Runs
// best-effort: a browser that blocks audio before a user gesture just does
// nothing rather than throwing.
export function playChime(phase = 'work') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    const notes = phase === 'work' ? [880, 587.33] : [587.33, 880]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.16
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.55)
    })
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // best-effort only
  }
}

// If the timer finishes while the user is in another tab, the chime may be
// all they get — and a muted tab swallows that too. A notification is the
// only thing that reliably reaches them, so it's sent only when the page is
// actually hidden (otherwise the on-screen change is the notification).
function notifyPhaseEnd(phase) {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return
    new Notification(APP_NAME, { body: PHASE_META[phase]?.done || 'Timer finished.', tag: 'cadence-pomodoro' })
  } catch {
    // best-effort only
  }
}

export function usePomodoro({ prefs, updatePrefs }) {
  const workMin = prefs.pomodoroWork ?? 25
  const shortBreakMin = prefs.pomodoroShortBreak ?? 5
  const longBreakMin = prefs.pomodoroLongBreak ?? 15
  const cycleLength = prefs.pomodoroCycleLength ?? 4
  const autoTransition = !!prefs.pomodoroAutoTransition
  const soundEnabled = prefs.pomodoroSound !== false

  const durationMsFor = useCallback(
    (p) => (p === 'work' ? workMin : p === 'short_break' ? shortBreakMin : longBreakMin) * 60000,
    [workMin, shortBreakMin, longBreakMin]
  )

  // Which phase naturally follows this one. Work rotates into a long break
  // every `cycleLength` sessions; anything else rotates back to work.
  const phaseAfter = useCallback(
    (p, completedCount) =>
      p === 'work' ? (completedCount % cycleLength === 0 ? 'long_break' : 'short_break') : 'work',
    [cycleLength]
  )

  // ---- restore persisted state (survives refresh / backgrounded tabs) ----
  // Running phases are anchored to a wall-clock `endAt` instant rather than a
  // tick counter, so remaining time is always recomputed from Date.now() — a
  // throttled background tab or a reload can never make it drift.
  const initial = useMemo(() => {
    const saved = getTimerState()
    if (!saved) {
      return { phase: 'work', status: 'idle', remainingMs: durationMsFor('work'), cycleCount: 0, linkedChapterId: '' }
    }
    if (saved.status === 'running' && saved.endAt) {
      const remaining = saved.endAt - Date.now()
      if (remaining <= 0) {
        // The phase finished while the tab was closed. Land on a fresh, idle
        // instance of the *next* phase rather than replaying time that has
        // already passed.
        const wasWork = saved.phase === 'work'
        const nextCount = wasWork ? (saved.cycleCount || 0) + 1 : saved.cycleCount || 0
        const next = wasWork
          ? nextCount % cycleLength === 0
            ? 'long_break'
            : 'short_break'
          : 'work'
        return {
          phase: next,
          status: 'idle',
          remainingMs: durationMsFor(next),
          cycleCount: nextCount,
          linkedChapterId: saved.linkedChapterId || '',
          sessionChapterId: saved.sessionChapterId || null,
          _pendingLog: wasWork ? { minutes: workMin, chapterId: saved.sessionChapterId || null } : null,
        }
      }
      return {
        phase: saved.phase,
        status: 'running',
        remainingMs: remaining,
        cycleCount: saved.cycleCount || 0,
        linkedChapterId: saved.linkedChapterId || '',
        sessionChapterId: saved.sessionChapterId || null,
      }
    }
    return {
      phase: saved.phase || 'work',
      status: saved.status === 'paused' ? 'paused' : 'idle',
      remainingMs:
        typeof saved.remainingMs === 'number' ? saved.remainingMs : durationMsFor(saved.phase || 'work'),
      cycleCount: saved.cycleCount || 0,
      linkedChapterId: saved.linkedChapterId || '',
      sessionChapterId: saved.sessionChapterId || null,
    }
    // Restoring is a mount-time concern: re-deriving it when durations change
    // would throw away a running timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [phase, setPhase] = useState(initial.phase)
  const [status, setStatus] = useState(initial.status) // idle | running | paused
  const [remainingMs, setRemainingMs] = useState(initial.remainingMs)
  const [cycleCount, setCycleCount] = useState(initial.cycleCount)
  const [linkedChapterId, setLinkedChapterId] = useState(initial.linkedChapterId)
  const [justCompleted, setJustCompleted] = useState(false)
  const [todayStats, setTodayStats] = useState(
    () => getPomodoroLog()[toISODate(new Date())] || { sessions: 0, minutes: 0 }
  )
  // Screen-reader announcements: phase changes and transitions only, never
  // the per-second tick, which would make the timer unusable with a reader on.
  const [announcement, setAnnouncement] = useState('')

  const endAtRef = useRef(status === 'running' ? Date.now() + initial.remainingMs : null)
  const sessionChapterIdRef = useRef(initial.sessionChapterId || initial._pendingLog?.chapterId || null)
  const rafRef = useRef(null)

  // A work session that completed while this page wasn't open still needs to
  // be logged, exactly once, after mount.
  useEffect(() => {
    if (initial._pendingLog) {
      setTodayStats(logPomodoroSession(toISODate(new Date()), initial._pendingLog.minutes, initial._pendingLog.chapterId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Durations changed in settings apply immediately when nothing is running.
  useEffect(() => {
    if (status === 'idle') setRemainingMs(durationMsFor(phase))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workMin, shortBreakMin, longBreakMin])

  // Persist on every meaningful change so a refresh rebuilds exactly here.
  useEffect(() => {
    saveTimerState({
      phase,
      status,
      endAt: status === 'running' ? endAtRef.current : null,
      remainingMs: status === 'running' ? null : remainingMs,
      cycleCount,
      linkedChapterId,
      sessionChapterId: status === 'idle' ? null : sessionChapterIdRef.current,
    })
  }, [phase, status, remainingMs, cycleCount, linkedChapterId])

  const flashComplete = useCallback(() => {
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 700)
  }, [])

  // Land on a phase, either idle or already running.
  const enterPhase = useCallback(
    (next, { autostart }) => {
      setPhase(next)
      setRemainingMs(durationMsFor(next))
      if (autostart) {
        endAtRef.current = Date.now() + durationMsFor(next)
        setStatus('running')
      } else {
        setStatus('idle')
      }
    },
    [durationMsFor]
  )

  // Natural end of a phase: log the work, sound the chime, move on.
  const completePhase = useCallback(() => {
    const ended = phase
    let nextCount = cycleCount
    if (ended === 'work') {
      nextCount = cycleCount + 1
      setCycleCount(nextCount)
      setTodayStats(logPomodoroSession(toISODate(new Date()), workMin, sessionChapterIdRef.current))
      sessionChapterIdRef.current = null
    }
    if (soundEnabled) playChime(ended)
    notifyPhaseEnd(ended)
    setAnnouncement(PHASE_META[ended].done)
    flashComplete()
    enterPhase(phaseAfter(ended, nextCount), { autostart: autoTransition })
  }, [phase, cycleCount, workMin, soundEnabled, autoTransition, enterPhase, phaseAfter, flashComplete])

  // ---- controls ----
  const start = useCallback(() => {
    if (phase === 'work') sessionChapterIdRef.current = linkedChapterId || null
    endAtRef.current = Date.now() + remainingMs
    setStatus('running')
    setAnnouncement(`${PHASE_META[phase].label} started.`)
  }, [remainingMs, phase, linkedChapterId])

  const startForChapter = useCallback((chapterId) => {
    const duration = durationMsFor('work')
    sessionChapterIdRef.current = chapterId || null
    setLinkedChapterId(chapterId || '')
    setPhase('work')
    setRemainingMs(duration)
    endAtRef.current = Date.now() + duration
    setStatus('running')
    setAnnouncement('Focus started for the recommended chapter.')
  }, [durationMsFor])

  const pause = useCallback(() => {
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()))
    setStatus('paused')
    setAnnouncement('Paused.')
  }, [])

  const resume = useCallback(() => {
    endAtRef.current = Date.now() + remainingMs
    setStatus('running')
    setAnnouncement('Resumed.')
  }, [remainingMs])

  const toggle = useCallback(() => {
    if (status === 'running') pause()
    else if (status === 'paused') resume()
    else start()
  }, [status, pause, resume, start])

  // Reset returns the *current* phase to its full duration. It deliberately
  // doesn't touch the cycle — you're restarting this session, not the day.
  const reset = useCallback(() => {
    sessionChapterIdRef.current = null
    setStatus('idle')
    setRemainingMs(durationMsFor(phase))
    setAnnouncement(`${PHASE_META[phase].label} reset.`)
  }, [durationMsFor, phase])

  /**
   * Skip to the next phase in the cycle.
   *
   * The cycle advances but nothing is logged: you didn't do the work, so
   * counting the minutes would quietly inflate the stats this app exists to
   * keep honest. Always lands idle, even with auto-start on — that setting is
   * about unattended transitions, and someone pressing Skip is right there.
   */
  const skip = useCallback(() => {
    sessionChapterIdRef.current = null
    const next = phaseAfter(phase, phase === 'work' ? cycleCount + 1 : cycleCount)
    if (phase === 'work') setCycleCount((c) => c + 1)
    setAnnouncement(`Skipped to ${PHASE_META[next].label.toLowerCase()}.`)
    enterPhase(next, { autostart: false })
  }, [phase, cycleCount, phaseAfter, enterPhase])

  /** Switch modes by hand. Stops whatever was running and starts this one clean. */
  const switchMode = useCallback(
    (next) => {
      if (!PHASES.includes(next) || next === phase) return
      sessionChapterIdRef.current = null
      setAnnouncement(`Switched to ${PHASE_META[next].label.toLowerCase()}.`)
      enterPhase(next, { autostart: false })
    },
    [phase, enterPhase]
  )

  /** Back to the very start: work phase, cycle cleared, nothing persisted. */
  const stop = useCallback(() => {
    sessionChapterIdRef.current = null
    setStatus('idle')
    setPhase('work')
    setCycleCount(0)
    setRemainingMs(durationMsFor('work'))
    setAnnouncement('Timer stopped.')
    setLinkedChapterId('')
    clearTimerState()
  }, [durationMsFor])

  // ---- ticking ----
  // Recomputed from Date.now() every frame (throttled to ~5/sec), never by
  // decrementing a counter. This is what survives background-tab throttling.
  useEffect(() => {
    if (status !== 'running') return
    let lastTick = 0
    function tick(t) {
      if (t - lastTick > 200) {
        lastTick = t
        const left = endAtRef.current - Date.now()
        if (left <= 0) {
          setRemainingMs(0)
          completePhase()
          return
        }
        setRemainingMs(left)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, completePhase])

  // Re-sync the moment the tab is visible again, so it never shows stale time.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible' || status !== 'running') return
      const left = endAtRef.current - Date.now()
      if (left <= 0) {
        setRemainingMs(0)
        completePhase()
      } else {
        setRemainingMs(left)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [status, completePhase])

  // ---- derived display values ----
  const secondsLeft = Math.max(0, Math.round(remainingMs / 1000))
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const totalSeconds = durationMsFor(phase) / 1000
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0
  const meta = PHASE_META[phase]
  const isPristine = status === 'idle' && cycleCount === 0 && phase === 'work'

  // Coarse label for assistive tech — minutes only, so it isn't re-read every
  // second, and phrased as a sentence rather than a pair of numerals.
  const timeLabel = `${Math.ceil(secondsLeft / 60)} minute${Math.ceil(secondsLeft / 60) === 1 ? '' : 's'} remaining in ${meta.label.toLowerCase()}`

  return {
    // state
    phase,
    status,
    meta,
    mins,
    secs,
    secondsLeft,
    progress,
    cycleCount,
    cycleLength,
    justCompleted,
    todayStats,
    isPristine,
    announcement,
    timeLabel,
    linkedChapterId,
    setLinkedChapterId,
    startForChapter,
    // settings passthrough
    autoTransition,
    soundEnabled,
    updatePrefs,
    // controls
    start,
    pause,
    resume,
    toggle,
    reset,
    skip,
    switchMode,
    stop,
  }
}
