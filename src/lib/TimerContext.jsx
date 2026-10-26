import { createContext, useContext, useMemo } from 'react'
import { usePomodoro } from './usePomodoro'

// The focus timer lives above the tabs, so it keeps running — and keeps
// chiming at the end of a phase — while you're looking at Today or Plan, and
// the dock can show it as a live pill. Only components that read this context
// re-render on each tick; the rest of the app is passed through as children.
const TimerContext = createContext(null)
// Just whether a session is live — changes a few times a session, not five
// times a second, so the dock can show or hide its pill without ticking.
const TimerStatusContext = createContext({ status: 'idle', phase: 'work' })

export function TimerProvider({ prefs, updatePrefs, children }) {
  const timer = usePomodoro({ prefs, updatePrefs })
  const status = useMemo(() => ({ status: timer.status, phase: timer.phase }), [timer.status, timer.phase])
  return (
    <TimerStatusContext.Provider value={status}>
      <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
    </TimerStatusContext.Provider>
  )
}

export function useTimer() {
  return useContext(TimerContext)
}

export function useTimerStatus() {
  return useContext(TimerStatusContext)
}
