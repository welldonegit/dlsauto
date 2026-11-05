import { MediaImage } from '@/components/ui/MediaImage'
import { Container } from '@/components/ui/layout'
import { getBrands, getModelsByBrand } from '@/lib/data'
import { modelLabel } from '@/lib/rules'
import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'
import { HeroCarPicker, type PickerBrand } from './HeroCarPicker'

/**
 * Home first screen, variant B ("Перший екран B", Головна-B export). Two columns
 * over a photo with a left-to-right dark gradient: the headline, lede and four
 * trust tiles on the left, the "Підібрати за моїм авто" car picker on the right.
 * The static column is server-rendered; only the interactive picker is a client
 * component. Variant A is not built this stage — any other variant renders
 * nothing.
 *
 * Brands and their models (with in-stock part counts) come from Payload. Texts
 * and the four tiles come from the block.
 */

const ICONS: Record<string, React.ReactNode> = {
  tread: (
    <g>
      <path d="M5 3V21M19 3V21" />
      <path d="M7.5 4.5L12 7L16.5 4.5M7.5 9L12 11.5L16.5 9M7.5 13.5L12 16L16.5 13.5M7.5 18L12 20.5L16.5 18" />
    </g>
  ),
  wrench: (
    <g>
      <path
        transform="translate(12 12) rotate(45) scale(0.85) translate(-12 -12)"
        vectorEffect="non-scaling-stroke"
        d="M9.5 10.33A5 5 0 0 1 10.5 1.23L10.5 5L13.5 5L13.5 1.23A5 5 0 0 1 14.5 10.33L14.5 20.5A2.5 2.5 0 0 1 9.5 20.5Z"
      />
      <path d="M8.3 14.5L9.3 15.5L11 13.7" />
    </g>
  ),
  star: (
    <path d="M12 3.5L14.6 8.8L20.4 9.6L16.2 13.7L17.2 19.5L12 16.8L6.8 19.5L7.8 13.7L3.6 9.6L9.4 8.8Z" />
  ),
  speed: (
    <g>
      <path d="M5.07 17A8 8 0 1 1 18.93 17" />
      <path d="M5.07 9L6.8 10M12 5V7M18.93 9L17.2 10" />
      <path d="M12 13L16.2 9.5" />
      <circle cx="12" cy="13" r="1" />
    </g>
  ),
}

function logoUrl(logo: number | Media | null | undefined): string | null {
  return logo && typeof logo === 'object' ? (logo.url ?? null) : null
}

export async function HeroBlock({
  variant,
  heading,
  subheading,
  background,
  tiles,
  locale,
}: BlockComponentProps<'hero'>) {
  if (variant !== 'b') return null

  const brandsRaw = await getBrands()
  const brands: PickerBrand[] = await Promise.all(
    brandsRaw.map(async (b) => {
      const slug = b.slug ?? ''
      const models = slug ? await getModelsByBrand(slug, locale) : []
      return {
        slug,
        name: b.name,
        logo: logoUrl(b.logoMono),
        models: models
          .filter((m) => m.slug)
          .map((m) => ({ slug: m.slug as string, label: modelLabel(m), partsCount: m.partsCount })),
      }
    }),
  )

  const tileList = (tiles ?? []).filter((t) => t.value || t.caption)

  return (
    <section
      aria-labelledby="heroB-h1"
      className="relative isolate"
      style={{ background: 'var(--color-neutral-950)', color: 'var(--color-neutral-0)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: -1 }}
      >
        <MediaImage
          media={background}
          size="gallery"
          alt=""
          priority
          sizes="100vw"
          style={{ objectPosition: 'right center' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,22,28,0.85) 0%, rgba(18,22,28,0.65) 45%, rgba(18,22,28,0.3) 100%)',
          }}
        />
      </div>

      <Container className="grid grid-cols-1 items-center gap-[var(--space-48)] pt-[var(--space-64)] pb-[var(--space-64)] lg:grid-cols-[minmax(0,52fr)_minmax(0,48fr)] lg:pb-[var(--space-128)] wide:gap-[var(--space-64)]">
        {/* left: headline, lede, trust tiles */}
        <div className="flex min-w-0 flex-col items-start">
          <h1
            id="heroB-h1"
            className="text-32 md:text-40 wide:text-d"
            style={{
              margin: 0,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--color-neutral-0)',
              textWrap: 'balance',
            }}
          >
            {heading}
          </h1>
          {subheading ? (
            <p
              className="text-16 md:text-18 mt-[var(--space-16)]"
              style={{
                margin: 'var(--space-16) 0 0',
                maxWidth: '35rem',
                lineHeight: 1.5,
                color: 'rgba(252,252,253,0.8)',
                textWrap: 'pretty',
              }}
            >
              {subheading}
            </p>
          ) : null}
          {tileList.length ? (
            <ul className="m-0 mt-[var(--space-32)] flex w-auto list-none flex-wrap justify-start gap-[var(--space-8)] p-0 max-md:grid max-md:w-full max-md:grid-cols-2">
              {tileList.map((t, i) => (
                <li
                  key={t.id ?? i}
                  className="box-border flex flex-none items-start gap-[var(--space-8)] rounded-[var(--radius-sm)] p-[var(--space-12)] backdrop-blur-[1.5rem] transition-colors duration-200 ease-out bg-[rgba(252,252,253,0.06)] hover:bg-[rgba(252,252,253,0.1)]"
                  style={{ boxShadow: 'inset 0 var(--border-hairline) 0 rgba(252,252,253,0.25)' }}
                >
                  <span className="flex flex-none pt-[var(--space-2)]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{
                        width: 'var(--icon-20)',
                        height: 'var(--icon-20)',
                        fill: 'none',
                        stroke: 'var(--color-neutral-0)',
                        strokeWidth: 1.5,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }}
                    >
                      {ICONS[t.icon ?? 'tread']}
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <b
                      className="text-16"
                      style={{
                        lineHeight: 1.4,
                        fontWeight: 600,
                        color: 'var(--color-neutral-0)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.value}
                    </b>
                    <span
                      className="text-14"
                      style={{ lineHeight: 1.4, color: 'rgba(252,252,253,0.6)' }}
                    >
                      {t.caption}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* right: car picker */}
        <HeroCarPicker brands={brands} locale={locale} />
      </Container>
    </section>
  )
}
