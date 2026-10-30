import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Plus,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  SunMedium,
  LibraryBig,
  CalendarDays,
  Timer,
  Share,
  SquarePlus,
  Download,
  Smartphone,
  GraduationCap,
  School,
  ClipboardList,
  Sparkles,
  X,
  Check,
} from 'lucide-react'
import AppIcon from '../components/ui/AppIcon'
import PhoneMockup from '../components/landing/PhoneMockup'
import RhythmTimeline from '../components/landing/RhythmTimeline'
import { useAuth } from '../lib/useAuth'
import { isIOS, isStandalone } from '../components/ui/useMediaQuery'
import { APP_NAME } from '../brand'
import { easeOut, snappy } from '../components/ui/motion'

// The marketing page, built phone-first: one column, generous but not
// endless spacing, nothing under 15px, and every section readable in one
// glance before the thumb moves on. Wider screens get more columns, never
// more words.

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: easeOut },
}

const WRAP = 'w-full max-w-[1080px] mx-auto px-5 sm:px-8'
const SECTION = 'py-16 sm:py-24'
const H2 = 'text-[30px] sm:text-[42px] leading-[1.08] font-semibold tracking-[-0.035em] text-balance'
const LEDE = 'text-[17px] sm:text-[19px] leading-[1.5] text-label-2'

function Eyebrow({ children }) {
  return <p className="eyebrow text-label-2 mb-3">{children}</p>
}

const STEPS = [
  [BookOpen, 'Log it after you study', 'Chapter name and subject. About ten seconds.'],
  [CalendarCheck, 'Five reviews get scheduled', '1, 3, 7, 15 and 30 days apart — automatically.'],
  [CheckCheck, 'Open Today each morning', 'It lists exactly what to revise. Tick them off. Done.'],
]

const AUDIENCE = [
  [School, 'School', 'Board exams, finals, unit tests.'],
  [GraduationCap, 'University', 'Lectures that pile up all term.'],
  [ClipboardList, 'Exam prep', 'SAT, IELTS, MCAT, entrance exams.'],
  [Sparkles, 'Self-learners', 'Languages, code, certifications.'],
]

const TABS = [
  [SunMedium, 'Today', 'What to revise right now, overdue first.'],
  [LibraryBig, 'Library', 'Every chapter, grouped by subject.'],
  [CalendarDays, 'Plan', 'See busy days coming, block out time.'],
  [Timer, 'Focus', 'A study timer that keeps running in the background.'],
]

