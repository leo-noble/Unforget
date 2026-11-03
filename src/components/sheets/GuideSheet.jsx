import Sheet from '../ui/Sheet'
import { Button } from '../ui/Button'

const STEPS = [
  {
    title: 'Log what you studied',
    body: 'The day you study something, add it as a chapter. Type it in the bar at the top, like “Alkenes #chem”. # picks the subject; “yesterday” or “mon” sets the day.',
  },
  {
    title: 'It comes back five times',
    body: 'Each chapter returns for review 1, 4, 11, 26 and 56 days later. The gaps grow because each review makes the memory last longer.',
  },
  {
    title: 'Clear your Today list',
    body: 'Today shows what’s due. Review the chapter, then tick its circle. Can’t today? Swipe left (or press S) to move it to tomorrow.',
  },
  {
    title: 'Watch the memory map',
    body: 'Every chapter is a dot, bright blue when it’s fresh and fading as you forget it. Faded dots are the ones to review first.',
  },
  {
    title: 'Keep notes and focus',
    body: 'Open any chapter to write notes and checklists. Focus runs a timer on the chapter you’re studying, and learns how long each one takes you.',
  },
]

// The whole idea of the app in five steps, reachable from Today and Settings.
export default function GuideSheet({ onClose }) {
  return (
    <Sheet title="How Unforget works" onClose={onClose}>
      <ol className="space-y-5 pb-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="h-7 w-7 shrink-0 rounded-full bg-fill-2 flex items-center justify-center text-footnote font-medium tabular">{i + 1}</span>
            <div className="min-w-0 pt-0.5">
              <p className="text-body font-medium">{s.title}</p>
              <p className="text-subhead text-label-2 mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button block className="mt-6" onClick={onClose}>Got it</Button>
    </Sheet>
  )
}
