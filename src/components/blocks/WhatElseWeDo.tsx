import Link from 'next/link'

import { MediaImage, type MediaLike } from '@/components/ui/MediaImage'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Що ще ми робимо" (DLSServicesWide export). Header (H2 left, lead right), a
 * wide establishing photo, then two service cards of equal height (the
 * .dls-svc-card utility). Each card: cover photo + bottom-left title; a
 * description that reveals on hover (always visible on touch / below lg) and a
 * round arrow link that turns red and rotates on hover. Texts/media from the
 * block. CSS-only interactions → server component.
 */
type Card = { title: string; text: string; image: MediaLike; link: string }

export function WhatElseWeDo({
  heading,
  text,
  wideImage,
  cards,
}: BlockComponentProps<'whatElseWeDo'>) {
  const list: Card[] = (cards ?? []).map((c) => ({
    title: c.title ?? '',
    text: c.text ?? '',
    image: c.image,
    link: c.link ?? '#',
  }))
  if (!wideImage && !list.length) return null

  return (
    <section
      aria-labelledby="wewd-h"
      className="bg-neutral-50 pt-[var(--space-64)] pb-[var(--space-64)] lg:pt-[var(--space-96)] lg:pb-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        {/* header: H2 left, lead right */}
        <div className="grid grid-cols-1 items-start gap-x-[var(--space-24)] gap-y-[var(--space-16)] md:grid-cols-12">
          <h2
            id="wewd-h"
            className="text-24 font-semibold md:col-span-6 md:text-28 lg:text-40"
            style={{ margin: 0, letterSpacing: '-0.02em', textWrap: 'balance' }}
          >
            {heading}
          </h2>
          {text ? (
            <p
              className="text-16 md:col-span-5 md:col-start-8"
              style={{
                margin: 0,
                lineHeight: 1.5,
                color: 'var(--color-neutral-600)',
                textWrap: 'pretty',
              }}
            >
              {text}
            </p>
          ) : null}
        </div>

        {/* wide establishing photo */}
        {wideImage ? (
          <div
            className="relative mt-[var(--space-32)] aspect-[4/3] overflow-hidden md:aspect-[16/9] lg:aspect-[21/9]"
            style={{ borderRadius: 'var(--radius-lg)', background: 'var(--color-neutral-200)' }}
          >
            <MediaImage media={wideImage} size="gallery" sizes="100vw" />
          </div>
        ) : null}

        {/* two service cards */}
        {list.length ? (
          <div className="mt-[var(--space-16)] grid grid-cols-1 gap-[var(--space-16)] md:mt-[var(--space-24)] md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)] md:gap-[var(--space-24)]">
            {list.map((c, i) => (
              <article
                key={i}
                className="group dls-svc-card overflow-hidden"
                style={{ borderRadius: 'var(--radius-lg)', background: 'var(--color-neutral-800)' }}
              >
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                  <MediaImage
                    media={c.image}
                    size="gallery"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
                {/* base gradient */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 bottom-0 left-0"
                  style={{
                    height: '50%',
                    background:
                      'linear-gradient(0deg, rgba(18,22,28,0.85) 0%, rgba(18,22,28,0) 100%)',
                  }}
                />
                {/* deeper gradient — always on below lg, hover-only above */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 bottom-0 left-0 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
                  style={{
                    height: '65%',
                    background:
                      'linear-gradient(0deg, rgba(18,22,28,0.95) 0%, rgba(18,22,28,0.7) 45%, rgba(18,22,28,0) 100%)',
                  }}
                />
                {/* title + revealed description */}
                <div className="pointer-events-none absolute bottom-[var(--space-16)] left-[var(--space-16)] flex flex-col right-[calc(2*var(--space-16)+var(--control-h-48))] md:bottom-[var(--space-24)] md:left-[var(--space-24)] md:right-[calc(2*var(--space-24)+var(--control-h-48))]">
                  <h3
                    className="text-20 md:text-24 wide:text-28"
                    style={{
                      margin: 0,
                      lineHeight: 1.2,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: 'var(--color-neutral-0)',
                      textWrap: 'balance',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.title}
                  </h3>
                  {c.text ? (
                    <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]">
                      <div className="min-h-0 overflow-hidden">
                        <p
                          className="text-16 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
                          style={{
                            margin: 0,
                            paddingTop: 'var(--space-12)',
                            lineHeight: 1.5,
                            color: 'rgba(252,252,253,0.85)',
                            textWrap: 'pretty',
                          }}
                        >
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
                {/* arrow link */}
                <Link
                  href={c.link}
                  aria-label={c.title}
                  className="absolute right-[var(--space-16)] bottom-[var(--space-16)] flex items-center justify-center transition-colors duration-300 md:right-[var(--space-24)] md:bottom-[var(--space-24)] lg:group-hover:bg-[var(--color-primary)] lg:group-hover:text-[var(--color-neutral-0)]"
                  style={{
                    width: 'var(--control-h-48)',
                    height: 'var(--control-h-48)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-neutral-0)',
                    color: 'var(--color-neutral-900)',
                  }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 lg:group-hover:-rotate-45"
                    style={{ width: 'var(--icon-20)', height: 'var(--icon-20)' }}
                  >
                    <path d="M5 12H19M13 6L19 12L13 18" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
