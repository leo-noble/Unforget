import { motion } from 'framer-motion'
import { SunMedium, LibraryBig, CalendarDays, Timer, Plus } from 'lucide-react'

const TABS = [SunMedium, LibraryBig, CalendarDays, Timer]
const WEEK_DOTS = [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0]
const CHAPTERS = [
  ['Cell division', 'Biology · Review 2'],
  ['Newton’s laws', 'Physics · Review 1'],
  ['Chemical bonding', 'Chemistry · Review 3'],
]

const dateLabel = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
}).format(new Date())

// A legible, static preview of the real Today screen, sized as a phone rather
// than a tiny dashboard illustration.
export default function PhoneMockup() {
  return (
    <div className="relative w-[min(76vw,300px)] select-none" aria-hidden="true">
      <div className="relative rounded-[48px] bg-[#090a09] p-[7px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)] ring-1 ring-white/15">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[41px] bg-canvas text-label">
          <div className="absolute top-[8px] left-1/2 z-20 h-[24px] w-[82px] -translate-x-1/2 rounded-full bg-black" />

          <div className="relative z-10 flex items-center justify-between px-7 pt-[11px] font-mono text-[9px] leading-3 text-label">
            <span>9:41</span>
            <span className="flex h-[9px] items-end gap-[2px]" aria-hidden="true">
              {[4, 6, 8].map((height) => <span key={height} className="w-[2px] rounded-full bg-label" style={{ height }} />)}
            </span>
          </div>

          <div className="relative z-10 px-4 pt-7 pb-[94px]">
            <p className="text-[10px] leading-[14px] font-medium text-label-2">{dateLabel}</p>
            <h2 className="mt-1 font-display text-[34px] leading-[38px] tracking-[-0.04em]">Today</h2>

            <div className="mt-3 rounded-[22px] bg-card px-4 py-3.5 shadow-card">
              <p className="text-[13px] leading-[18px] text-label-2">Good evening, Nabil</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-display text-[62px] leading-[0.95] tracking-[-0.045em]">3</span>
                <span className="text-[14px] leading-[18px] text-label-2">reviews left</span>
              </div>
              <p className="mt-1 text-[12px] leading-4 text-label-2">3 chapters ready to review.</p>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 px-1 text-[9px] leading-3 font-semibold tracking-[0.12em] text-label-2">DUE TODAY</p>
              <div className="overflow-hidden rounded-[20px] bg-card shadow-card">
                {CHAPTERS.map(([title, meta], index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.36, delay: 0.18 + index * 0.08 }}
                    className={`flex items-center gap-2 px-3 py-[8px] ${index ? 'hairline-t' : ''}`}
                  >
                    <span className="h-5 w-5 shrink-0 rounded-full" style={{ boxShadow: 'inset 0 0 0 1px var(--label-3)' }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] leading-[13px] font-medium">{title}</span>
                      <span className="block truncate text-[8px] leading-[11px] text-label-2">{meta}</span>
                    </span>
                    <span className="shrink-0 text-[8px] leading-[11px] text-label-2">Today</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 px-1 text-[9px] leading-3 font-semibold tracking-[0.12em] text-label-2">THIS WEEK</p>
              <div className="flex items-center justify-between rounded-[18px] bg-card px-3 py-2.5 shadow-card">
                <div>
                  <p className="font-display text-[32px] leading-[34px]">10</p>
                  <p className="mt-0.5 text-[10px] leading-[13px] text-label-2">reviews · 3-day streak</p>
                </div>
                <div className="grid grid-cols-7 gap-[4px]" aria-hidden="true">
                  {WEEK_DOTS.map((active, index) => (
                    <span key={index} className={`h-[5px] w-[5px] rounded-full ${active ? 'bg-label' : 'bg-fill-2'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-3 bottom-[22px] z-10">
            <div className="liquid-dock grid h-[46px] grid-cols-5 items-center rounded-full p-1">
              {TABS.slice(0, 2).map((Icon, index) => (
                <span key={index} className={`relative flex h-full items-center justify-center rounded-full ${index === 0 ? 'text-label' : 'text-label-2'}`}>
                  {index === 0 && <span className="dock-lens absolute inset-0 rounded-full" />}
                  <Icon size={15} strokeWidth={1.8} className="relative z-[1]" />
                </span>
              ))}
              <span className="dock-action mx-auto flex h-[36px] w-[36px] items-center justify-center rounded-full text-label">
                <Plus size={18} strokeWidth={1.9} />
              </span>
              {TABS.slice(2).map((Icon, index) => (
                <span key={index} className="flex h-full items-center justify-center rounded-full text-label-2">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
              ))}
            </div>
          </div>
          <div className="absolute bottom-[7px] left-1/2 z-20 h-[4px] w-[82px] -translate-x-1/2 rounded-full bg-label/80" />
        </div>
      </div>
    </div>
  )
}
