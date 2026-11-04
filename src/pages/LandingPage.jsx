import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Plus, Share, SquarePlus, Download, X } from 'lucide-react'
import AppIcon from '../components/ui/AppIcon'
import PhoneMockup from '../components/landing/PhoneMockup'
import RhythmTimeline from '../components/landing/RhythmTimeline'
import { useAuth } from '../lib/useAuth'
import { isIOS, isStandalone } from '../components/ui/useMediaQuery'
import { APP_NAME } from '../brand'
import { easeOut, snappy } from '../components/ui/motion'

// The welcome page, in the app's own language: ink on a stone ground, round
// pills, soft cards, the one blue kept for memory. Phone first, one column,
// and only what someone needs to decide to try it.

const WRAP = 'w-full max-w-[1040px] mx-auto px-5 sm:px-8'
const SECTION = 'py-16 sm:py-24'
const H2 = 'text-[28px] sm:text-[38px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance'
const LEDE = 'text-[17px] sm:text-[18px] leading-[1.55] text-label-2'
// The two hero actions share one size, so neither looks like an afterthought.
const ACTION = 'flex h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-full px-7 text-[16px] font-semibold'

const STEPS = [
  ['Log it the day you study it', 'Type the chapter and its subject, like “Alkenes #chem”. About five seconds.'],
  ['It comes back five times', 'On day 1, 4, 11, 26 and 56. Each gap is wider because each review makes it last longer.'],
  ['Tick off Today', 'Open the app, review what’s listed, tick it. Missed one? It waits at the top.'],
]

const FEATURES = [
  ['Quick add', 'One line logs a chapter. # picks the subject, “yesterday” or “mon” sets the day.'],
  ['Memory map', 'Every chapter as a square, bright when fresh and fading as you forget. Review the faded ones.'],
  ['Notes and checklists', 'Each chapter has a page for notes, headings and tickable to-dos.'],
  ['Plan and focus', 'See busy days two weeks ahead, block study time, and run a focus timer on any chapter.'],
]

