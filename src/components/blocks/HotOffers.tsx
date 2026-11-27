'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Container } from '@/components/ui/layout'

/**
 * «Гарячі пропозиції» (home banner slider, Р55 — DLSAuto-Головна-B export). A
 * horizontal snap-rail of 1040×480 (≈2.17:1) banner cards: ~1 card + peek on
 * mobile, 3 on tablet, 4 on desktop; 16px radius applied by the site; prev/next
 * arrows on tablet+desktop. Each card is an uploaded image; until one is set it
 * shows the dark placeholder with the title + subtitle (export demo state). The
 * link is optional — with it the card is a link, without it a static tile.
 */
export type HotOfferCard = {
  src: string | null
  title: string
  subtitle: string
  href: string | null
}

export function HotOffers({ heading, items }: { heading: string; items: HotOfferCard[] }) {
  const railRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncEdges = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 2)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])
  useEffect(() => {
    syncEdges()
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [syncEdges])

  const scrollBy = (dir: number) => {
    const el = railRef.current
    const step = el?.firstElementChild
      ? el.firstElementChild.getBoundingClientRect().width + 24
      : 320
    // Honour prefers-reduced-motion: the JS `behavior` option overrides the CSS
    // `scroll-behavior: auto` the global reduced-motion reset sets, so branch here.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el?.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' })
  }

  if (!items.length) return null

  return (
    <section aria-labelledby="hot-title" className="dls-hot">
      <Container className="dls-hot__head">
        <h2 id="hot-title" className="dls-hot__title">
          {heading}
        </h2>
        <div className="dls-hot__arrows">
          <HotArrow dir="prev" disabled={atStart} onClick={() => scrollBy(-1)} />
          <HotArrow dir="next" disabled={atEnd} onClick={() => scrollBy(1)} />
        </div>
      </Container>
      <Container>
        <div ref={railRef} onScroll={syncEdges} className="dls-hot__rail">
          {items.map((c, i) => {
            const inner = c.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- banner image (1040×480)
              <img src={c.src} alt={c.title} className="dls-hot__img" />
            ) : (
              <span className="dls-hot__ph">
                <span className="dls-hot__phTitle">{c.title}</span>
                {c.subtitle ? <span className="dls-hot__phSub">{c.subtitle}</span> : null}
              </span>
            )
            const label = c.title || 'Банер'
            return c.href ? (
              <Link key={i} href={c.href} aria-label={label} className="dls-hot__card">
                {inner}
              </Link>
            ) : (
              <div key={i} className="dls-hot__card" role="img" aria-label={label}>
                {inner}
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function HotArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Попередні' : 'Наступні'}
      className="dls-hot__arrow"
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path
          d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
