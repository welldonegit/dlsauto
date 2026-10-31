import type { ReactNode } from 'react'

/**
 * Section heading. One H2 token/weight everywhere (responsive 24→28→40,
 * semibold). Optional eyebrow (uppercase label) and numbered step H3
 * ("01 Оберіть марку", PROJECT_CONTEXT §2). The vertical gaps (H2→content
 * space-32/24, H2→H3 space-32, H3→content space-16) are applied by the
 * consumer via the layout rule; this renders only the text block.
 */
export function SectionHeading({
  children,
  eyebrow,
  step,
  as: As = 'h2',
}: {
  children: ReactNode
  eyebrow?: string
  step?: { num: string; title: ReactNode }
  as?: 'h1' | 'h2'
}) {
  const sizeClass = As === 'h1' ? 'text-32 wide:text-40' : 'text-24 md:text-28 wide:text-40'
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-16)' }}>
      {eyebrow ? (
        <span
          className="font-semibold uppercase"
          style={{
            fontSize: 'var(--text-13)',
            letterSpacing: '0.08em',
            color: 'var(--color-primary)',
          }}
        >
          {eyebrow}
        </span>
      ) : null}
      <As className={sizeClass} style={{ margin: 0 }}>
        {children}
      </As>
      {step ? <StepHeading num={step.num} title={step.title} /> : null}
    </div>
  )
}

/** Numbered step subheading — "01 Оберіть марку". */
export function StepHeading({ num, title }: { num: string; title: ReactNode }) {
  return (
    <h3
      className="flex items-baseline font-semibold"
      style={{ gap: 'var(--space-12)', fontSize: 'var(--text-20)', margin: 0 }}
    >
      <span style={{ color: 'var(--color-primary)' }}>{num}</span>
      <span style={{ color: 'var(--color-neutral-900)' }}>{title}</span>
    </h3>
  )
}
