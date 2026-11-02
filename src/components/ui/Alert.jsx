import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { lockScroll } from './scrollLock'
import { snappy } from './motion'

// iOS-style alert for confirming destructive actions. Promise-based so a
// caller reads top to bottom:  if (await confirm({...})) deleteIt()
const ConfirmContext = createContext(() => Promise.resolve(false))

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current?.(false)
        resolver.current = resolve
        setRequest(opts)
      }),
    []
  )

  const settle = useCallback((value) => {
    resolver.current?.(value)
    resolver.current = null
    setRequest(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>{request && <AlertCard key="alert" {...request} onSettle={settle} />}</AnimatePresence>,
        document.body
      )}
    </ConfirmContext.Provider>
  )
}

function AlertCard({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', destructive = false, onSettle }) {
  const confirmRef = useRef(null)
  useEffect(() => {
    const release = lockScroll()
    confirmRef.current?.focus({ preventScroll: true })
    function onKey(e) {
      if (e.key === 'Escape') onSettle(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      release()
      window.removeEventListener('keydown', onKey, true)
    }
  }, [onSettle])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'var(--scrim)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onSettle(false)}
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
        transition={snappy}
        className="glass-strong relative w-full max-w-[360px] rounded-sheet p-5 text-left"
      >
        <h2 id="alert-title" className="text-headline font-medium">
          {title}
        </h2>
        {message && <p className="text-footnote text-label-2 mt-1.5">{message}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => onSettle(false)}
            className="h-9 px-4 rounded-control bg-fill-2 text-subhead font-medium hover:bg-fill"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onSettle(true)}
            className={`h-9 px-4 rounded-control text-subhead font-medium ${
              destructive ? 'bg-negative text-white' : 'tint-fill text-tint-fg'
            } hover:opacity-90`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
