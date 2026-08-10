// Throwaway dev harness: the app is auth-gated, so this mounts FocusPage on
// its own with a stubbed `cadence` prop to verify layout and behaviour.
// Delete this file and focus-harness.html when done.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FocusPage from './pages/FocusPage'
import { DEFAULT_PREFS } from './lib/storage'

const subjectMap = new Map([['s1', { id: 's1', name: 'Organic Chemistry', colorTag: '#7A2E3A' }]])
const chapters = [
  { id: 'c1', subjectId: 's1', title: 'Alkenes and alkynes', derivedStatus: 'due' },
  { id: 'c2', subjectId: 's1', title: 'Stereochemistry', derivedStatus: 'upcoming' },
]

function Harness() {
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS, pomodoroWork: 1 })
  return (
    <div className="bg-paper min-h-screen">
      <FocusPage
        cadence={{
          chapters,
          subjectMap,
          prefs,
          updatePrefs: (p) => setPrefs((prev) => ({ ...prev, ...p })),
        }}
      />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Harness />)
