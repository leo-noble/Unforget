import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowDown, Plus, SunMedium, LibraryBig, CalendarDays, Timer, Share, SquarePlus, Download } from 'lucide-react'
import AppIcon from '../components/ui/AppIcon'
import PhoneMockup from '../components/landing/PhoneMockup'
import RhythmTimeline from '../components/landing/RhythmTimeline'
import ForgettingCurve from '../components/landing/ForgettingCurve'
import { useAuth } from '../lib/useAuth'
import { isIOS, isStandalone } from '../components/ui/useMediaQuery'
import { APP_NAME } from '../brand'
import { easeOut, snappy } from '../components/ui/motion'

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: easeOut },
}

const WRAP = 'w-full max-w-[1120px] mx-auto px-5 sm:px-8'
const H2 = 'text-[clamp(1.9rem,7vw,3rem)] leading-[1.05] font-medium tracking-[-0.035em] text-balance'
const LEDE = 'text-[clamp(1.0625rem,4.2vw,1.25rem)] leading-[1.5] text-label-2'

function Label({ n, children }) {
  return (
    <p className="eyebrow text-label-2 flex items-center gap-2 mb-5">
      <span className="h-[6px] w-[6px] rounded-full bg-red" />
      {n && <span className="text-label">{n}</span>}
      {children}
    </p>
  )
}

const FACTS = [
  ['05', 'Reviews'],
  ['56', 'Days'],
  ['~5', 'Min a day'],
]

const AUDIENCE = [
  ['School students', 'Board exams, finals and unit tests. Every chapter stays fresh until exam day — not just the last few.'],
  ['University students', 'Lectures pile up fast. Review each one on time instead of cramming the whole module the week before.'],
  ['Exam prep', 'SAT, IELTS, MCAT, medical and engineering entrance. Long syllabuses, months of preparation, nothing forgotten.'],
  ['Self-learners', 'Languages, coding, certifications — anything you want to still know a year from now.'],
]

const STEPS = [
  ['Log it after you study', 'Type the chapter and pick its subject. About ten seconds — the only typing it ever asks for.'],
  ['Five reviews get scheduled', 'One day later, then 3, 7, 15 and 30 days after each review. Each gap is wider because the memory lasts longer.'],
  ['Open Today each morning', 'It lists exactly what to revise. Go over each one from your own notes, tick it off, and you’re done.'],
]

const INSIDE = [
  [SunMedium, 'Today', 'What to revise right now — overdue first. Tap the circle or swipe to tick one off.'],
  [LibraryBig, 'Library', 'Every chapter, grouped by subject, with how close each subject is to mastered.'],
  [CalendarDays, 'Plan', 'Day, week and month calendar. See busy days coming and block out study time.'],
  [Timer, 'Focus', 'A Pomodoro timer that keeps running while you use the rest of the app.'],
]

