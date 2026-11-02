import { SectionHeading } from '@/components/ui/SectionHeading'
import { Stars } from '@/components/ui/Stars'
import { Container, Section } from '@/components/ui/layout'
import { getReviews } from '@/lib/data'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Відгуки" (STAGE_3A §3). Published site reviews from the collection with the
 * computed average over all published. Submission and the full-list page belong
 * to a later stage (like the stage-1 contact form, writes are not wired yet);
 * this block is read-only per the stage-3a scope. Async server component.
 */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

export async function ReviewsBlock({ heading, limit }: BlockComponentProps<'reviewsBlock'>) {
  const { reviews, average, count } = await getReviews(limit ?? 8)
  if (!reviews.length) return null
  const avgLabel = average.toFixed(1).replace('.', ',')

  return (
    <Section aria-label={heading ?? 'Відгуки'}>
      <Container>
        <div
          className="flex flex-wrap items-start justify-between"
          style={{ gap: 'var(--space-24)' }}
        >
          <SectionHeading>{heading ?? 'Відгуки покупців'}</SectionHeading>
          <div className="flex items-center" style={{ gap: 'var(--space-12)' }}>
            <span
              className="text-32"
              style={{ lineHeight: 1, fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              {avgLabel}
            </span>
            <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
              <Stars
                rating={Math.round(average)}
                size="20"
                label={`Середня оцінка ${avgLabel} з 5`}
              />
              <span className="text-14" style={{ color: 'var(--color-neutral-600)' }}>
                На основі {count} {pluralReviews(count)}
              </span>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 gap-[var(--space-16)] md:grid-cols-2 lg:grid-cols-3"
          style={{ marginTop: 'var(--space-48)' }}
        >
          {reviews.map((r) => (
            <article
              key={r.id}
              className="flex flex-col"
              style={{
                padding: 'var(--space-24)',
                background: 'var(--color-neutral-white)',
                border: 'var(--border-hairline) solid var(--color-neutral-200)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <p className="text-14" style={{ margin: 0, fontWeight: 600 }}>
                {r.author}
              </p>
              <div style={{ marginTop: 'var(--space-8)' }}>
                <Stars rating={r.rating} size="16" label={`Оцінка ${r.rating} з 5`} />
              </div>
              <p
                className="text-16"
                style={{
                  margin: 'var(--space-16) 0 0',
                  lineHeight: 1.5,
                  textWrap: 'pretty',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 5,
                  overflow: 'hidden',
                }}
              >
                {r.text}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-24)' }}>
                <div
                  className="flex flex-wrap items-center justify-between"
                  style={{
                    paddingTop: 'var(--space-16)',
                    borderTop: 'var(--border-hairline) solid var(--color-neutral-200)',
                    gap: 'var(--space-8) var(--space-16)',
                  }}
                >
                  <span
                    className="flex items-center text-13"
                    style={{ gap: 'var(--space-4)', color: 'var(--color-neutral-600)' }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{
                        width: 'var(--icon-16)',
                        height: 'var(--icon-16)',
                        flexShrink: 0,
                        fill: 'none',
                        stroke: 'var(--color-success)',
                        strokeWidth: 2,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Підтверджена покупка
                  </span>
                  <time
                    dateTime={r.createdAt}
                    className="text-13"
                    style={{ color: 'var(--color-neutral-600)' }}
                  >
                    {formatDate(r.createdAt)}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function pluralReviews(n: number): string {
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return 'відгук'
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'відгуки'
  return 'відгуків'
}
