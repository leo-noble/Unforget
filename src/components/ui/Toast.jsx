import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { bouncy } from './motion'

// A glass banner that drops in from the top, like a system notification, to
// confirm something just happened. One at a time — a new one replaces the old.
const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((t) => {
    clearTimeout(timer.current)
    setToast({ ...t, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), t.duration || 2800)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 z-[95] flex justify-center px-4"
          style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
          aria-live="polite"
        >
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.key}
                initial={{ opacity: 0, y: -40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.94, transition: { duration: 0.2 } }}
                transition={bouncy}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.6, bottom: 0.1 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -20) setToast(null)
                }}
                onClick={() => setToast(null)}
                className="glass-strong pointer-events-auto flex items-center gap-3 rounded-[24px] pl-3 pr-5 py-2.5 max-w-[420px] min-w-[220px] cursor-default"
                role="status"
              >
                {toast.icon && (
                  <span
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${toast.tone === 'red' ? 'text-white' : 'text-tint-fg'}`}
                    style={{ background: `var(--${toast.tone || 'tint'})` }}
                  >
                    <toast.icon size={18} strokeWidth={2.6} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-subhead font-medium truncate">{toast.title}</span>
                  {toast.message && <span className="block text-footnote text-label-2 truncate">{toast.message}</span>}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
