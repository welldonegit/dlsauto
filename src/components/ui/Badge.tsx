import type { ReactNode } from 'react'

/**
 * Pill badge. "Нове" / "Популярне" are neutral; "−N%" is primary
 * (PROJECT_CONTEXT §3). Independent of the running-frame / holiday-sticker
 * slots on a product card.
 */
export type BadgeVariant = 'neutral' | 'primary' | 'success'

const STYLES: Record<BadgeVariant, { background: string; color: string }> = {
  neutral: { background: 'var(--color-neutral-900)', color: 'var(--color-neutral-0)' },
  primary: { background: 'var(--color-primary)', color: 'var(--color-neutral-0)' },
  success: { background: 'var(--color-success-tint)', color: 'var(--color-success)' },
}

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode
  variant?: BadgeVariant
}) {
  return (
    <span
      className="inline-flex items-center justify-center font-sans font-semibold"
      style={{
        height: 'var(--control-h-32)',
        padding: '0 var(--space-12)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-12)',
        lineHeight: 1,
        ...STYLES[variant],
      }}
    >
      {children}
    </span>
  )
}