const FAQ = [
  ['Do I have to make flashcards?', `No. ${APP_NAME} plans your revision — you revise from the notes and textbook you already use. It tells you which chapter, and when.`],
  ['Why 1, 3, 7, 15 and 30 days?', 'Each review lands just before you’d start to forget. Recalling it then makes the memory last longer, which earns the next, wider gap.'],
  ['What if I miss a day?', 'Nothing resets. Missed reviews move to the top of Today, marked overdue. You can push one back a day, twice at most.'],
  ['Does it work on my phone?', 'Yes. Add it to your Home Screen and it opens full-screen like an app. Your chapters sync between phone and computer.'],
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="hairline-b last:shadow-none">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 text-left py-[18px]">
        <span className="text-[16px] sm:text-[17px] font-medium">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={snappy}
          className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${open ? 'bg-tint text-tint-fg' : 'bg-fill'}`}
        >
          <Plus size={15} strokeWidth={2.2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: easeOut }}
            className="overflow-hidden"
          >
            <p className="text-[15px] sm:text-[16px] leading-[1.6] text-label-2 pb-5 pr-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InstallGuide({ open, onClose, canInstall, onInstall }) {
  const ios = isIOS()
  const android = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            className="glass-strong relative w-full max-w-[440px] overflow-hidden rounded-[32px] p-6 shadow-sheet sm:p-8"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={snappy}
            onClick={(event) => event.stopPropagation()}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-white/[0.07] blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <span className="glass-lens flex h-14 w-14 items-center justify-center rounded-full">
                <Smartphone size={23} strokeWidth={1.7} />
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close install guide"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-fill text-label-2"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative mt-5">
              <p className="eyebrow text-label-2">A little closer</p>
              <h2 id="install-title" className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.04em]">
                Install {APP_NAME}
              </h2>
              <p className="mt-2 text-subhead leading-relaxed text-label-2">Keep your study plan one tap away. It’s free and takes a few seconds.</p>
            </div>

            {ios ? (
              <>
                <p className="relative mt-5 rounded-[18px] bg-fill px-4 py-3 text-footnote leading-relaxed text-label-2">
                  iPhone and iPad require one final confirmation in Safari. A website can’t add itself to your Home Screen.
                </p>
                <ol className="relative mt-3 space-y-2">
                  <li className="flex items-center gap-3 rounded-[20px] bg-fill px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card"><Share size={17} /></span>
                    <span className="text-subhead">Tap <strong className="font-semibold text-label">Share</strong> in your browser.</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-[20px] bg-fill px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card"><SquarePlus size={17} /></span>
                    <span className="text-subhead">Choose <strong className="font-semibold text-label">Add to Home Screen</strong>.</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-[20px] bg-fill px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card"><Plus size={17} /></span>
                    <span className="text-subhead">Tap <strong className="font-semibold text-label">Add</strong> to finish.</span>
                  </li>
                </ol>
              </>
            ) : canInstall ? (
              <div className="relative mt-6">
                <p className="text-subhead text-label-2">Add it to your device from the browser’s secure install prompt.</p>
                <button
                  type="button"
                  onClick={onInstall}
                  className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-tint px-6 text-subhead font-semibold text-tint-fg"
                >
                  <Download size={17} /> Install app
                </button>
              </div>
            ) : (
              <div className="relative mt-6 rounded-[22px] bg-fill p-4">
                <p className="text-subhead leading-relaxed text-label-2">
                  {android ? 'Open your browser menu and choose ' : 'Open your browser’s install menu and choose '}
                  <strong className="font-semibold text-label">Install app</strong> or <strong className="font-semibold text-label">Add to Home Screen</strong>.
                </p>
              </div>
            )}

            <button type="button" onClick={onClose} className="relative mt-5 h-11 w-full rounded-full text-subhead font-medium text-label-2 hover:bg-fill">
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

  function beginInstall() {
    setInstallGuideOpen(true)
  }

  const cta = session ? { to: '/dashboard', label: 'Open Today' } : { to: '/login', label: 'Get started — free' }

  return (
    <div className="min-h-[100dvh] overflow-x-clip">
      {/* Floating glass header */}
      <header className="fixed inset-x-0 top-0 z-40 px-3 sm:px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
        <div className="glass mx-auto max-w-[1080px] h-[52px] rounded-full pl-2.5 pr-2 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <AppIcon size={32} />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">{APP_NAME}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-subhead text-label-2">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#who" className="hover:text-label">Who it’s for</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
          </nav>
          <Link
            to={session ? '/dashboard' : '/login'}
            className="h-9 px-4 rounded-full bg-tint text-tint-fg text-subhead font-medium flex items-center"
          >
            {session ? 'Open app' : 'Sign in'}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="top" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 96px)' }}>
        <div className={`${WRAP} grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 items-center`}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center lg:text-left"
          >
            <span className="glass inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-footnote font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-label" /> Spaced repetition, done for you
            </span>
            <h1 className="mt-6 text-[44px] xs:text-[48px] sm:text-[64px] lg:text-[72px] leading-[1] font-semibold tracking-[-0.045em] text-balance">
              Study once.
              <br />
              <span className="text-label-2">Never forget it.</span>
            </h1>
            <p className={`${LEDE} mt-5 max-w-[480px] mx-auto lg:mx-0`}>
              {APP_NAME} tells you which chapters to revise each day — 1, 3, 7, 15 and 30 days after you study them. Right before you’d
              forget.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 max-w-[360px] sm:max-w-none mx-auto lg:mx-0">
              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  to={cta.to}
                  className="flex h-[54px] px-7 items-center justify-center gap-2 rounded-full bg-tint text-tint-fg text-[17px] font-semibold shadow-float"
                >
                  {cta.label} <ArrowRight size={18} strokeWidth={2.2} />
                </Link>
              </motion.div>
              {!installed && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={beginInstall}
                  aria-haspopup="dialog"
                  className="flex h-[54px] items-center justify-center gap-2 rounded-full glass-lens px-6 text-[17px] font-semibold"
                >
                  <Download size={17} /> Install app
                </motion.button>
              )}
              <a href="#how" className="flex h-[54px] px-6 items-center justify-center rounded-full glass text-[17px] font-medium">
                How it works
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.12 }}
            className="mt-10 flex justify-center lg:mt-0"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={`scroll-mt-20 ${SECTION}`}>
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[600px]">
            <Eyebrow>How it works</Eyebrow>
            <h2 className={H2}>Three steps. Ten seconds a day.</h2>
          </motion.div>
          <ol className="mt-8 grid md:grid-cols-3 gap-3">
            {STEPS.map(([Icon, title, body], i) => (
              <motion.li
                key={title}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.06 }}
                className="bg-card rounded-[24px] p-5 sm:p-6 flex md:flex-col gap-4"
              >
                <span className="h-11 w-11 shrink-0 rounded-full glass-lens flex items-center justify-center">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-footnote text-label-3 font-medium">Step {i + 1}</p>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mt-0.5">{title}</h3>
                  <p className="text-[15px] leading-[1.5] text-label-2 mt-1">{body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <motion.div {...reveal} className="mt-3 bg-card rounded-[24px] p-5 sm:p-10">
            <p className="eyebrow text-label-2 mb-6 md:mb-12">One chapter’s schedule</p>
            <RhythmTimeline />
          </motion.div>
        </div>
      </section>

      {/* Why it works */}
      <section className={SECTION}>
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[600px]">
            <Eyebrow>Why it works</Eyebrow>
            <h2 className={H2}>Most of what you study fades within days.</h2>
            <p className={`${LEDE} mt-4`}>
              Re-reading the night before doesn’t fix that. Reviewing at the right moments does — and {APP_NAME} keeps track of every
              moment, for every chapter.
            </p>
          </motion.div>
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <motion.div {...reveal} className="bg-card rounded-[24px] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-label-2">
                <X size={16} strokeWidth={2.2} />
                <span className="text-subhead font-medium">Cramming</span>
              </div>
              <p className="text-[20px] font-semibold tracking-[-0.02em] mt-3">Gone by next month.</p>
              <p className="text-[15px] text-label-2 mt-1.5">Feels productive the night before, then you relearn it all for finals.</p>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.06 }} className="bg-card rounded-[12px] p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Check size={16} strokeWidth={2.4} />
                <span className="text-subhead font-medium">Five spaced reviews</span>
              </div>
              <p className="text-[20px] font-semibold tracking-[-0.02em] mt-3">Still there at exam time.</p>
              <p className="text-[15px] text-label-2 mt-1.5">A few minutes a day, spread over eight weeks per chapter.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className={`scroll-mt-20 ${SECTION}`}>
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[600px]">
            <Eyebrow>Who it’s for</Eyebrow>
            <h2 className={H2}>Anyone with a syllabus to remember.</h2>
          </motion.div>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {AUDIENCE.map(([Icon, title, body], i) => (
              <motion.div
                key={title}
                {...reveal}
                transition={{ ...reveal.transition, delay: (i % 2) * 0.05 }}
                className="bg-card rounded-[22px] p-4 sm:p-5"
              >
                <Icon size={22} strokeWidth={1.7} />
                <h3 className="text-[17px] font-semibold mt-4">{title}</h3>
                <p className="text-[14px] sm:text-[15px] leading-[1.45] text-label-2 mt-1">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inside the app */}
      <section className={SECTION}>
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[600px]">
            <Eyebrow>Inside the app</Eyebrow>
            <h2 className={H2}>Four tabs. Nothing to learn.</h2>
          </motion.div>
          <div className="mt-8 grid md:grid-cols-2 gap-3">
            {TABS.map(([Icon, title, body]) => (
              <motion.div key={title} {...reveal} className="bg-card rounded-[22px] p-4 sm:p-5 flex items-center gap-4">
                <span className="h-11 w-11 shrink-0 rounded-full glass-lens flex items-center justify-center">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-semibold">{title}</h3>
                  <p className="text-[15px] leading-[1.45] text-label-2">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      {!installed && (
        <section className="pb-16 sm:pb-24">
          <div className={WRAP}>
            <motion.div
              {...reveal}
              className="glass relative isolate flex flex-col gap-6 overflow-hidden rounded-[30px] p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
              <span className="glass-lens flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-[68px] sm:w-[68px]">
                <Smartphone size={25} strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-label-2 mb-1">TAKE IT WITH YOU</p>
                <h2 className="text-[25px] leading-tight font-semibold tracking-[-0.035em] sm:text-[30px]">Your study plan, one tap away.</h2>
                <p className="mt-2 text-subhead leading-relaxed text-label-2">Install on iPhone, iPad, or Android. Opens like an app, no app store needed.</p>
              </div>
              <button
                type="button"
                onClick={beginInstall}
                aria-haspopup={!isIOS() && installPrompt ? undefined : 'dialog'}
                className="inline-flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-full bg-tint px-6 text-subhead font-semibold text-tint-fg"
              >
                <Download size={17} /> Install app
              </button>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 pb-16 sm:pb-24">
        <div className={`${WRAP} max-w-[760px]`}>
          <motion.div {...reveal}>
            <Eyebrow>Questions</Eyebrow>
            <h2 className={H2}>Fair questions.</h2>
          </motion.div>
          <motion.div {...reveal} className="mt-6 bg-card rounded-[24px] px-5 sm:px-6">
            {FAQ.map(([q, a], i) => (
              <FaqItem key={q} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-16 sm:pb-24">
        <div className={WRAP}>
          <motion.div {...reveal} className="relative isolate flex flex-col items-center px-5 py-12 text-center sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[15%] top-1/2 -z-10 h-40 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] blur-2xl"
            />
            <AppIcon size={52} />
            <h2 className="text-[30px] sm:text-[44px] leading-[1.05] font-semibold tracking-[-0.04em] mt-6 max-w-[560px] text-balance">
              Start with the chapter you studied today.
            </h2>
            <Link
              to={cta.to}
              className="mt-8 w-full max-w-[320px] flex h-[54px] px-7 items-center justify-center gap-2 rounded-full bg-tint text-tint-fg text-[17px] font-semibold"
            >
              {session ? 'Open Today' : 'Create your account'} <ArrowRight size={18} strokeWidth={2.2} />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        <div className={`${WRAP} flex flex-col sm:flex-row items-center justify-between gap-4 text-footnote text-label-2`}>
          <span className="flex items-center gap-2.5">
            <AppIcon size={22} />© {new Date().getFullYear()} {APP_NAME}
          </span>
          <span className="flex gap-6">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
            <Link to={session ? '/dashboard' : '/login'} className="hover:text-label">
              {session ? 'Open app' : 'Sign in'}
            </Link>
          </span>
        </div>
      </footer>

      <InstallGuide
        open={installGuideOpen}
        onClose={() => setInstallGuideOpen(false)}
        canInstall={Boolean(installPrompt)}
        onInstall={install}
      />
    </div>
  )
}
