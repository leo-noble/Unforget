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

export default function LandingPage() {
  const { session } = useAuth()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const onInstalled = () => setInstallPrompt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const cta = session ? { to: '/app', label: 'Open Today' } : { to: '/login', label: 'Get started — free' }

  return (
    <div className="min-h-[100dvh] overflow-x-clip">
      {/* Floating glass header */}
      <header className="fixed inset-x-0 top-0 z-40 px-3 sm:px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
        <div className="glass mx-auto max-w-[1080px] h-[52px] rounded-[14px] pl-3 pr-2 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <AppIcon size={26} />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">{APP_NAME}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-subhead text-label-2">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#who" className="hover:text-label">Who it’s for</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
          </nav>
          <Link
            to={session ? '/app' : '/login'}
            className="h-9 px-4 rounded-[9px] bg-tint text-tint-fg text-subhead font-medium flex items-center"
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
            <span className="glass inline-flex items-center gap-2 h-8 px-3.5 rounded-[9px] text-footnote font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-label" /> Spaced repetition, done for you
            </span>
            <h1 className="mt-6 text-[44px] xs:text-[48px] sm:text-[64px] lg:text-[72px] leading-[1] font-semibold tracking-[-0.045em] text-balance">
              Remember what
              <br />
              <span className="text-label-2">you study.</span>
            </h1>
            <p className={`${LEDE} mt-5 max-w-[480px] mx-auto lg:mx-0`}>
              {APP_NAME} tells you which chapters to revise each day — 1, 3, 7, 15 and 30 days after you study them. Right before you’d
              forget.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 max-w-[360px] sm:max-w-none mx-auto lg:mx-0">
              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  to={cta.to}
                  className="flex h-[54px] px-7 items-center justify-center gap-2 rounded-[9px] bg-tint text-tint-fg text-[17px] font-semibold shadow-float"
                >
                  {cta.label} <ArrowRight size={18} strokeWidth={2.2} />
                </Link>
              </motion.div>
              <a href="#how" className="flex h-[54px] px-6 items-center justify-center rounded-[9px] glass text-[17px] font-medium">
                How it works
              </a>
            </div>
          </motion.div>

          {/* On a phone only the top of the mockup shows, fading out — the
              screen is what matters, and a whole second phone-height of hero
              is what made the page feel endless. */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.12 }}
            className="flex justify-center max-lg:h-[440px] max-lg:overflow-hidden max-lg:[mask-image:linear-gradient(to_bottom,#000_70%,transparent)] max-lg:[-webkit-mask-image:linear-gradient(to_bottom,#000_70%,transparent)]"
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
                className="bg-card rounded-[12px] p-5 sm:p-6 flex md:flex-col gap-4"
              >
                <span className="h-10 w-10 shrink-0 rounded-[10px] bg-fill flex items-center justify-center">
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
          <motion.div {...reveal} className="mt-3 bg-card rounded-[12px] p-5 sm:p-10">
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
            <motion.div {...reveal} className="bg-card rounded-[12px] p-5 sm:p-6">
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
                className="bg-card rounded-[12px] p-4 sm:p-5"
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
              <motion.div key={title} {...reveal} className="bg-card rounded-[12px] p-4 sm:p-5 flex items-center gap-4">
                <span className="h-10 w-10 shrink-0 rounded-[10px] bg-fill flex items-center justify-center">
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
      {!isStandalone() && (
        <section className="pb-16 sm:pb-24">
          <div className={WRAP}>
            <motion.div
              {...reveal}
              className="relative overflow-hidden rounded-[12px] text-white p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10"
              style={{
                background:
                  'radial-gradient(80% 90% at 50% -10%, rgba(255,255,255,0.14), transparent 70%), linear-gradient(180deg, #2a2a2e, #121214)',
              }}
            >
              <AppIcon size={72} />
              <div className="flex-1">
                <h2 className="text-[26px] sm:text-[32px] leading-[1.1] font-semibold tracking-[-0.03em]">Put it on your Home Screen.</h2>
                <p className="text-[16px] text-white/75 mt-2">Opens full-screen, straight to today’s list.</p>
                {isIOS() ? (
                  <div className="mt-5 flex flex-wrap gap-2 text-[15px]">
                    <span className="h-10 px-4 rounded-[9px] bg-white/15 flex items-center gap-2">
                      <Share size={15} /> Tap Share
                    </span>
                    <span className="h-10 px-4 rounded-[9px] bg-white/15 flex items-center gap-2">
                      <SquarePlus size={15} /> Add to Home Screen
                    </span>
                  </div>
                ) : installPrompt ? (
                  <button onClick={install} className="mt-5 inline-flex h-12 px-6 items-center gap-2 rounded-[9px] bg-white text-[#121214] text-[16px] font-semibold">
                    <Download size={17} /> Install {APP_NAME}
                  </button>
                ) : (
                  <p className="mt-5 text-[15px] text-white/85">In your browser menu, choose “Install app” or “Add to Home Screen”.</p>
                )}
              </div>
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
          <motion.div {...reveal} className="mt-6 bg-card rounded-[12px] px-5 sm:px-6">
            {FAQ.map(([q, a], i) => (
              <FaqItem key={q} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-16 sm:pb-24">
        <div className={WRAP}>
          <motion.div {...reveal} className="bg-card rounded-[12px] px-6 py-12 sm:py-16 text-center flex flex-col items-center shadow-card">
            <AppIcon size={60} />
            <h2 className="text-[30px] sm:text-[44px] leading-[1.05] font-semibold tracking-[-0.04em] mt-6 max-w-[560px] text-balance">
              Start with the chapter you studied today.
            </h2>
            <Link
              to={cta.to}
              className="mt-8 w-full max-w-[320px] flex h-[54px] px-7 items-center justify-center gap-2 rounded-[9px] bg-tint text-tint-fg text-[17px] font-semibold"
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
            <Link to={session ? '/app' : '/login'} className="hover:text-label">
              {session ? 'Open app' : 'Sign in'}
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
