'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ProductCard, type ProductCardData } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import type { FavoritesData } from '@/lib/favorites'
import { viewedAdd, viewedItems } from '@/lib/viewed'

/**
 * «Ви дивилися» (DLSRecent) — a rail of recently-viewed products (localStorage).
 * On mount it snapshots the viewed SKUs (minus the current product), then records
 * the current one, and fetches the card data via /api/favorites (reused by SKU).
 * Hidden when there is nothing prior. Prev/next arrows on tablet+desktop.
 */
export function ProductRecent({ currentSku, locale }: { currentSku: string; locale: Locale }) {
  const [cards, setCards] = useState<ProductCardData[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    let alive = true
    const prior = viewedItems().filter((s) => s !== currentSku)
    viewedAdd(currentSku)
    if (!prior.length) return
    const qs = new URLSearchParams({ skus: prior.join(','), locale })
    fetch(`/api/favorites?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json() as Promise<FavoritesData>)
      .then((d) => {
        if (alive) setCards(d.cards)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 2)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])
  useEffect(() => {
    syncEdges()
  }, [cards, syncEdges])

  const scrollBy = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * (224 + 24), behavior: 'smooth' })

  if (!cards.length) return null

  return (
    <section aria-labelledby="pd-recent-title" className="dls-rct">
      <Container className="dls-rct__head">
        <h2 id="pd-recent-title" className="dls-rec__title">
          Ви дивилися
        </h2>
        <div className="dls-rct__arrows">
          <RecentArrow dir="prev" disabled={atStart} onClick={() => scrollBy(-1)} />
          <RecentArrow dir="next" disabled={atEnd} onClick={() => scrollBy(1)} />
        </div>
      </Container>
      <Container>
        <div ref={scrollRef} onScroll={syncEdges} className="dls-rec__rail">
          {cards.map((c) => (
            <div key={c.id} className="dls-rec__cardWrap">
              <ProductCard data={c} listId="recent" listName="Ви дивилися" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function RecentArrow({
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
      className="dls-rct__arrow"
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
