import { forwardRef } from 'react'

// Apple's iOS 26 buttons (see styles/liquid-glass.css): `primary` is the blue
// filled one, for the thing you came to do; `destructive` is red text; `plain`
// is a bare icon or label; everything else is the soft grey fill. Animations
// are transform-only, so presses stay smooth on a phone.
const VARIANT = { primary: 'filled', destructive: 'destructive', plain: 'plain' }

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, block = false, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      data-variant={VARIANT[variant] || 'gray'}
      data-size={size}
      className={`lg-button ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})

// A round icon button. `label` names it for screen readers and tooltips.
export const IconButton = forwardRef(function IconButton(
  { variant, size = 36, label, className = '', style, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      data-icon-only=""
      data-variant={VARIANT[variant] || (variant === 'tint' ? 'filled' : 'gray')}
      className={`lg-button ${className}`}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {children}
    </button>
  )
})
