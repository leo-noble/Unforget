import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { press, snappy } from './motion'

const VARIANT = {
  // Filled with the accent — one per screen, for the thing you came to do.
  primary: 'tint-fill text-tint-fg',
  // Accent text on a soft accent wash — iOS's "tinted" button style.
  tinted: 'bg-tint/15 text-tint',
  // Neutral fill — secondary actions that sit beside a primary.
  gray: 'bg-fill text-label',
  glass: 'glass text-label',
  plain: 'text-tint',
  destructive: 'bg-red/10 text-red',
}

const SIZE = {
  lg: 'h-[52px] px-6 text-headline font-medium gap-2',
  md: 'h-11 px-5 text-subhead font-medium gap-1.5',
  sm: 'h-[34px] px-3.5 text-footnote font-medium gap-1.5',
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
      className={`inline-flex items-center justify-center rounded-capsule select-none whitespace-nowrap transition-opacity disabled:opacity-40 ${
        VARIANT[variant]
      } ${SIZE[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
})

const ICON_VARIANT = {
  glass: 'glass text-label',
  tint: 'glass-tint',
  fill: 'bg-fill text-label-2',
  plain: 'text-tint',
}

// Round toolbar button — iOS 26's floating glass circle.
export const IconButton = forwardRef(function IconButton(
  { variant = 'glass', size = 44, label, className = '', style, children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      transition={snappy}
      style={{ width: size, height: size, ...style }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 select-none disabled:opacity-40 ${ICON_VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
})
