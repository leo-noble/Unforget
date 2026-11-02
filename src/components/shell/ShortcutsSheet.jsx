import Sheet from '../ui/Sheet'
import { MOD } from './tabs'

const GROUPS = [
  {
    title: 'Anywhere',
    keys: [
      [`${MOD}K`, 'Search chapters and commands'],
      [`${MOD}N`, 'New chapter'],
      [`${MOD}\\`, 'Show or hide the sidebar'],
      ['1 – 4', 'Today, Library, Plan, Focus'],
      ['?', 'This list'],
    ],
  },
  {
    title: 'In a list of chapters',
    keys: [
      ['J  /  K', 'Move down and up'],
      ['Enter', 'Open the chapter'],
      ['R', 'Mark revised'],
      ['S', 'Snooze to tomorrow'],
    ],
  },
]

export default function ShortcutsSheet({ onClose }) {
  return (
    <Sheet title="Keyboard shortcuts" onClose={onClose}>
      <div className="space-y-6 pb-2">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3 className="text-footnote font-medium text-label-2 mb-2">{g.title}</h3>
            <div className="ios-list bg-card rounded-cell">
              {g.keys.map(([key, what]) => (
                <div key={key} className="flex items-center justify-between gap-4 px-4 h-11">
                  <span className="text-subhead">{what}</span>
                  <span className="kbd">{key}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
