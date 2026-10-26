import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppIcon from '../ui/AppIcon'
import { easeOut } from '../ui/motion'

// The frame every signed-out screen shares: the app icon floating over a wash
// of the accent colour, and one centred column — a phone's onboarding screen
// on a phone, a card in the middle of the window on a desktop.
export default function AuthLayout({ title, subtitle, children, footer, back = true }) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-canvas overflow-hidden">
      <div aria-hidden="true" className="ambient pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
      {back && (
        <div className="relative px-4 sm:px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
          <Link to="/welcome" className="inline-flex items-center gap-1.5 h-9 pl-2.5 pr-4 rounded-full bg-card eyebrow text-label">
            <ArrowLeft size={14} strokeWidth={2} /> About
          </Link>
        </div>
      )}
      <div className="relative flex-1 flex items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="w-full max-w-[400px]"
        >
          <div className="flex flex-col items-center text-center mb-7">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
            >
              <AppIcon size={68} />
            </motion.div>
            <h1 className="text-title-1 font-medium mt-6 tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="text-body text-label-2 mt-1.5 max-w-[320px]">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-subhead text-label-2">{footer}</div>}
        </motion.div>
      </div>
    </div>
  )
}

// iOS-style stacked fields: one rounded group, hairlines between the inputs.
export function FieldGroup({ children }) {
  return <div className="ios-list bg-card rounded-cell overflow-hidden shadow-card">{children}</div>
}

export function Field({ label, ...props }) {
  return (
    <label className="block" style={{ '--inset': '16px' }}>
      <span className="sr-only">{label}</span>
      <input
        {...props}
        className="w-full bg-transparent px-4 h-[54px] text-body outline-none placeholder:text-label-3"
      />
    </label>
  )
}

export function ErrorNote({ children }) {
  if (!children) return null
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 px-4 py-3 rounded-[16px] bg-red/10 text-red text-footnote"
      role="alert"
    >
      {children}
    </motion.p>
  )
}
