import { SectionHeading, StepHeading } from '@/components/ui/SectionHeading'
import { Container, Section } from '@/components/ui/layout'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Чому розбірка, а не магазин" (STAGE_3A §3, PROJECT_CONTEXT §5). Numbered
 * steps 01–03 using the existing StepHeading (same numbered style as
 * "01 Оберіть марку"). H2 on top, steps in a responsive grid. Server component.
 */
export function WhyDisassembly({ heading, items }: BlockComponentProps<'whyDisassembly'>) {
  const steps = (items ?? []).filter((it) => it.title || it.text)
  if (!steps.length) return null
  return (
    <Section aria-label={heading ?? 'Чому розбірка, а не магазин'}>
      <Container>
        {heading ? <SectionHeading>{heading}</SectionHeading> : null}
        <div
          className="grid grid-cols-1 gap-[var(--space-32)] md:grid-cols-3 lg:gap-[var(--space-48)]"
          style={{ marginTop: 'var(--space-32)' }}
        >
          {steps.map((s, i) => (
            <div key={s.id ?? i} className="flex min-w-0 flex-col">
              <StepHeading num={s.step ?? String(i + 1).padStart(2, '0')} title={s.title ?? ''} />
              {s.text ? (
                <p
                  className="text-14 md:text-16 wide:text-18"
                  style={{
                    margin: 'var(--space-16) 0 0',
                    color: 'var(--color-neutral-600)',
                    textWrap: 'pretty',
                  }}
                >
                  {s.text}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