const FAQ = [
  ['Do I have to make flashcards?', `No. ${APP_NAME} plans your revision; it doesn’t hold your notes. You revise from the textbook and notes you already use — it tells you which chapter, and when.`],
  ['Why 1, 3, 7, 15 and 30 days?', 'Each review lands just before you’d start to forget. Recalling it right then makes the memory last longer, which earns the next, wider gap. Five reviews and it sticks.'],
  ['What if I miss a day?', 'Nothing resets. Missed reviews move to the top of Today, marked overdue. You can push a review back by a day, twice at most, so nothing drifts forever.'],
  ['Does it work on my phone?', 'Yes — add it to your Home Screen and it opens full-screen like an app. Your chapters sync between your phone and computer.'],
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="hairline-b">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 text-left py-5">
        <span className="text-[17px] font-medium">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={snappy} className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${open ? 'bg-red text-white' : 'bg-fill'}`}>
          <Plus size={16} strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: easeOut }} className="overflow-hidden">
            <p className="text-[16px] leading-[1.6] text-label-2 pb-5 pr-10">{a}</p>
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
  const [openFaq, setOpenFaq] = useState(0)

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

  const cta = session ? { to: '/app', label: 'Open Today' } : { to: '/login', label: 'Get started' }

  return (
    <div className="min-h-screen bg-canvas overflow-x-clip">
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className={`absolute inset-0 bar-glass hairline-b transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`relative ${WRAP} h-14 flex items-center justify-between`}>
          <a href="#top" className="flex items-center gap-2.5">
            <AppIcon size={28} />
            <span className="font-dot text-[22px] leading-none lowercase">{APP_NAME}</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 eyebrow text-label-2">
            <a href="#what" className="hover:text-label">What it is</a>
            <a href="#who" className="hover:text-label">Who it’s for</a>
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
          </nav>
          <div className="flex items-center gap-1.5">
            {!session && (
              <Link to="/login" className="hidden sm:inline-flex h-9 px-4 items-center rounded-full text-subhead hover:bg-fill">
                Sign in
              </Link>
            )}
            <Link to={cta.to} className="inline-flex h-9 px-4 items-center rounded-full tint-fill text-tint-fg text-subhead font-medium">
              {cta.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative">
        <div aria-hidden="true" className="ambient absolute inset-x-0 -top-14 h-[640px] pointer-events-none" />
        <div className={`relative ${WRAP} pt-10 sm:pt-16 pb-16 sm:pb-24 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-10 items-center`}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
            <Label>Spaced-repetition study planner</Label>
            <h1 className="font-dot uppercase text-[clamp(2.75rem,12.5vw,5.75rem)] leading-[0.92] tracking-[0.01em]">
              Remember
              <br />
              what you
              <br />
              study<span className="text-red">.</span>
            </h1>
            <p className={`${LEDE} mt-6 max-w-[520px]`}>
              {APP_NAME} tells you exactly which chapters to revise each day. Log a chapter when you study it, and it brings it back
              1, 3, 7, 15 and 30 days later — right before you’d forget it.
            </p>
            <div className="mt-8 flex flex-col xs:flex-row gap-3">
              <motion.div whileTap={{ scale: 0.97 }} className="xs:w-auto">
                <Link to={cta.to} className="flex h-[54px] px-7 items-center justify-center gap-2 rounded-full tint-fill text-tint-fg text-headline font-medium">
                  {session ? 'Open Today' : 'Get started — free'} <ArrowRight size={18} strokeWidth={2} />
                </Link>
              </motion.div>
              <a href="#how" className="flex h-[54px] px-6 items-center justify-center gap-2 rounded-full bg-card text-headline">
                How it works <ArrowDown size={17} strokeWidth={1.8} />
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-3 max-w-[460px] bg-card rounded-[22px]">
              {FACTS.map(([n, l], i) => (
                <div key={l} className={`px-4 py-4 ${i > 0 ? 'border-l border-separator' : ''}`}>
                  <dt className="font-dot text-[clamp(1.9rem,8vw,2.4rem)] leading-none">{n}</dt>
                  <dd className="eyebrow text-label-2 mt-2">{l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.15 }}
            className="relative flex justify-center"
          >
            <div aria-hidden="true" className="dot-grid dot-grid-fade absolute inset-[-10%] opacity-80" />
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* What it is */}
      <section id="what" className="scroll-mt-16 py-20 sm:py-28 bg-card">
        <div className={`${WRAP} grid md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-center`}>
          <motion.div {...reveal}>
            <Label n="01">What it’s for</Label>
            <h2 className={H2}>You forget most of what you study within a week.</h2>
            <p className={`${LEDE} mt-5`}>
              That’s the forgetting curve. Re-reading the night before an exam doesn’t beat it — reviewing at spaced intervals does.
            </p>
            <p className={`${LEDE} mt-4`}>
              The hard part is remembering <em>when</em> each chapter is due. With twenty chapters across five subjects, nobody can track
              that by hand. <span className="text-label">{APP_NAME} does the tracking, so you only do the revising.</span>
            </p>
          </motion.div>
          <motion.div {...reveal} className="[&>div]:bg-canvas">
            <ForgettingCurve />
          </motion.div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="scroll-mt-16 py-20 sm:py-28">
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[640px]">
            <Label n="02">Who it’s for</Label>
            <h2 className={H2}>Anyone with a syllabus to keep in their head.</h2>
          </motion.div>
          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {AUDIENCE.map(([title, body], i) => (
              <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: (i % 2) * 0.06 }} className="bg-card rounded-[26px] p-6 sm:p-7">
                <p className="font-dot text-[34px] leading-none text-label-3">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="text-title-3 font-medium mt-6">{title}</h3>
                <p className="text-[16px] leading-[1.55] text-label-2 mt-2">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 py-20 sm:py-28 bg-card">
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[640px]">
            <Label n="03">How it works</Label>
            <h2 className={H2}>Three steps. Ten seconds of typing a day.</h2>
          </motion.div>
          <ol className="mt-10 grid md:grid-cols-3 gap-3">
            {STEPS.map(([title, body], i) => (
              <motion.li key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="bg-canvas rounded-[26px] p-6 sm:p-7">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className={`h-[9px] w-[9px] rounded-full ${d <= i ? (d === i ? 'bg-red' : 'bg-label') : 'bg-fill-2'}`} />
                  ))}
                </div>
                <h3 className="text-title-3 font-medium mt-6">{title}</h3>
                <p className="text-[16px] leading-[1.55] text-label-2 mt-2">{body}</p>
              </motion.li>
            ))}
          </ol>
          <motion.div {...reveal} className="mt-3 bg-canvas rounded-[26px] p-6 sm:p-10">
            <p className="eyebrow text-label-2 mb-10 md:mb-14">One chapter’s schedule</p>
            <RhythmTimeline />
          </motion.div>
        </div>
      </section>

      {/* Inside the app */}
      <section className="py-20 sm:py-28">
        <div className={WRAP}>
          <motion.div {...reveal} className="max-w-[640px]">
            <Label n="04">Inside the app</Label>
            <h2 className={H2}>Four tabs. Nothing else to learn.</h2>
          </motion.div>
          <div className="mt-10 bg-card rounded-[26px] overflow-hidden ios-list">
            {INSIDE.map(([Icon, title, body]) => (
              <motion.div key={title} {...reveal} className="flex items-start gap-4 p-5 sm:p-6" style={{ '--inset': '20px' }}>
                <span className="h-11 w-11 rounded-full bg-fill flex items-center justify-center shrink-0">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <h3 className="eyebrow text-label mt-1">{title}</h3>
                  <p className="text-[16px] leading-[1.5] text-label-2 mt-1.5">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.ul {...reveal} className="mt-4 flex flex-wrap gap-2">
            {['Syncs phone ↔ computer', 'Daily reminder', 'Light & dark', 'Installs like an app'].map((t) => (
              <li key={t} className="eyebrow text-label-2 h-9 px-4 rounded-full bg-card flex items-center">
                {t}
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* Install */}
      {!isStandalone() && (
        <section className="pb-20 sm:pb-28">
          <div className={WRAP}>
            <motion.div {...reveal} className="relative overflow-hidden rounded-[30px] bg-[#0a0a0a] text-white p-7 sm:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div aria-hidden="true" className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1.1px, transparent 1.4px)', backgroundSize: '16px 16px' }} />
              <div className="relative">
                <p className="eyebrow text-white/60 flex items-center gap-2 mb-5">
                  <span className="h-[6px] w-[6px] rounded-full bg-red" /> On your phone
                </p>
                <h2 className="text-[clamp(1.75rem,6.5vw,2.6rem)] leading-[1.08] font-medium tracking-[-0.03em]">Put it on your Home Screen.</h2>
                <p className="text-[16px] text-white/65 mt-3 max-w-[440px]">Opens full-screen, straight to today’s list. No browser bar, no sign-in page every time.</p>
                {isIOS() ? (
                  <ol className="mt-6 space-y-2.5 text-[16px]">
                    <li className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><Share size={15} /></span>
                      Tap Share in Safari
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><SquarePlus size={15} /></span>
                      Choose “Add to Home Screen”
                    </li>
                  </ol>
                ) : installPrompt ? (
                  <button onClick={install} className="mt-6 inline-flex h-[50px] px-6 items-center gap-2 rounded-full bg-white text-black text-headline font-medium">
                    <Download size={18} /> Install {APP_NAME}
                  </button>
                ) : (
                  <p className="mt-6 text-[16px] text-white/80">Use your browser’s “Install app” or “Add to Home Screen”.</p>
                )}
              </div>
              <div className="relative justify-self-start md:justify-self-center">
                <AppIcon size={112} />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 pb-20 sm:pb-28">
        <div className={`${WRAP} max-w-[780px]`}>
          <motion.div {...reveal}>
            <Label n="05">Questions</Label>
            <h2 className={H2}>Fair questions.</h2>
          </motion.div>
          <motion.div {...reveal} className="mt-8 bg-card rounded-[26px] px-6">
            {FAQ.map(([q, a], i) => (
              <FaqItem key={q} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-24">
        <div className={WRAP}>
          <motion.div {...reveal} className="relative overflow-hidden bg-card rounded-[30px] px-6 py-14 sm:py-20 text-center">
            <div aria-hidden="true" className="dot-grid dot-grid-fade absolute inset-0 opacity-70" />
            <div className="relative flex flex-col items-center">
              <AppIcon size={64} />
              <h2 className="font-dot uppercase text-[clamp(2rem,9vw,3.6rem)] leading-[0.95] mt-7 max-w-[680px]">
                Start with today’s chapter<span className="text-red">.</span>
              </h2>
              <Link to={cta.to} className="mt-8 inline-flex h-[54px] px-8 items-center gap-2 rounded-full tint-fill text-tint-fg text-headline font-medium">
                {session ? 'Open Today' : 'Create your account'} <ArrowRight size={18} strokeWidth={2} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="hairline-t" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className={`${WRAP} py-8 flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <span className="flex items-center gap-2.5">
            <AppIcon size={22} />
            <span className="eyebrow text-label-2">© {new Date().getFullYear()} {APP_NAME}</span>
          </span>
          <span className="flex gap-6 eyebrow text-label-2">
            <a href="#how" className="hover:text-label">How it works</a>
            <a href="#faq" className="hover:text-label">FAQ</a>
            <Link to={session ? '/app' : '/login'} className="hover:text-label">{session ? 'Open app' : 'Sign in'}</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
