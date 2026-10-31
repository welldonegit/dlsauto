import type { CSSProperties, ElementType, ReactNode } from 'react'

/**
 * Layout primitives. One container width, one vertical-rhythm rule
 * (PROJECT_CONTEXT §2): space-96 between sections on desktop, space-64 on
 * mobile; the first section sits space-24 under the header. Full-bleed bands
 * add that same value inside and outside the band.
 */

/**
 * Centered content column. Reproduces the export: inner content is capped at
 * --container-max with side padding 16 / 32 / 64 (mobile / ≥768 / ≥1360) added
 * outside the cap, so the content box stays constant regardless of padding.
 */
export function Container({
  children,
  className = '',
  style,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: ElementType
}) {
  return (
    <As
      className={[
        'mx-auto w-full box-border',
        '[--dls-pad:var(--space-16)] md:[--dls-pad:var(--space-32)] wide:[--dls-pad:var(--space-64)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        maxWidth: 'calc(var(--container-max) + 2 * var(--dls-pad))',
        paddingInline: 'var(--dls-pad)',
        ...style,
      }}
    >
      {children}
    </As>
  )
}

/**
 * A page section with the vertical-rhythm rule baked in. `band` paints a
 * full-width background; `padTop="header"` is the first section under the
 * header (space-24 instead of a full section gap).
 */
export function Section({
  children,
  band = false,
  padTop = 'section',
  className = '',
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  band?: boolean
  padTop?: 'section' | 'header'
  className?: string
  'aria-label'?: string
}) {
  const topClass =
    padTop === 'header' ? 'pt-[var(--space-24)]' : 'pt-[var(--space-64)] lg:pt-[var(--space-96)]'
  return (
    <section
      aria-label={ariaLabel}
      className={[
        topClass,
        'pb-[var(--space-64)] lg:pb-[var(--space-96)]',
        band ? 'bg-neutral-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  )
}

/** Thin wrapper over CSS grid with a token gap; columns supplied by the caller. */
export function Grid({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={['grid', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  )
}
