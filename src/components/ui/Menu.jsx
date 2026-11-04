import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// A "…" menu on iOS 26's frosted surface. Items: { label, icon, onSelect,
// destructive?, disabled? } or the string 'separator'. Opens from its button's
// corner with a quick scale (transform only); Escape or a tap outside closes it.
export default function Menu({ items, icon, label = 'More', align = 'end' }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        data-icon-only=""
        data-variant="gray"
        className="lg-button"
        style={{ width: 32, height: 32 }}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            className={`lg-menu-card top-10 ${align === 'end' ? 'right-0' : 'left-0 origin-top-left'}`}
          >
            {items.map((item, i) =>
              item === 'separator' ? (
                <div key={`sep-${i}`} className="lg-menu-separator" role="separator" />
              ) : (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  data-destructive={item.destructive ? '' : undefined}
                  className="lg-menu-item"
                  onClick={() => {
                    setOpen(false)
                    item.onSelect?.()
                  }}
                >
                  <span className="flex-1">{item.label}</span>
                  {item.icon}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
