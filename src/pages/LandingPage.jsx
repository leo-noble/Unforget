import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import { ArrowRight, ChevronDown, Download } from 'lucide-react'
import Logo from '../components/Logo'
import HeroPreview from '../components/HeroPreview'
import RhythmTimeline from '../components/RhythmTimeline'
import ForgettingCurve from '../components/ForgettingCurve'
import LandingNav from '../components/landing/LandingNav'
import HowItWorks from '../components/landing/HowItWorks'
import AppTour from '../components/landing/AppTour'
import WhySection from '../components/landing/WhySection'
import Faq from '../components/landing/Faq'
import { Glow, Section, SectionHead, CONTAINER, MEASURE } from '../components/landing/Section'
import { Reveal, Stagger } from '../components/landing/Reveal'
import { EASE, fadeUp, group, transition } from '../components/landing/anim'
import { NAV_LINKS, focusRing } from '../components/landing/links'

const primaryCta =
  'inline-flex items-center gap-2 rounded-capsule bg-brand text-white font-medium shadow-fab transition-transform duration-180 hover:scale-[1.02] active:scale-[0.98]'
const secondaryCta =
  'inline-flex items-center gap-2 rounded-capsule border border-divider font-medium transition-colors duration-180 hover:bg-surface hover:border-ink-soft/25'

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const canInstall = installPrompt && !installed

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-paper text-ink overflow-x-clip">
        <LandingNav />

        {/* ================= Hero ================= */}
        {/* The hero owns the whole first screen: min-height minus the 4rem nav, with
            the grid centred inside it so the next band never peeks above the fold. */}
        <section
          id="top"
          className="relative scroll-mt-24 flex items-center min-h-[calc(100svh-4rem)]"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <Glow className="-top-48 -left-40" size={520} color="bg-brand/20" />
            <Glow className="top-0 right-[-180px]" size={440} color="bg-accent/15" />
            <span
              aria-hidden="true"
              className="dot-field absolute inset-0 text-ink-soft/[0.14] opacity-70"
            />
          </div>

          <div
            className={`w-full ${CONTAINER} pt-12 pb-24 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-16 lg:gap-14 items-center`}
          >
            <motion.div initial="hidden" animate="visible" variants={group(0.09)}>
              <motion.h1
                variants={fadeUp}
                transition={transition(0.65)}
                className="font-display text-[40px] sm:text-[48px] lg:text-display-xl font-semibold mb-5 text-balance"
              >
                Know <em className="font-medium">exactly</em> what to revise today.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={transition(0.55)}
                className={`text-lede text-ink-soft mb-8 ${MEASURE}`}
              >
                Add a chapter the day you study it. Cadence schedules five short
                reviews — 1, 3, 7, 15 and 30 days later — and tells you which ones
                are due each morning.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={transition(0.5)}
                className="flex flex-wrap items-center gap-3"
              >
                <Link to="/login" className={`${primaryCta} px-6 py-3.5 text-body ${focusRing}`}>
                  Start free <ArrowRight size={16} />
                </Link>
                {canInstall && (
                  <button
                    onClick={handleInstall}
                    className={`${secondaryCta} px-6 py-3.5 text-body ${focusRing}`}
                  >
                    <Download size={16} /> Install app
                  </button>
                )}
                {/* The one place pricing is stated. It was previously repeated
                    in a hero badge, the closing CTA and an FAQ answer. */}
                <p className="text-ui text-ink-soft">Free for the first 100 users.</p>
              </motion.div>
            </motion.div>

            <div className="flex justify-center lg:justify-end">
              <HeroPreview />
            </div>
          </div>

          {/* Sits in the space the taller hero opens up, so the empty base of the
              screen reads as an invitation to scroll rather than as dead room. */}
          <motion.a
            href="#how"
            aria-label="Scroll to how it works"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.6, ease: EASE }}
            className={`absolute bottom-7 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center text-ink-soft transition-colors duration-180 hover:text-ink rounded-control ${focusRing}`}
          >
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex"
            >
              <ChevronDown size={16} />
            </motion.span>
          </motion.a>
        </section>

        {/* ================= How it works ================= */}
        <Section id="how" tone="raised">
          <SectionHead
            eyebrow="How it works"
            title="Ten seconds of typing a day."
            lede="Three small habits. There is no system to learn and nothing to configure."
          />
          <HowItWorks />
        </Section>

        {/* ================= The schedule ================= */}
        {/* The timeline and the curve are one argument — the gaps widen because
            each review buys more time — so they share a band instead of the
            curve trailing 112px below the thing it explains. */}
        <Section id="schedule" className="overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Glow className="top-24 -right-40" size={460} color="bg-brand/12" />
          </div>

          <SectionHead
            eyebrow="The schedule"
            title="One chapter, five reviews, eight weeks."
            lede="Every gap is wider than the last, because each review makes the memory hold for longer. Clear the fourth and the chapter is mastered."
          />

          <Reveal delay={0.1} className="mt-14">
            <RhythmTimeline />
          </Reveal>

          <div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 md:gap-16 items-center mt-16">
            <Reveal>
              <h3 className="font-display text-display-md font-semibold mb-3">
                Timed to catch you just before you forget
              </h3>
              <p className="text-prose text-ink-soft">
                You lose most of a chapter in the first few days, then the decline
                flattens. Each review arrives just before the drop and takes recall
                back to full — buying more time than the one before it.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ForgettingCurve />
            </Reveal>
          </div>
        </Section>

        {/* ================= Why it works ================= */}
        <Section tone="raised">
          <WhySection />
        </Section>

        {/* ================= Inside the app ================= */}
        <Section id="tour">
          <SectionHead
            eyebrow="Inside the app"
            title="Four screens. Nothing to learn."
            lede="Today is where you live. The rest is there when you want to look ahead, time a session, or check the work is adding up."
          />
          <AppTour />
        </Section>

        {/* ================= FAQ ================= */}
        {/* The header column was a 0.8fr track holding copy capped at 20rem —
            the emptiest block on the page. Centring the header over a single
            column of questions removes the hole rather than padding it. */}
        <Section id="faq" tone="raised">
          <SectionHead
            align="center"
            eyebrow="FAQ"
            title="Fair questions."
            className="mb-12"
          />
          <div className="max-w-3xl mx-auto">
            <Faq />
          </div>
        </Section>

        {/* ================= Closing CTA ================= */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Glow
              className="-bottom-56 left-1/2 -translate-x-1/2"
              size={620}
              color="bg-brand/18"
            />
          </div>
          <div className={`${CONTAINER} py-24 md:py-band-lg text-center`}>
            <Stagger stagger={0.09}>
              <Stagger.Item>
                <h2 className="font-display text-display-lg font-semibold max-w-2xl mx-auto text-balance">
                  Start with the chapter you studied today.
                </h2>
              </Stagger.Item>
              <Stagger.Item>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                  <Link
                    to="/login"
                    className={`${primaryCta} px-7 py-4 text-body ${focusRing}`}
                  >
                    Create your free account <ArrowRight size={16} />
                  </Link>
                  {canInstall && (
                    <button
                      onClick={handleInstall}
                      className={`${secondaryCta} px-7 py-4 text-body ${focusRing}`}
                    >
                      <Download size={16} /> Install app
                    </button>
                  )}
                </div>
              </Stagger.Item>
            </Stagger>
          </div>
        </section>

        {/* ================= Footer ================= */}
        <footer>
          <div className={CONTAINER}>
            <div className="fade-rule" />
            <div className="py-12 flex flex-col sm:flex-row sm:items-start justify-between gap-10">
              <div>
                <Logo size={24} />
                <p className="text-body text-ink-soft mt-3 max-w-[260px]">
                  A review planner for students. Add a chapter, and Cadence tells
                  you when to go over it again.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-10 gap-y-3 text-body" aria-label="Footer">
                {[...NAV_LINKS, { href: '/login', label: 'Log in', route: true }].map((l) =>
                  l.route ? (
                    <Link
                      key={l.label}
                      to={l.href}
                      className={`text-ink-soft hover:text-ink transition-colors duration-180 rounded-control ${focusRing}`}
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      key={l.label}
                      href={l.href}
                      className={`text-ink-soft hover:text-ink transition-colors duration-180 rounded-control ${focusRing}`}
                    >
                      {l.label}
                    </a>
                  )
                )}
              </nav>
            </div>
            <div className="pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-meta text-ink-soft">
              <span>© 2026 Cadence</span>
              <span>Made for students who’d rather study than plan.</span>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}
