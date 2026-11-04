import { SegmentedControl } from 'glisse'

// Apple's Liquid Glass segmented control (from Glisse). Takes our usual
// { id, label, icon } options; sized by its labels, as on iOS, and centred in
// whatever room the caller gives it.
export default function Segmented({ options, value, onChange, className = '', ariaLabel }) {
  return (
    <div className={`flex justify-center ${className}`}>
    <SegmentedControl
      aria-label={ariaLabel}
      items={options.map((o) => ({
        value: o.id,
        label: o.icon ? (
          <span className="inline-flex items-center gap-1.5">
            <o.icon size={14} strokeWidth={1.8} />
            {o.label}
          </span>
        ) : (
          o.label
        ),
      }))}
      value={value}
      onValueChange={onChange}
    />
    </div>
  )
}
