import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  Plus,
  SunMedium,
  LibraryBig,
  CalendarDays,
  Timer,
  RefreshCw,
  Bell,
  Moon,
  Smartphone,
  Share,
  SquarePlus,
  Download,
} from 'lucide-react'
import AppIcon from '../components/ui/AppIcon'
import PhoneMockup from '../components/landing/PhoneMockup'
import RhythmTimeline from '../components/landing/RhythmTimeline'
import ForgettingCurve from '../components/landing/ForgettingCurve'
import { useAuth } from '../lib/useAuth'
import { isIOS, isStandalone } from '../components/ui/useMediaQuery'
import { APP_NAME } from '../brand'
import { easeOut, snappy } from '../components/ui/motion'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: easeOut },
}

const CONTAINER = 'max-w-[1120px] mx-auto px-5 sm:px-8'

function SectionHead({ eyebrow, title, lede, center = false }) {
  return (
    <motion.div {...reveal} className={`max-w-[640px] ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <p className="text-subhead font-semibold text-tint mb-2">{eyebrow}</p>}
      <h2 className="text-[34px] sm:text-[44px] leading-[1.08] font-bold tracking-[-0.03em] text-balance">{title}</h2>
      {lede && <p className="text-[17px] sm:text-[19px] leading-[1.5] text-label-2 mt-4">{lede}</p>}
    </motion.div>
  )
}

const STEPS = [
  { icon: Plus, color: 'var(--tint)', title: 'Log it the day you study it', body: 'Subject, chapter, done. About ten seconds — the only typing it ever asks for.' },
  { icon: CalendarCheck, color: 'var(--orange)', title: 'Five reviews appear on their own', body: 'Tomorrow, then 3, 7, 15 and 30 days after each one. Nothing to configure.' },
  { icon: CheckCheck, color: 'var(--green)', title: 'Clear the short list each morning', body: 'Revise what’s due from your own notes and tick it off. Ring full, day done.' },
]

const FEATURES = [
  { icon: SunMedium, color: 'var(--orange)', title: 'Today', body: 'A ring that fills as you revise. Overdue first, then due, then what’s coming.', wide: true },
  { icon: LibraryBig, color: 'var(--blue)', title: 'Library', body: 'Every chapter by subject, with mastery progress at a glance.' },
  { icon: CalendarDays, color: 'var(--red)', title: 'Plan', body: 'Day, week and month views. Drag study sessions into place.' },
  { icon: Timer, color: 'var(--tint)', title: 'Focus', body: 'A Pomodoro timer that keeps running while you use the rest of the app.' },
  { icon: RefreshCw, color: 'var(--teal)', title: 'Syncs everywhere', body: 'Tick a review on your phone, see it on your laptop.' },
  { icon: Bell, color: 'var(--pink)', title: 'Daily reminders', body: 'One nudge at the time you choose, only when something’s due.' },
  { icon: Moon, color: 'var(--purple)', title: 'Light, dark, your colour', body: 'Follows your system appearance, in the accent you pick.', wide: true },
]

const FAQ = [
  { q: 'Do I have to make flashcards?', a: `No. ${APP_NAME} plans your revision but never stores it — you revise from the textbook and notes you already have. It tells you which chapter and which day.` },
  { q: 'Why 1, 3, 7, 15 and 30 days?', a: 'Each review lands just before you’d start losing the chapter. Going over it right then makes the memory hold longer, which earns the next, wider gap.' },
  { q: 'What if I miss a day?', a: 'Nothing resets. Missed reviews move to the top of Today marked overdue. You can push a review back twice at most, so it can’t drift forever.' },
  { q: 'How long does it take each day?', a: 'A few minutes. Most days have two to four chapters due, and a review is re-reading something you already know.' },
]

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="hairline-b last:shadow-none">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 text-left py-5">
        <span className="text-[17px] font-semibold">{item.q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={snappy} className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${open ? 'bg-tint text-white' : 'bg-fill text-label'}`}>
          <Plus size={17} strokeWidth={2.6} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOut }} className="overflow-hidden">
            <p className="text-[17px] leading-[1.55] text-label-2 pb-5 pr-10">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const { session } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const primary = session ? { to: '/app', label: 'Open Today' } : { to: '/login', label: 'Get Started' }
  const ios = isIOS()

  return (
    <div className="min-h-screen bg-canvas overflow-x-clip">
      {/* Nav */}
      <header className="sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className={`absolute inset-0 bar-glass hairline-b transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`relative ${CONTAINER} h-14 flex items-center justify-between`}>
          <a href="#top" className="flex items-center gap-2.5">
            <AppIcon size={30} shadow={false} />
            <span className="text-headline font-bold">{APP_NAME}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-subhead text-label-2">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#schedule" className="hover:text-label">Schedule</a>
            <a href="#features" className="hover:text-label">Features</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {!session && (
              <Link to="/login" className="hidden sm:inline-flex h-9 px-4 items-center rounded-full text-subhead font-semibold text-tint hover:bg-tint/10">
                Sign In
              </Link>
            )}
            <Link to={primary.to} className="inline-flex h-9 px-4 items-center gap-1 rounded-full tint-fill text-white text-subhead font-semibold">
              {primary.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative">
        <div aria-hidden="true" className="ambient absolute inset-x-0 -top-14 h-[760px] pointer-events-none" />
        <div className={`relative ${CONTAINER} pt-10 sm:pt-16 pb-16 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: easeOut }} className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3.5 rounded-full glass text-footnote font-semibold">
              <span className="h-5 w-5 rounded-full tint-gradient text-white flex items-center justify-center">
                <RefreshCw size={11} strokeWidth={3} />
              </span>
              Spaced repetition, on autopilot
            </span>
            <h1 className="mt-6 text-[44px] sm:text-[64px] lg:text-[72px] leading-[1.02] font-bold tracking-[-0.04em] text-balance">
              Remember what you <span className="bg-clip-text text-transparent tint-gradient">study.</span>
            </h1>
            <p className="mt-5 text-[18px] sm:text-[21px] leading-[1.45] text-label-2 max-w-[540px] mx-auto lg:mx-0">
              Log a chapter the day you learn it. {APP_NAME} brings it back 1, 3, 7, 15 and 30 days later — and tells you each morning exactly what to revise.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link to={primary.to} className="inline-flex h-[54px] px-7 items-center gap-2 rounded-full tint-fill text-white text-headline font-semibold shadow-tint">
                  {primary.label} <ArrowRight size={19} strokeWidth={2.4} />
                </Link>
              </motion.div>
              {installPrompt && (
                <button onClick={install} className="inline-flex h-[54px] px-6 items-center gap-2 rounded-full glass text-headline font-semibold">
                  <Download size={19} /> Install
                </button>
              )}
            </div>
            <p className="mt-4 text-footnote text-label-2">Free · iPhone, Android, Mac and PC</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.15 }}
            className="relative flex justify-center"
          >
            <PhoneMockup />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1.2 }}
              className="glass-strong absolute top-16 -left-2 sm:left-0 lg:-left-10 w-[230px] rounded-[22px] p-3 hidden sm:flex items-start gap-2.5 text-left"
            >
              <AppIcon size={34} shadow={false} />
              <span className="min-w-0">
                <span className="flex justify-between text-caption text-label-2">
                  <span className="font-semibold uppercase tracking-[0.02em]">{APP_NAME}</span>
                  <span>now</span>
                </span>
                <span className="block text-footnote font-semibold">3 chapters to review today</span>
                <span className="block text-caption text-label-2 truncate">Vector Algebra is 1 day overdue</span>
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 1.6 }}
              className="glass-strong absolute bottom-24 -right-1 sm:right-2 lg:-right-6 rounded-full h-12 pl-1.5 pr-4 hidden sm:flex items-center gap-2.5"
            >
              <span className="h-9 w-9 rounded-full bg-green text-white flex items-center justify-center">
                <CheckCheck size={18} strokeWidth={2.6} />
              </span>
              <span className="text-left">
                <span className="block text-footnote font-semibold leading-tight">Marked as revised</span>
                <span className="block text-caption text-label-2 leading-tight">Next review in 7 days</span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 py-20 sm:py-28">
        <div className={CONTAINER}>
          <SectionHead center eyebrow="How it works" title="Ten seconds of typing a day." lede="There’s no system to learn and nothing to set up. Three small habits, and the schedule does the rest." />
          <div className="mt-14 grid sm:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className="bg-card rounded-[28px] p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="h-11 w-11 rounded-[13px] flex items-center justify-center text-white" style={{ background: s.color }}>
                    <s.icon size={22} strokeWidth={2.3} />
                  </span>
                  <span className="font-rounded text-title-1 font-bold text-label-3 tabular">{i + 1}</span>
                </div>
                <h3 className="text-title-3 font-bold mt-5">{s.title}</h3>
                <p className="text-body text-label-2 mt-2">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="scroll-mt-20 py-20 sm:py-28 bg-card/50">
        <div className={CONTAINER}>
          <SectionHead eyebrow="The schedule" title="One chapter. Five reviews. Eight weeks." lede="Every gap is wider than the last, because each review makes the memory hold longer. Clear the fifth and the chapter is mastered." />
          <motion.div {...reveal} className="mt-16 bg-card rounded-[28px] shadow-card p-6 sm:p-10">
            <RhythmTimeline />
          </motion.div>
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-10 md:gap-14 items-center mt-16">
            <motion.div {...reveal}>
              <h3 className="text-title-1 font-bold">Timed for just before you forget.</h3>
              <p className="text-[17px] leading-[1.55] text-label-2 mt-3">
                You lose most of a chapter in the first few days, then the decline flattens. Each review arrives just before the drop and resets recall to full — buying more time than the one before.
              </p>
            </motion.div>
            <motion.div {...reveal}>
              <ForgettingCurve />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28">
        <div className={CONTAINER}>
          <SectionHead center eyebrow="Built like an app" title="Four tabs. Nothing to learn." lede="Designed to feel at home on your iPhone’s Home Screen — liquid glass, springy motion and all." />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...reveal}
                transition={{ ...reveal.transition, delay: (i % 3) * 0.06 }}
                className={`relative overflow-hidden bg-card rounded-[28px] p-6 shadow-card ${f.wide ? 'lg:col-span-2' : ''}`}
              >
                <div aria-hidden="true" className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-[0.12]" style={{ background: f.color, filter: 'blur(30px)' }} />
                <span className="relative h-11 w-11 rounded-[13px] flex items-center justify-center text-white" style={{ background: f.color }}>
                  <f.icon size={22} strokeWidth={2.3} />
                </span>
                <h3 className="relative text-title-3 font-bold mt-5">{f.title}</h3>
                <p className="relative text-body text-label-2 mt-1.5">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      {!isStandalone() && (
        <section className="pb-20 sm:pb-28">
          <div className={CONTAINER}>
            <motion.div {...reveal} className="relative overflow-hidden rounded-[36px] tint-gradient text-white p-8 sm:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(60% 80% at 10% 0%, rgba(255,255,255,0.28), transparent 60%)' }} />
              <div className="relative">
                <h2 className="text-[30px] sm:text-[38px] leading-[1.1] font-bold tracking-[-0.03em]">Put it on your Home Screen.</h2>
                <p className="text-[17px] text-white/80 mt-3 max-w-[460px]">
                  It opens full-screen like any other app, straight to Today — no browser bar, no sign-in page.
                </p>
                {ios ? (
                  <ol className="mt-5 space-y-2 text-[17px]">
                    <li className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center"><Share size={15} /></span>
                      Tap Share in Safari
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center"><SquarePlus size={15} /></span>
                      Choose Add to Home Screen
                    </li>
                  </ol>
                ) : installPrompt ? (
                  <button onClick={install} className="mt-6 inline-flex h-[50px] px-6 items-center gap-2 rounded-full bg-white text-[#2A2390] text-headline font-semibold">
                    <Download size={19} /> Install {APP_NAME}
                  </button>
                ) : (
                  <p className="mt-5 text-[17px] flex items-center gap-2 text-white/90">
                    <Smartphone size={18} /> Use your browser’s “Install app” or “Add to Home Screen”.
                  </p>
                )}
              </div>
              <div className="relative justify-self-center">
                <AppIcon size={132} />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 pb-20 sm:pb-28">
        <div className={`${CONTAINER} max-w-[760px]`}>
          <SectionHead center title="Fair questions." />
          <motion.div {...reveal} className="mt-10 bg-card rounded-[28px] shadow-card px-6">
            {FAQ.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pb-24">
        <div className={`${CONTAINER} text-center`}>
          <motion.div {...reveal} className="flex flex-col items-center">
            <AppIcon size={72} />
            <h2 className="mt-6 text-[34px] sm:text-[48px] leading-[1.06] font-bold tracking-[-0.035em] max-w-[640px] text-balance">
              Start with the chapter you studied today.
            </h2>
            <Link to={primary.to} className="mt-8 inline-flex h-[54px] px-8 items-center gap-2 rounded-full tint-fill text-white text-headline font-semibold shadow-tint">
              {session ? 'Open Today' : 'Create your free account'} <ArrowRight size={19} strokeWidth={2.4} />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="hairline-t" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className={`${CONTAINER} py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-footnote text-label-2`}>
          <span className="flex items-center gap-2">
            <BookOpen size={14} /> © {new Date().getFullYear()} {APP_NAME} — made for students who’d rather study than plan.
          </span>
          <span className="flex gap-5">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
            <Link to={session ? '/app' : '/login'} className="hover:text-label">{session ? 'Open app' : 'Sign in'}</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
