import { motion } from 'framer-motion'
import { SunMedium, LibraryBig, CalendarDays, Timer, Plus, Flame, ChevronRight } from 'lucide-react'
import ProgressRing from '../ui/ProgressRing'

const ROWS = [
  { title: 'Vector Algebra', meta: 'Physics · Review 2 of 5', when: '1d late', color: 'var(--blue)', tone: 'var(--red)' },
  { title: 'Periodic Trends', meta: 'Chemistry · Review 1 of 5', when: 'Today', color: 'var(--orange)', tone: 'var(--tint)' },
  { title: 'Cell Division', meta: 'Biology · Review 3 of 5', when: 'Today', color: 'var(--green)', tone: 'var(--tint)' },
]

// A faithful miniature of the Today screen inside an iPhone — the thing a
// returning user actually sees every morning, glass tab bar and all.
export default function PhoneMockup() {
  return (
    <div className="relative w-[272px] sm:w-[300px] select-none" aria-hidden="true">
      <div className="relative rounded-[52px] bg-[#0c0c10] p-[9px] shadow-[0_40px_80px_-24px_rgba(20,16,80,0.45),0_0_0_1.5px_rgba(255,255,255,0.06)_inset]">
        <div className="relative overflow-hidden rounded-[44px] bg-canvas aspect-[9/19.5]">
          <div className="ambient absolute inset-x-0 top-0 h-[60%]" />
          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 h-[26px] w-[88px] rounded-full bg-black z-20" />
          <div className="relative z-10 flex items-center justify-between px-7 pt-[13px] text-[12px] font-semibold">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-[9px] w-[16px] rounded-[3px] border border-label/60 p-[1px]">
                <span className="block h-full w-[70%] rounded-[1px] bg-label" />
              </span>
            </span>
          </div>

          <div className="relative z-10 px-4 pt-6">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.04em] text-label-2">Tuesday, October 28</p>
            <p className="text-[25px] font-bold leading-tight tracking-tight">Today</p>

            <div className="mt-3 bg-card rounded-[20px] p-3 flex items-center gap-3 shadow-card">
              <ProgressRing progress={0.4} size={62} stroke={8}>
                <span className="font-rounded text-[18px] font-bold leading-none">3</span>
                <span className="text-[8px] text-label-2">to go</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-[13px] font-bold leading-tight">Good morning, Sam</p>
                <p className="text-[10px] text-label-2 mt-0.5">3 reviews left · 1 overdue</p>
                <span className="mt-1.5 inline-flex items-center gap-1 h-[18px] px-1.5 rounded-full bg-orange/15 text-orange text-[9px] font-semibold">
                  <Flame size={9} /> 12-day streak
                </span>
              </div>
            </div>

            <p className="text-[14px] font-bold mt-4 mb-1.5 px-0.5">Due Today</p>
            <div className="bg-card rounded-[16px] overflow-hidden shadow-card">
              {ROWS.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: [0.32, 0.72, 0, 1] }}
                  className={`flex items-center gap-2.5 px-3 py-2 ${i > 0 ? 'hairline-t' : ''}`}
                >
                  <span className="h-[15px] w-[15px] rounded-full shrink-0" style={{ boxShadow: `inset 0 0 0 1.4px ${r.tone}` }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] truncate">{r.title}</span>
                    <span className="block text-[9px] text-label-2 truncate">
                      <span className="inline-block h-[5px] w-[5px] rounded-full mr-1 align-[1px]" style={{ background: r.color }} />
                      {r.meta}
                    </span>
                  </span>
                  <span className="text-[9.5px] font-semibold shrink-0" style={{ color: r.tone }}>
                    {r.when}
                  </span>
                  <ChevronRight size={11} className="text-label-3 shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Floating glass tab bar + add button */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-[18px] flex items-center gap-2">
            <div className="glass flex-1 h-[46px] rounded-full p-[3px] flex">
              {[SunMedium, LibraryBig, CalendarDays, Timer].map((Icon, i) => (
                <span
                  key={i}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-[2px] rounded-full ${i === 0 ? 'bg-fill text-tint' : ''}`}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  <span className="text-[7px] font-semibold">{['Today', 'Library', 'Plan', 'Focus'][i]}</span>
                </span>
              ))}
            </div>
            <span className="glass-tint h-[46px] w-[46px] rounded-full flex items-center justify-center">
              <Plus size={20} strokeWidth={2.6} />
            </span>
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 h-[4px] w-[96px] rounded-full bg-label/80 z-20" />
        </div>
      </div>
    </div>
  )
}
