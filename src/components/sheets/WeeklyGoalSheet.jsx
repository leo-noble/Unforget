import { useState } from 'react'
import { Check, Target } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Button } from '../ui/Button'

const PRESETS = [60, 120, 180, 300]

export default function WeeklyGoalSheet({ value, onSave, onClose }) {
  const [custom, setCustom] = useState(value && !PRESETS.includes(value) ? String(value) : '')
  const [selected, setSelected] = useState(value || 120)
  const customValue = Number(custom)
  const goal = custom ? (Number.isFinite(customValue) && customValue > 0 && customValue <= 10080 ? customValue : null) : selected

  return (
    <Sheet title="Weekly focus goal" onClose={onClose} size="md">
      <div className="px-1 pb-2">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-fill flex items-center justify-center" aria-hidden="true">
          <Target size={22} />
        </div>
        <p className="text-subhead text-label-2 text-center mb-5">Pick a gentle target. Only completed focus sessions count.</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={!custom && selected === minutes}
              onClick={() => { setCustom(''); setSelected(minutes) }}
              className={`min-h-14 rounded-full border text-body transition-colors ${!custom && selected === minutes ? 'border-label bg-fill text-label' : 'border-separator text-label-2'}`}
            >
              {minutes / 60} {minutes === 60 ? 'hour' : 'hours'}
            </button>
          ))}
        </div>
        <label className="block mt-4 text-footnote text-label-2" htmlFor="weekly-goal-minutes">Custom minutes per week</label>
        <input
          id="weekly-goal-minutes"
          type="number"
          min="1"
          max="10080"
          inputMode="numeric"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="e.g. 240"
          className="mt-1 w-full rounded-full bg-fill px-4 py-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-label-3"
        />
        <Button block className="mt-5" disabled={!goal} onClick={() => onSave(goal)}>
          <Check size={17} /> Save goal
        </Button>
        {value != null && (
          <button type="button" className="w-full min-h-11 mt-2 rounded-full text-footnote text-label-2 hover:bg-fill" onClick={() => onSave(null)}>
            Turn off weekly goal
          </button>
        )}
      </div>
    </Sheet>
  )
}
