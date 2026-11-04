import { Plus, SunMedium, LibraryBig, CalendarDays, Timer } from 'lucide-react'

// A still of the real Today screen, drawn with the app's own tokens and
// shapes: the quick-add bar, one list to tick off, what's coming up, and the
// glass dock. Sample chapters only; nothing here is live.
const QUEUE = [
  ['Series and convergence tests', 'Calculus II · Review 1 of 5', '2d late', true],
  ['Alkenes and addition reactions', 'Organic chemistry · Review 3 of 5', '1d late', true],
  ['SN1 and SN2 mechanisms', 'Organic chemistry · Review 2 of 5', 'Today', false],
  ['The Cold War begins', 'Modern history · Review 2 of 5', 'Today', false],
]
const NEXT = [
  ['Polar coordinates', 'Tomorrow'],
  ['Subjunctive mood', 'Thu'],
]

export default function PhoneMockup() {
  return (
    <div className="relative w-[min(78vw,310px)] select-none" aria-hidden="true">
      <div className="relative rounded-[50px] bg-[#0b0b0a] p-[7px] ring-1 ring-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[43px] bg-canvas text-label">
          <div className="absolute top-[9px] left-1/2 z-20 h-[24px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
          <div className="relative z-10 flex items-center justify-between px-7 pt-[12px] text-[10px] font-semibold">
            <span>9:41</span>
            <span className="flex h-[9px] items-end gap-[2px]">
              {[4, 6, 8].map((h) => <span key={h} className="w-[2px] rounded-full bg-label" style={{ height: h }} />)}
            </span>
          </div>

          <div className="relative px-4 pt-8">
            <p className="text-[20px] font-semibold tracking-[-0.02em] leading-none">
              Today <span className="ml-1 text-[11px] font-normal tracking-normal text-label-2">Tuesday, Nov 3</span>
            </p>
            <p className="mt-1.5 text-[10.5px] text-label-2">4 reviews left. Tick each one once you’ve gone over it.</p>

            <div className="mt-3.5 flex h-9 items-center gap-2 rounded-full bg-card px-3 shadow-[inset_0_0_0_1px_var(--separator)]">
              <Plus size={12} className="text-label-2" />
              <span className="text-[10.5px] text-label-3">Alkenes #chem yesterday</span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[16px] bg-card shadow-[inset_0_0_0_1px_var(--separator)]">
              {QUEUE.map(([title, sub, when, late], i) => (
                <div key={title} className={`flex items-center gap-2.5 px-3 py-2.5 ${i ? 'border-t border-separator' : ''}`}>
                  <span
                    className="h-[15px] w-[15px] shrink-0 rounded-full"
                    style={{ boxShadow: `inset 0 0 0 1.3px ${late ? 'var(--negative)' : 'var(--label)'}` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] leading-[14px]">{title}</span>
                    <span className="block truncate text-[9px] leading-[12px] text-label-2">{sub}</span>
                  </span>
                  <span className={`shrink-0 text-[9.5px] ${late ? 'text-negative' : 'text-label'}`}>{when}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[9.5px] text-label-2">Coming up</p>
            {NEXT.map(([title, when]) => (
              <div key={title} className="mt-1.5 flex items-center justify-between text-[10.5px] text-label-2">
                <span>{title}</span>
                <span className="text-label-3">{when}</span>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-3 bottom-[22px] z-20 flex items-center gap-2">
            <div className="liquid-dock relative grid h-[46px] flex-1 grid-cols-4 items-center rounded-full p-[4px]">
              <span className="dock-lens absolute left-[4px] top-[4px] bottom-[4px] rounded-full" style={{ width: 'calc((100% - 8px) / 4)' }} />
              {[SunMedium, LibraryBig, CalendarDays, Timer].map((Icon, i) => (
                <span key={i} className={`relative z-[1] flex justify-center ${i === 0 ? 'text-label' : 'text-label-2'}`}>
                  <Icon size={15} strokeWidth={i === 0 ? 2 : 1.7} />
                </span>
              ))}
            </div>
            <span className="dock-action flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full">
              <Plus size={19} strokeWidth={1.8} />
            </span>
          </div>
          <div className="absolute bottom-[8px] left-1/2 z-20 h-[4px] w-[96px] -translate-x-1/2 rounded-full bg-label/70" />
        </div>
      </div>
    </div>
  )
}
