import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useDragControls } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { IconButton } from './Button'
import { sheetSpring } from './motion'
import { useIsDesktop } from './useMediaQuery'
import { lockScroll } from './scrollLock'

// A modal sheet. On a phone it rises from the bottom with a grabber and can be
// dragged down to dismiss; from md up it's a centred form sheet. Rendered into
// <body> so no transformed ancestor can turn `position: fixed` into something
// else. The caller wraps it in <AnimatePresence> so the exit can play.
export default function Sheet({
  title,
  onClose,
  leading,
  trailing,
  onConfirm,
  confirmDisabled = false,
  confirmLabel = 'Done',
  size = 'md', // md: content height · lg: nearly full height
  children,
  footer,
  ariaLabel,
  bodyClassName = '',
}) {
  const desktop = useIsDesktop()
  const drag = useDragControls()
  const panelRef = useRef(null)

  useEffect(() => lockScroll(), [])

  // Escape closes; focus moves into the sheet and back out again afterwards,
  // so keyboard and screen-reader users land where they were.
  useEffect(() => {
    const previous = document.activeElement
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) {
      const auto = panel.querySelector('[autofocus], [data-autofocus]')
      ;(auto || panel).focus({ preventScroll: true })
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true })
    }
    // onClose identity changes every render in most callers; binding once is right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const leadingNode =
    leading === undefined ? (
      <IconButton variant="fill" size={36} label="Close" onClick={onClose}>
        <X size={18} strokeWidth={2.6} />
      </IconButton>
    ) : (
      leading
    )

  const trailingNode =
    trailing !== undefined ? (
      trailing
    ) : onConfirm ? (
      <IconButton
        variant="tint"
        size={36}
        label={confirmLabel}
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={confirmDisabled ? '!bg-fill !text-label-3 !shadow-none' : ''}
      >
        <Check size={19} strokeWidth={2.8} />
      </IconButton>
    ) : (
      <span className="w-9" />
    )

  const panelMotion = desktop
    ? {
        initial: { opacity: 0, scale: 0.94, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
        transition: sheetSpring,
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%', transition: { type: 'spring', stiffness: 420, damping: 44 } },
        transition: sheetSpring,
      }

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'var(--scrim)', touchAction: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <div
        className={`pointer-events-none absolute inset-0 flex ${
          desktop ? 'items-center justify-center p-6' : 'items-end'
        }`}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
          tabIndex={-1}
          {...panelMotion}
          drag={desktop ? false : 'y'}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.04, bottom: 0.85 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 600) onClose?.()
          }}
          className={`elevated pointer-events-auto relative flex flex-col bg-canvas shadow-sheet outline-none ${
            desktop
              ? `w-full ${size === 'lg' ? 'max-w-[620px]' : 'max-w-[540px]'} max-h-[min(880px,calc(100vh-48px))] rounded-[30px]`
              : `w-full rounded-t-sheet ${
                  size === 'lg'
                    ? 'h-[calc(100dvh-env(safe-area-inset-top)-12px)]'
                    : 'max-h-[calc(100dvh-env(safe-area-inset-top)-12px)]'
                }`
          }`}
        >
          {/* Header doubles as the drag handle on phones. */}
          <div
            onPointerDown={(e) => {
              if (desktop) return
              if (e.target.closest('button, input, textarea, select, a')) return
              drag.start(e)
            }}
            className="shrink-0 relative px-4 pt-2.5 pb-2 select-none"
            style={{ touchAction: desktop ? 'auto' : 'none' }}
          >
            {!desktop && <div className="grabber mx-auto mb-2" aria-hidden="true" />}
            <div className="flex items-center gap-3 min-h-[40px]">
              <div className="flex-1 flex justify-start">{leadingNode}</div>
              {title && (
                <h2 className="text-headline font-medium text-center truncate max-w-[60%]">{title}</h2>
              )}
              <div className="flex-1 flex justify-end">{trailingNode}</div>
            </div>
          </div>

          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 ${
              footer ? 'pb-4' : desktop ? 'pb-6' : 'pb-[calc(env(safe-area-inset-bottom)+24px)]'
            } ${bodyClassName}`}
          >
            {children}
          </div>

          {footer && (
            <div
              className={`shrink-0 px-4 pt-3 ${
                desktop ? 'pb-5' : 'pb-[calc(env(safe-area-inset-bottom)+14px)]'
              } hairline-t`}
            >
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </div>,
    document.body
  )
}
