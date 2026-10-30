import { ArrowRight, Clock3, LibraryBig, Plus, Sparkles, SunMedium, CalendarDays, Timer, Flame } from 'lucide-react'

const TABS = [SunMedium, LibraryBig, CalendarDays, Timer]
const WEEK_DOTS = [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0]
const NEXT_CHAPTERS = [
  ['Newton’s laws', 'Physics · Due in 3 days'],
  ['Chemical bonding', 'Chemistry · Due in 6 days'],
]

const dateLabel = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
}).format(new Date())

// A compact, current preview of Today: the study coach, a real-looking
// recommendation queue, weekly progress, and the four-item dock with Add beside it.
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

          <div className="relative z-10 space-y-3 px-4 pt-7 pb-[84px]">
            <div>
              <p className="text-[9px] leading-[13px] font-medium text-label-2">{dateLabel}</p>
              <h2 className="mt-0.5 font-display text-[32px] leading-[36px] tracking-[-0.045em]">Today</h2>
            </div>

            <div className="rounded-[20px] bg-card px-3.5 py-3 shadow-card">
              <p className="text-[11px] leading-[15px] text-label-2">Good morning, Nabil</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-display text-[50px] leading-[0.95] tracking-[-0.045em]">0</span>
                <span className="text-[12px] leading-[16px] text-label-2">reviews left</span>
              </div>
              <p className="mt-1 text-[10px] leading-[14px] text-label-2">Nothing scheduled today.</p>
            </div>

            <div className="rounded-[20px] bg-card p-3.5 shadow-card">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fill">
                  <Sparkles size={15} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] leading-3 font-semibold tracking-[0.08em] text-label-2">STUDY COACH · NEXT UP</p>
                  <h3 className="mt-1 truncate text-[14px] leading-[18px] font-medium">Cell division</h3>
                  <p className="text-[10px] leading-[14px] text-label-2">Due in 1 day</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] leading-3 text-label-2">
                <span className="inline-flex items-center gap-1"><Clock3 size={11} /> rough estimate · 25 min</span>
                <span>Biology</span>
              </div>
              <span className="mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-full bg-label px-3 text-[10px] font-semibold text-canvas">
                Start focus <ArrowRight size={12} />
              </span>
              <div className="mt-2.5 border-t border-separator pt-2">
                <p className="mb-1 text-[8px] leading-3 font-semibold tracking-[0.1em] text-label-3">UP NEXT</p>
                {NEXT_CHAPTERS.map(([title, meta]) => (
                  <div key={title} className="flex items-center justify-between gap-2 py-1">
                    <span className="truncate text-[9px] leading-3 font-medium">{title}</span>
                    <span className="shrink-0 text-[8px] leading-3 text-label-2">{meta.split(' · ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] bg-card px-3 py-2.5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-display text-[27px] leading-[29px]">10</p>
                  <p className="text-[9px] leading-3 text-label-2">reviews this week</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[8px] leading-3 text-label-2">
                    <Flame size={10} /> 3-day streak
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-[3px]" aria-hidden="true">
                  {WEEK_DOTS.map((active, index) => (
                    <span key={index} className={`h-[5px] w-[5px] rounded-full ${active ? 'bg-label' : 'bg-fill-2'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-2.5 bottom-[18px] z-10 flex items-center gap-1.5">
            <nav aria-label="Preview navigation" className="liquid-dock grid h-[42px] min-w-0 flex-1 grid-cols-4 items-center rounded-full p-1">
              {TABS.map((Icon, index) => (
                <span key={index} className={`relative flex h-full items-center justify-center rounded-full ${index === 0 ? 'text-label' : 'text-label-2'}`}>
                  {index === 0 && <span className="dock-lens absolute inset-0 rounded-full" />}
                  <Icon size={14} strokeWidth={1.8} className="relative z-[1]" />
                </span>
              ))}
            </nav>
            <span className="dock-action flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-label">
              <Plus size={20} strokeWidth={1.9} />
            </span>
          </div>
          <div className="absolute bottom-[6px] left-1/2 z-20 h-[4px] w-[82px] -translate-x-1/2 rounded-full bg-label/80" />
        </div>
      </div>
    </div>
  )
}
