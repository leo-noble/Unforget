// iOS segmented control: equal segments and a white thumb that springs to the
// selected one. The thumb moves with transform only, so it's smooth on a
// phone. Takes { id, label, icon } options and fills the width it's given.
export default function Segmented({ options, value, onChange, className = '', ariaLabel }) {
  const index = Math.max(0, options.findIndex((o) => o.id === value))
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`lg-segmented ${className}`}>
      <span
        aria-hidden="true"
        className="lg-segmented-thumb"
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} onClick={() => onChange(o.id)} className="lg-segment">
          {o.icon && <o.icon size={14} strokeWidth={1.8} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
