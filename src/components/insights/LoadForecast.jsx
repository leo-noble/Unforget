import { startOfDay } from '../../lib/srs'

const H = 120

// Reviews per day for the next fortnight. Today, the day you can act on, is
// in the data hue; the days after it are grey. The axis is labelled at its
// top so a tall bar always reads as a number of reviews.
export default function LoadForecast({ days, onSelectDay }) {
  const max = Math.max(1, ...days.map((d) => d.count))
  const top = Math.max(2, Math.ceil(max / 2) * 2)
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const peak = days.reduce((a, b) => (b.count > a.count ? b : a), days[0])
  const label = (iso, opts) => startOfDay(iso).toLocaleDateString(undefined, opts)

  return (
    <figure>
      <figcaption className="sr-only">{`${total} reviews in the next ${days.length} days; busiest is ${label(peak.date, { weekday: 'long' })} with ${peak.count}.`}</figcaption>
      <div className="flex gap-2">
        <div className="relative w-5 shrink-0 text-caption text-label-3 tabular" style={{ height: H }} aria-hidden="true">
          <span className="absolute right-0 -top-2">{top}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{top / 2}</span>
          <span className="absolute right-0 -bottom-2">0</span>
        </div>
        <div className="relative flex-1 min-w-0">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-separator" />
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-separator" />
          <div className="relative flex items-end gap-[3px] sm:gap-1.5 border-b border-separator" style={{ height: H }}>
            {days.map((d, i) => (
              <button
                key={d.date}
                type="button"
                onClick={() => onSelectDay?.(d.date)}
                title={`${label(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.count} review${d.count === 1 ? '' : 's'}`}
                aria-label={`${label(d.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${d.count} reviews`}
                className="group relative flex-1 h-full flex flex-col justify-end items-center"
              >
                {d.count > 0 && (d === peak || i === 0) && (
                  <span className="mb-1 text-caption tabular text-label-2">{d.count}</span>
                )}
                <span
                  className={`block w-full max-w-[28px] rounded-t-[3px] group-hover:opacity-80 ${i === 0 ? 'bg-data' : 'bg-label-3'}`}
                  style={{ height: d.count ? `${(d.count / top) * (H - 18)}px` : 0 }}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-[3px] sm:gap-1.5 mt-1.5" aria-hidden="true">
            {days.map((d, i) => (
              <span key={d.date} className={`flex-1 text-center text-caption-2 tabular ${i === 0 ? 'text-label font-medium' : 'text-label-3'}`}>
                {i === 0 ? 'Today' : label(d.date, { weekday: 'narrow' })}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}
