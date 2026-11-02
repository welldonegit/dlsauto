import { SectionHeading } from '@/components/ui/SectionHeading'
import { MediaImage } from '@/components/ui/MediaImage'
import { Container, Section } from '@/components/ui/layout'
import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Команда і цех" (STAGE_3A §3). A large workshop photo plus a grid of team
 * photos. The model has no per-person fields, so captions come from each
 * photo's alt (the work it shows) — we don't invent names. Photos are
 * placeholders from the export. Server component.
 *
 * Convention: the first photo is the large workshop shot, the rest the grid.
 */
export function TeamBlock({ heading, photos }: BlockComponentProps<'team'>) {
  const list = (photos ?? []).filter((p): p is Media => typeof p === 'object' && p !== null)
  if (!list.length) return null
  const [lead, ...people] = list

  return (
    <Section aria-label={heading ?? 'Команда і цех'}>
      <Container>
        {heading ? <SectionHeading>{heading}</SectionHeading> : null}
        <div
          className="grid grid-cols-1 gap-[var(--space-24)] lg:grid-cols-2"
          style={{ marginTop: 'var(--space-32)' }}
        >
          <figure
            className="relative m-0 overflow-hidden lg:sticky"
            style={{
              top: 'var(--space-24)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-neutral-200)',
              aspectRatio: '4 / 3',
            }}
          >
            <MediaImage media={lead} size="gallery" sizes="(min-width: 1024px) 50vw, 100vw" />
            {lead.alt ? <Caption>{lead.alt}</Caption> : null}
          </figure>

          {people.length ? (
            <div className="grid min-w-0 grid-cols-2 gap-[var(--space-16)] md:grid-cols-3 lg:grid-cols-2">
              {people.map((p) => (
                <figure
                  key={p.id}
                  className="relative m-0 overflow-hidden"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-neutral-200)',
                    aspectRatio: '1 / 1',
                  }}
                >
                  <MediaImage
                    media={p}
                    size="card"
                    alt=""
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="transition-transform duration-300 hover:scale-[1.03]"
                  />
                  {p.alt ? <Caption>{p.alt}</Caption> : null}
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  )
}

/** Glass caption chip, bottom-left of a photo. */
function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption
      className="pointer-events-none absolute text-14"
      style={{
        left: 'var(--space-16)',
        bottom: 'var(--space-16)',
        maxWidth: 'calc(100% - 2 * var(--space-16))',
        padding: 'var(--space-4) var(--space-12)',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(252,252,253,0.15)',
        backdropFilter: 'blur(0.75rem)',
        WebkitBackdropFilter: 'blur(0.75rem)',
        fontWeight: 500,
        color: 'var(--color-neutral-0)',
      }}
    >
      {children}
    </figcaption>
  )
}
