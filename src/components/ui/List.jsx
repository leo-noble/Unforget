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
          <div className="flex items-center justify-between gap-3 px-0.5 mb-2.5 min-h-6">
            <h2 className={`text-subhead font-medium text-label ${titleClassName}`}>{title}</h2>
            {action}
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3 px-0.5 mb-2">
            <h3 className={`text-footnote font-medium text-label-2 ${titleClassName}`}>{title}</h3>
            {action}
          </div>
        ))}
      <div className={`ios-list bg-card rounded-cell overflow-hidden ${listClassName}`}>{children}</div>
      {footer && <div className="text-footnote text-label-2 px-4 mt-2">{footer}</div>}
    </section>
  )
}

// Leading glyph: a plain outline icon in grey, no chip behind it.
export function RowIcon({ icon: Icon, size = 20 }) {
  return (
    <span className="shrink-0 flex items-center justify-center text-label-2" style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={17} strokeWidth={1.6} />
    </span>
  )
}

export function Row({
  icon,
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
  const insetPx = inset ?? (hasLeading ? 48 : 16)
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{ '--inset': `${insetPx}px` }}
      className={`w-full flex items-center gap-3 min-h-[44px] px-4 py-2 text-left ${
        onClick ? 'hover:bg-fill active:bg-fill transition-colors duration-75' : ''
      } ${center ? 'justify-center' : ''} ${className}`}
      {...rest}
    >
      {icon && <RowIcon icon={icon} />}
      {leading}
      {children ?? (
        <span className={`min-w-0 ${center ? '' : 'flex-1'}`}>
          <span
            className={`block text-body truncate ${destructive ? 'text-negative' : 'text-label'}`}
          >
            {title}
          </span>
          {subtitle && <span className="block text-footnote text-label-2 truncate">{subtitle}</span>}
        </span>
      )}
      {detail != null && <span className="shrink-0 text-subhead text-label-2 tabular">{detail}</span>}
      {trailing}
      {chevron && <ChevronRight size={16} className="shrink-0 text-label-3 -mr-1" strokeWidth={2} />}
    </Comp>
  )
}
