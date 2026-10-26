import { motion } from 'framer-motion'
import { SunMedium, LibraryBig, CalendarDays, Timer, Plus } from 'lucide-react'

const ROWS = [
  { title: 'Vector Algebra', meta: 'Physics · Review 2 of 5', when: '1d late', color: '#0A84FF', late: true },
  { title: 'Periodic Trends', meta: 'Chemistry · Review 1 of 5', when: 'Today', color: '#FF9500' },
  { title: 'Cell Division', meta: 'Biology · Review 3 of 5', when: 'Today', color: '#34C759' },
]

const TABS = [
  [SunMedium, 'Today'],
  [LibraryBig, 'Library'],
  [CalendarDays, 'Plan'],
  [Timer, 'Focus'],
]

// A faithful miniature of the Today screen in a phone frame — what a student
// actually opens every morning. Sized in px against a fixed 300px-wide screen
// and scaled as a whole, so it keeps its proportions on any viewport.
export default function PhoneMockup() {
  return (
    <div className="relative w-[min(76vw,300px)] select-none" aria-hidden="true">
      <div className="relative rounded-[48px] bg-[#0a0a0a] p-[8px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <div className="relative overflow-hidden rounded-[40px] bg-canvas aspect-[9/19.5]">
          <div className="ambient absolute inset-x-0 top-0 h-[45%]" />
          <div className="absolute top-[9px] left-1/2 -translate-x-1/2 h-[24px] w-[84px] rounded-full bg-black z-20" />
          <div className="relative z-10 flex items-center justify-between px-7 pt-[12px] font-mono text-[10px]">
            <span>9:41</span>
            <span className="h-[8px] w-[15px] rounded-[2px] border border-label/60 p-[1px]">
              <span className="block h-full w-[70%] rounded-[1px] bg-label" />
            </span>
          </div>

          <div className="relative z-10 px-4 pt-7">
            <p className="text-[7.5px] font-medium tracking-[0.08em] uppercase text-label-2">Tuesday, Oct 28</p>
            <p className="font-display text-[26px] leading-none mt-1.5">Today</p>

            <div className="mt-3.5 bg-card rounded-[18px] p-3.5">
              <p className="text-[8.5px] text-label-2">Good morning, Sam</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-display text-[44px] leading-[0.9]">3</span>
                <span className="text-[10px] text-label-2">reviews left</span>
              </div>
              <p className="text-[8px] text-label-2 mt-1">1 overdue — start there.</p>
              <div className="flex gap-[4px] mt-2.5">
                {[1, 1, 0, 0, 0].map((on, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.5 + i * 0.06 }}
                    className="h-[6px] w-[6px] rounded-full"
                    style={{ background: on ? 'var(--label)' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--label-3)' }}
                  />
                ))}
              </div>
            </div>

            <p className="text-[7px] font-medium tracking-[0.08em] uppercase mt-4 mb-1.5 px-0.5">Due today</p>
            <div className="bg-card rounded-[16px] overflow-hidden">
              {ROWS.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.1, ease: [0.32, 0.72, 0, 1] }}
                  className={`flex items-center gap-2.5 px-3 py-[7px] ${i > 0 ? 'hairline-t' : ''}`}
                >
                  <span
                    className="h-[13px] w-[13px] rounded-full shrink-0"
                    style={{ boxShadow: 'inset 0 0 0 1px var(--label)' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] truncate">{r.title}</span>
                    <span className="block text-[8px] text-label-2 truncate">
                      {r.meta}
                    </span>
                  </span>
                  <span className="text-[8px] font-medium shrink-0 text-label-2">{r.when}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-[16px] flex items-center gap-2">
            <div className="glass flex-1 h-[44px] rounded-full p-[3px] flex">
              {TABS.map(([Icon, label], i) => (
                <span key={label} className={`relative flex-1 flex flex-col items-center justify-center gap-[2px] rounded-full ${i === 0 ? 'glass-lens text-label' : 'text-label-2'}`}>
                  <Icon size={13} strokeWidth={1.8} />
                  <span className="text-[6.5px] font-medium">{label}</span>
                </span>
              ))}
            </div>
            <span className="glass-tint h-[44px] w-[44px] rounded-full flex items-center justify-center">
              <Plus size={18} strokeWidth={2} />
            </span>
          </div>
          <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 h-[4px] w-[90px] rounded-full bg-label/80 z-20" />
        </div>
      </div>
    </div>
  )
}
