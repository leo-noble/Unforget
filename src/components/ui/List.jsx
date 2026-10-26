import { ChevronRight } from 'lucide-react'

// iOS inset-grouped lists: rounded sections of rows with hairline separators
// that start after the leading icon. Every list in the app is built from
// these two pieces so spacing, type and separators can't drift apart.

export function Section({
  title,
  footer,
  action,
  prominent = false,
  titleClassName = '',
  className = '',
  listClassName = '',
  children,
}) {
  return (
    <section className={className}>
      {title &&
        (prominent ? (
          <div className="flex items-end justify-between gap-3 px-1 mb-2.5">
            <h2 className={`text-title-3 font-bold ${titleClassName}`}>{title}</h2>
            {action}
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3 px-4 mb-1.5">
            <h3 className={`text-footnote uppercase tracking-[0.02em] text-label-2 ${titleClassName}`}>{title}</h3>
            {action}
          </div>
        ))}
      <div className={`ios-list bg-card rounded-cell overflow-hidden shadow-card ${listClassName}`}>{children}</div>
      {footer && <div className="text-footnote text-label-2 px-4 mt-2">{footer}</div>}
    </section>
  )
}

// Settings.app-style leading glyph: a white symbol on a coloured squircle.
export function RowIcon({ icon: Icon, color = 'var(--tint)', size = 30 }) {
  return (
    <span
      className="shrink-0 rounded-[8px] flex items-center justify-center text-white"
      style={{ width: size, height: size, background: color }}
      aria-hidden="true"
    >
      <Icon size={size * 0.56} strokeWidth={2.2} />
    </span>
  )
}

export function Row({
  icon,
  iconColor,
  leading,
  title,
  subtitle,
  detail,
  chevron = false,
  trailing,
  onClick,
  destructive = false,
  center = false,
  className = '',
  inset,
  children,
  ...rest
}) {
  const Comp = onClick ? 'button' : 'div'
  const hasLeading = !!(icon || leading)
  const insetPx = inset ?? (hasLeading ? 58 : 16)
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{ '--inset': `${insetPx}px` }}
      className={`w-full flex items-center gap-3 min-h-[52px] px-4 py-2.5 text-left ${
        onClick ? 'active:bg-fill transition-colors duration-75' : ''
      } ${center ? 'justify-center' : ''} ${className}`}
      {...rest}
    >
      {icon && <RowIcon icon={icon} color={iconColor} />}
      {leading}
      {children ?? (
        <span className={`min-w-0 ${center ? '' : 'flex-1'}`}>
          <span
            className={`block text-body truncate ${destructive ? 'text-red' : center ? 'text-tint' : 'text-label'}`}
          >
            {title}
          </span>
          {subtitle && <span className="block text-subhead text-label-2 truncate mt-0.5">{subtitle}</span>}
        </span>
      )}
      {detail != null && <span className="shrink-0 text-body text-label-2 tabular">{detail}</span>}
      {trailing}
      {chevron && <ChevronRight size={18} className="shrink-0 text-label-3 -mr-1" strokeWidth={2.4} />}
    </Comp>
  )
}
