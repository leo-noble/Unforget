import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { press, snappy } from './motion'

const VARIANT = {
  // Near-black: one per screen, for the thing you came to do.
  primary: 'tint-fill text-tint-fg hover:opacity-90',
  // Grey: secondary actions that sit beside a primary.
  tinted: 'bg-fill-2 text-label hover:bg-fill',
  gray: 'bg-fill-2 text-label hover:bg-fill',
  glass: 'glass text-label hover:bg-fill',
  plain: 'text-label hover:bg-fill',
  destructive: 'bg-negative/10 text-negative',
}

const SIZE = {
  lg: 'h-11 px-5 text-body font-medium gap-2',
  md: 'h-9 px-4 text-subhead font-medium gap-1.5',
  sm: 'h-8 px-3 text-footnote font-medium gap-1.5',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, disabled, block = false, type = 'button', ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : press}
      transition={snappy}
      className={`inline-flex items-center justify-center rounded-full select-none whitespace-nowrap transition-opacity disabled:opacity-40 ${
        VARIANT[variant]
      } ${SIZE[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
})

const ICON_VARIANT = {
  glass: 'text-label-2 hover:text-label hover:bg-fill',
  tint: 'glass-tint',
  fill: 'bg-fill text-label-2 hover:text-label',
  plain: 'text-label-2 hover:text-label',
}

// Square toolbar button.
export const IconButton = forwardRef(function IconButton(
  { variant = 'glass', size = 36, label, className = '', style, children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.94 }}
      transition={snappy}
      style={{ width: size, height: size, ...style }}
      className={`inline-flex items-center justify-center rounded-control shrink-0 select-none disabled:opacity-40 ${ICON_VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
})
