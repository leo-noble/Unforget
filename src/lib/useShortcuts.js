import { useEffect, useState } from 'react'

// True while the user is typing, or while a sheet or alert is open on top of
// the page, so single-letter shortcuts never fire into a field or under a modal.
export function shortcutsBlocked(e) {
  const t = e.target
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return true
  if (e.metaKey || e.ctrlKey || e.altKey) return true
  return !!document.querySelector('[role="dialog"], [role="alertdialog"]')
}

/**
 * j / k (or the arrow keys) move through a list of chapters; Enter opens the
 * selected one, r marks it revised, s snoozes it a day. Returns the selected
 * chapter's id, or null until the keyboard is used. Desktop only in practice:
 * nothing happens without a keyboard.
 */
export function useListKeys(items, { onOpen, onRevise, onSnooze }) {
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    function onKey(e) {
      if (shortcutsBlocked(e) || !items.length) return
      const i = items.findIndex((c) => c.id === selectedId)
      const key = e.key
      let next = null
      if (key === 'j' || key === 'ArrowDown') next = items[Math.min(items.length - 1, i + 1)]
      else if (key === 'k' || key === 'ArrowUp') next = items[Math.max(0, i === -1 ? 0 : i - 1)]
      if (next) {
        e.preventDefault()
        setSelectedId(next.id)
        document.querySelector(`[data-chapter-id="${next.id}"]`)?.scrollIntoView({ block: 'nearest' })
        return
      }
      const current = items[i]
      if (!current) return
      if (key === 'Enter') onOpen?.(current)
      else if (key === 'r' || key === 's') {
        // The row leaves the list, so hand the selection to its neighbour.
        const neighbour = items[i + 1] || items[i - 1]
        if (key === 'r') onRevise?.(current)
        else onSnooze?.(current)
        setSelectedId(neighbour ? neighbour.id : null)
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, selectedId, onOpen, onRevise, onSnooze])

  // Keep the selection valid as rows leave the list (revised, snoozed).
  const valid = items.some((c) => c.id === selectedId)
  return valid ? selectedId : null
}