const FAQ = [
  ['Do I have to make flashcards?', `No. ${APP_NAME} plans your revision; you revise from the notes and books you already use. It tells you which chapter, and when.`],
  ['Why those days?', 'Each review lands just before you’d start to forget. Recalling it then makes the memory last longer, which earns the next, wider gap.'],
  ['What if I miss a day?', 'Nothing resets. Missed reviews stay at the top of Today until you do them, and you can push one to tomorrow.'],
  ['Does it work on my phone?', 'Yes. Add it to your Home Screen and it opens full screen like an app. Your chapters sync between phone and computer.'],
  ['Do you track me?', 'Only anonymously: we count page visits per device with a random id, never your IP. Your chapters are private to your account.'],
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-separator last:border-b-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 text-left py-4">
        <span className="text-[16px] font-medium">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={snappy} className="shrink-0 text-label-2">
          <Plus size={17} strokeWidth={1.8} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: easeOut }}
            className="overflow-hidden"
          >
            <p className="text-[15px] leading-[1.6] text-label-2 pb-5 pr-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InstallGuide({ open, onClose, canInstall, onInstall }) {
  const ios = isIOS()
  const android = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  const step = 'flex items-center gap-3 rounded-full bg-fill px-4 h-12'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
          style={{ background: 'var(--scrim)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            className="glass-strong relative w-full max-w-[420px] rounded-sheet p-6 sm:p-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={snappy}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <AppIcon size={48} />
              <button type="button" onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full flex items-center justify-center text-label-2 hover:bg-fill">
                <X size={18} />
              </button>
            </div>
            <h2 id="install-title" className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">Install {APP_NAME}</h2>
            <p className="mt-1.5 text-subhead text-label-2">Free, a few seconds, and it opens like an app from your Home Screen.</p>

            {ios ? (
              <ol className="mt-5 space-y-2">
                <li className={step}><Share size={17} className="text-label-2" /><span className="text-subhead">Tap <strong className="font-semibold">Share</strong> in Safari</span></li>
                <li className={step}><SquarePlus size={17} className="text-label-2" /><span className="text-subhead">Choose <strong className="font-semibold">Add to Home Screen</strong></span></li>
                <li className={step}><Plus size={17} className="text-label-2" /><span className="text-subhead">Tap <strong className="font-semibold">Add</strong></span></li>
              </ol>
            ) : canInstall ? (
              <button type="button" onClick={onInstall} className={`${ACTION} sm:w-full mt-6 tint-fill text-tint-fg`}>
                <Download size={17} /> Install app
              </button>
            ) : (
              <p className="mt-5 rounded-cell bg-fill p-4 text-subhead text-label-2">
                {android ? 'Open your browser menu and choose ' : 'Open your browser’s menu and choose '}
                <strong className="font-semibold text-label">Install app</strong> or <strong className="font-semibold text-label">Add to Home Screen</strong>.
              </p>
            )}

            <button type="button" onClick={onClose} className="mt-3 h-11 w-full rounded-full text-subhead text-label-2 hover:bg-fill">
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function LandingPage() {
  const { session } = useAuth()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installGuideOpen, setInstallGuideOpen] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const onInstalled = () => {
      window.__unforgetInstallPrompt = null
      setInstallPrompt(null)
      setInstalled(true)
      setInstallGuideOpen(false)
    }
    if (window.__unforgetInstallPrompt) setInstallPrompt(window.__unforgetInstallPrompt)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!installGuideOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setInstallGuideOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [installGuideOpen])

  async function install() {
    if (!installPrompt) return
    const prompt = installPrompt
    window.__unforgetInstallPrompt = null
    setInstallPrompt(null)
    try {
      prompt.prompt()
      const choice = await prompt.userChoice
      if (choice?.outcome === 'accepted') {
        setInstalled(true)
        setInstallGuideOpen(false)
      }
    } catch {
      // The browser may withdraw its prompt if its install criteria changed.
      setInstallGuideOpen(true)
    }
  }

  const cta = session ? { to: '/dashboard', label: 'Open Today' } : { to: '/login', label: 'Get started, it’s free' }

  return (
    <div className="min-h-[100dvh] overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-40 bar-glass border-b border-separator" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className={`${WRAP} h-14 flex items-center justify-between`}>
          <a href="#top" className="flex items-center gap-2">
            <AppIcon size={26} bare />
            <span className="text-[16px] font-semibold tracking-[-0.02em]">{APP_NAME}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-subhead text-label-2">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#features" className="hover:text-label">Features</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
          </nav>
          <Link to={session ? '/dashboard' : '/login'} className="h-9 px-4 rounded-full tint-fill text-tint-fg text-subhead font-medium flex items-center">
            {session ? 'Open app' : 'Sign in'}
          </Link>
        </div>
      </header>

      {/* Hero: what it is, the one action, and the app itself. */}
      <section id="top" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 104px)' }}>
        <div className={`${WRAP} grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center`}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOut }}>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[68px] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
              Study it once.
              <br />
              <span className="text-label-2">Still know it at the exam.</span>
            </h1>
            <p className={`${LEDE} mt-5 max-w-[470px]`}>
              {APP_NAME} brings each chapter back for review right before you’d forget it, then tells you each morning what to go over.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-[400px] sm:max-w-none">
              <Link to={cta.to} className={`${ACTION} tint-fill text-tint-fg`}>
                {cta.label} <ArrowRight size={18} strokeWidth={2} />
              </Link>
              {!installed && (
                <button
                  type="button"
                  onClick={() => setInstallGuideOpen(true)}
                  aria-haspopup="dialog"
                  className={`${ACTION} bg-card text-label shadow-[inset_0_0_0_1px_var(--separator)] hover:bg-fill`}
                >
                  <Download size={17} strokeWidth={1.9} /> Install app
                </button>
              )}
            </div>
            <p className="mt-4 text-footnote text-label-3">Free. Works on iPhone, Android and any computer.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
            className="flex justify-center"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={`scroll-mt-20 ${SECTION}`}>
        <div className={WRAP}>
          <h2 className={`${H2} max-w-[560px]`}>Three steps, a few minutes a day.</h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-x-8 gap-y-8">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <span className="h-8 w-8 rounded-full bg-fill-2 flex items-center justify-center text-subhead font-medium tabular">{i + 1}</span>
                <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.01em]">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.55] text-label-2">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 bg-card rounded-sheet p-6 sm:p-10 shadow-[inset_0_0_0_1px_var(--separator)]">
            <p className="text-subhead font-medium mb-6 md:mb-14">One chapter, from the day you study it</p>
            <RhythmTimeline />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`scroll-mt-20 ${SECTION} pt-0 sm:pt-0`}>
        <div className={WRAP}>
          <h2 className={`${H2} max-w-[560px]`}>Everything a study list needs, nothing it doesn’t.</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-px rounded-sheet overflow-hidden bg-separator shadow-[inset_0_0_0_1px_var(--separator)]">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="bg-card p-6 sm:p-7">
                <h3 className="text-[17px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.55] text-label-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 pb-16 sm:pb-24">
        <div className={`${WRAP} max-w-[720px]`}>
          <h2 className={H2}>Questions</h2>
          <div className="mt-6">
            {FAQ.map(([q, a], i) => (
              <FaqItem key={q} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-20 sm:pb-28">
        <div className={`${WRAP} flex flex-col items-center text-center`}>
          <AppIcon size={52} />
          <h2 className={`${H2} mt-6 max-w-[520px]`}>Start with the chapter you studied today.</h2>
          <Link to={cta.to} className={`${ACTION} mt-8 tint-fill text-tint-fg max-w-[320px]`}>
            {session ? 'Open Today' : 'Create your account'} <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-separator" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
        <div className={`${WRAP} pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-footnote text-label-2`}>
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span className="flex gap-6">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
            <Link to={session ? '/dashboard' : '/login'} className="hover:text-label">{session ? 'Open app' : 'Sign in'}</Link>
          </span>
        </div>
      </footer>

      <InstallGuide open={installGuideOpen} onClose={() => setInstallGuideOpen(false)} canInstall={Boolean(installPrompt)} onInstall={install} />
    </div>
  )
}
