import type { ReactNode } from 'react'

/**
 * Status dot. Green (--color-success-open) when open / in stock, neutral when
 * closed. Used for "Зараз відкрито" and the "В наявності" marker.
 */
export function StatusDot({
  open = true,
  children,
  size = 'md',
}: {
  open?: boolean
  children?: ReactNode
  size?: 'sm' | 'md'
}) {
  const dot = size === 'sm' ? 'var(--space-4)' : 'var(--space-8)'
  return (
    <span className="inline-flex items-center" style={{ gap: 'var(--space-8)' }}>
      <span
        aria-hidden="true"
        style={{
          width: dot,
          height: dot,
          flexShrink: 0,
          borderRadius: 'var(--radius-full)',
          background: open ? 'var(--color-success-open)' : 'var(--color-neutral-400)',
        }}
      />
      {children != null ? (
        <span style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}>{children}</span>
      ) : null}
    </span>
  )
}
