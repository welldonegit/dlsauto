import type { IconSize } from './icons'

/**
 * Star rating (PROJECT_CONTEXT §3, reviews). Five stars, primary fill up to the
 * rating, neutral outline beyond. Decorative by default; pass `label` to expose
 * it as an image to assistive tech.
 */
export function Stars({
  rating,
  size = '16',
  label,
}: {
  rating: number
  size?: IconSize
  label?: string
}) {
  const dim = `var(--icon-${size})`
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="flex"
      style={{ gap: 'var(--space-2)' }}
    >
      {[0, 1, 2, 3, 4].map((k) => {
        const on = k < rating
        return (
          <svg
            key={k}
            viewBox="0 0 24 24"
            style={{
              width: dim,
              height: dim,
              display: 'block',
              flexShrink: 0,
              fill: on ? 'var(--color-primary)' : 'none',
              stroke: on ? 'var(--color-primary)' : 'var(--color-neutral-300)',
              strokeWidth: 1.5,
              strokeLinejoin: 'round',
            }}
          >
            <path d="M11.53 2.3a.53.53 0 0 1 .94 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.02a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.9l5.16-.76a2.12 2.12 0 0 0 1.6-1.16z" />
          </svg>
        )
      })}
    </div>
  )
}
