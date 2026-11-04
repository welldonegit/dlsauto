import { SectionHeading } from '@/components/ui/SectionHeading'
import { MediaImage } from '@/components/ui/MediaImage'
import { Container, Section } from '@/components/ui/layout'
import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Хто розбирає ваше авто" (DLSTeam export). A wide workshop photo with a
 * location caption, then a grid of people (photo + name + role). On desktop the
 * wide photo is a square that sticks beside the 2×3 people grid; it reflows to a
 * banner above the grid on smaller screens. Names/roles come from the block.
 * Server component.
 */
type Member = NonNullable<BlockComponentProps<'team'>['members']>[number]

const asMedia = (v: unknown): Media | null => (v && typeof v === 'object' ? (v as Media) : null)

export function TeamBlock({ heading, lead, leadCaption, members }: BlockComponentProps<'team'>) {
  const leadMedia = asMedia(lead)
  const people = (members ?? []).filter((m): m is Member => !!m)
  if (!leadMedia && !people.length) return null

  return (
    <Section aria-label={heading ?? 'Хто розбирає ваше авто'}>
      <Container>
        {heading ? <SectionHeading>{heading}</SectionHeading> : null}
        <div
          className="grid grid-cols-1 gap-[var(--space-16)] md:gap-[var(--space-24)] wide:grid-cols-2"
          style={{ marginTop: 'var(--space-32)' }}
        >
          {leadMedia ? (
            <div className="min-w-0">
              <figure
                className="relative m-0 aspect-[4/3] overflow-hidden md:aspect-[16/9] lg:aspect-[16/10] wide:sticky wide:aspect-square"
                style={{
                  top: 'var(--space-24)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-neutral-200)',
                }}
              >
                <MediaImage
                  media={leadMedia}
                  size="gallery"
                  sizes="(min-width: 1360px) 50vw, 100vw"
                />
                {leadCaption ? (
                  <Caption pad="var(--space-4) var(--space-12)">{leadCaption}</Caption>
                ) : null}
              </figure>
            </div>
          ) : null}

          {people.length ? (
            <div className="grid min-w-0 grid-cols-2 gap-[var(--space-16)] md:grid-cols-3 md:gap-[var(--space-24)] lg:grid-cols-2">
              {people.map((p, i) => {
                const photo = asMedia(p.photo)
                return (
                  <figure
                    key={p.id ?? i}
                    className="relative m-0 aspect-square overflow-hidden"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-neutral-200)',
                    }}
                  >
                    {photo ? (
                      <MediaImage
                        media={photo}
                        size="card"
                        alt={p.name ?? ''}
                        sizes="(min-width: 1360px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="transition-transform duration-300 hover:scale-[1.03]"
                      />
                    ) : null}
                    {p.name || p.role ? (
                      <Caption pad="var(--space-8) var(--space-12)">
                        {p.name ? (
                          <span
                            className="text-16 wide:text-18"
                            style={{ lineHeight: 1.3, fontWeight: 600 }}
                          >
                            {p.name}
                          </span>
                        ) : null}
                        {p.role ? (
                          <span
                            className="text-14"
                            style={{ lineHeight: 1.4, fontWeight: 500, textWrap: 'pretty' }}
                          >
                            {p.role}
                          </span>
                        ) : null}
                      </Caption>
                    ) : null}
                  </figure>
                )
              })}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  )
}

/** Glass caption chip, bottom-left of a photo. */
function Caption({ children, pad }: { children: React.ReactNode; pad: string }) {
  return (
    <figcaption
      className="pointer-events-none absolute flex flex-col text-14"
      style={{
        left: 'var(--space-16)',
        bottom: 'var(--space-16)',
        gap: 'var(--space-2)',
        maxWidth: 'calc(100% - 2 * var(--space-16))',
        padding: pad,
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
