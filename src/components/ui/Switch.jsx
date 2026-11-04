// iOS 26 switch: a wide pill, green when on, the thumb springs across.
export default function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="lg-switch"
    >
      <span className="lg-switch-thumb" />
    </button>
  )
}
