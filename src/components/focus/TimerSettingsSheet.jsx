import { Minus, Plus, Timer, Coffee, Armchair, Repeat, PlayCircle, Volume2 } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section, Row } from '../ui/List'
import Switch from '../ui/Switch'

// UIStepper: a capsule split into − and +.
function Stepper({ value, onChange, min, max, unit, label }) {
  return (
    <span className="flex items-center gap-3 shrink-0">
      <span className="text-body text-label-2 tabular min-w-[52px] text-right" aria-live="polite">
        {value}
        {unit}
      </span>
      <span className="flex items-center h-8 rounded-full bg-fill overflow-hidden">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
          className="h-full w-11 flex items-center justify-center active:bg-fill-2 disabled:opacity-30"
        >
          <Minus size={16} strokeWidth={2.6} />
        </button>
        <span className="w-px h-4 bg-separator" />
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
          className="h-full w-11 flex items-center justify-center active:bg-fill-2 disabled:opacity-30"
        >
          <Plus size={16} strokeWidth={2.6} />
        </button>
      </span>
    </span>
  )
}

export default function TimerSettingsSheet({ prefs, updatePrefs, isIdle, onClose }) {
  return (
    <Sheet title="Timer" onClose={onClose} trailing={null}>
      <div className="space-y-7">
        <Section
          title="Durations"
          footer={isIdle ? undefined : 'New lengths apply from the next session — the one running keeps its length.'}
        >
          <Row icon={Timer} iconColor="var(--tint)" title="Focus" trailing={
            <Stepper label="focus length" unit="m" min={1} max={120} value={prefs.pomodoroWork ?? 25} onChange={(v) => updatePrefs({ pomodoroWork: v })} />
          } />
          <Row icon={Coffee} iconColor="var(--green)" title="Short break" trailing={
            <Stepper label="short break" unit="m" min={1} max={60} value={prefs.pomodoroShortBreak ?? 5} onChange={(v) => updatePrefs({ pomodoroShortBreak: v })} />
          } />
          <Row icon={Armchair} iconColor="var(--teal)" title="Long break" trailing={
            <Stepper label="long break" unit="m" min={1} max={60} value={prefs.pomodoroLongBreak ?? 15} onChange={(v) => updatePrefs({ pomodoroLongBreak: v })} />
          } />
          <Row icon={Repeat} iconColor="var(--orange)" title="Long break every" trailing={
            <Stepper label="sessions per long break" unit="" min={2} max={8} value={prefs.pomodoroCycleLength ?? 4} onChange={(v) => updatePrefs({ pomodoroCycleLength: v })} />
          } />
        </Section>

        <Section>
          <Row
            icon={PlayCircle}
            iconColor="var(--blue)"
            title="Auto-start next session"
            trailing={<Switch label="Auto-start next session" checked={!!prefs.pomodoroAutoTransition} onChange={(v) => updatePrefs({ pomodoroAutoTransition: v })} />}
          />
          <Row
            icon={Volume2}
            iconColor="var(--pink)"
            title="Chime"
            trailing={<Switch label="Chime" checked={prefs.pomodoroSound !== false} onChange={(v) => updatePrefs({ pomodoroSound: v })} />}
          />
        </Section>

        <Section title="Keyboard" className="hidden md:block">
          {[
            ['Space', 'Start, pause or resume'],
            ['R', 'Reset this session'],
            ['S', 'Skip to the next mode'],
            ['F', 'Fullscreen'],
            ['1 · 2 · 3', 'Focus · short · long'],
          ].map(([k, what]) => (
            <Row key={k} title={what} trailing={<kbd className="text-footnote font-semibold text-label-2 bg-fill rounded-[6px] px-2 py-0.5 font-sans">{k}</kbd>} />
          ))}
        </Section>
      </div>
    </Sheet>
  )
}
