import { forwardRef } from 'react'
import { Button as GlassButton } from 'glisse'

// Every button is Apple's Liquid Glass (from Glisse). `primary` is the filled
// one, for the thing you came to do; `destructive` is red; everything else is
// clear glass. The old prop names still work so no caller had to change.
const FILLED = new Set(['primary'])

export const Button = forwardRef(function Button(
  { variant = 'primary', size, className = '', children, disabled, block = false, type = 'button', style, ...rest },
  ref
) {
  return (
    <GlassButton
      ref={ref}
      type={type}
      disabled={disabled}
      variant={FILLED.has(variant) ? 'filled' : 'glass'}
      destructive={variant === 'destructive'}
      className={`${size === 'lg' ? 'unf-btn-lg' : ''} ${className}`}
      style={block ? { width: '100%', ...style } : style}
      {...rest}
    >
      {children}
    </GlassButton>
  )
})

// A round glass icon button. `label` names it for screen readers and tooltips.
export const IconButton = forwardRef(function IconButton({ variant, size = 36, label, className = '', style, children, ...rest }, ref) {
  return (
    <GlassButton
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      icon={children}
      variant={variant === 'tint' ? 'filled' : 'glass'}
      className={className}
      style={{ width: size, height: size, minWidth: size, padding: 0, ...style }}
      {...rest}
    />
  )
})
