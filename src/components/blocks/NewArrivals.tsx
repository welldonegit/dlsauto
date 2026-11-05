'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ProductCard, type ProductCardData } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
import { useSelectedCar } from '@/lib/selectedCar'

/**
 * "Нові надходження" (DLSNewArrivals export). A category tablist over a
 * full-bleed horizontal snap-carousel of ProductCards (224px wide); the first
 * card aligns with the content column and the row can scroll into the gutters.
 * Switching tabs cross-fades the row; prev/next arrows (desktop/tablet) disable
 * at the edges. The row reserves bottom room so the card's hover "Характеристики"
 * panel is never clipped.
 *
 * Deferred: the car-fit filter ("Показуємо новинки на …") and the seasonal
 * decals — both are inert at the current state (no car cookie, season = none)
 * and land with the car selector / festive assets (see stage batch).
 */

export type ArrivalCard = ProductCardData & { cat: string }

export function NewArrivals({
  title,
  allHref,
  tabs,
  cards,
}: {
  title: string
  allHref: string
  tabs: { key: string; label: string }[]
  cards: ArrivalCard[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState('all')
  const [fading, setFading] = useState(false)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [ignoreCar, setIgnoreCar] = useState(false)
  const fadeT = useRef<ReturnType<typeof setTimeout>>(undefined)

  const car = useSelectedCar()
  // A newly chosen car re-applies the filter and resets the row (render-phase
  // derived-state reset — the React-recommended way, no effect needed).
  const [prevCar, setPrevCar] = useState(car)
  if (car !== prevCar) {
    setPrevCar(car)
    setIgnoreCar(false)
    setTab('all')
  }
  const activeCar = car && !ignoreCar ? car : null
  // Car selected → only parts that fit it; "Показати всі" drops the filter.
  const pool = activeCar ? cards.filter((c) => c.modelSlug === activeCar.slug) : cards
  const shown = tab === 'all' ? pool : pool.filter((c) => c.cat === tab)

  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 2)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    syncEdges()
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [syncEdges])

  // reset scroll + edges when the visible set changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
    syncEdges()
  }, [tab, syncEdges])

  useEffect(() => () => clearTimeout(fadeT.current), [])

  const pickTab = (key: string) => {
    if (key === tab || fading) return
    setFading(true)
    clearTimeout(fadeT.current)
    fadeT.current = setTimeout(() => {
      setTab(key)
      setFading(false)
    }, 200)
  }

  // one card (224) + gap (24)
  const scrollBy = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * (224 + 24), behavior: 'smooth' })

  return (
    <section
      aria-labelledby="arrivals-title"
      className="bg-neutral-50 pt-[var(--space-64)] lg:pt-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border flex w-full items-start justify-between gap-[var(--space-24)] px-[var(--space-16)] max-md:flex-col md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <h2
          id="arrivals-title"
          className="text-24 md:text-28 wide:text-40"
          style={{
            margin: 0,
            minWidth: 0,
            lineHeight: 1.15,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-neutral-900)',
            textWrap: 'balance',
          }}
        >
          {title}
        </h2>
        <div className="flex shrink-0 items-center">
          <Button variant="secondary" size="md" href={allHref}>
            Усі надходження
          </Button>
        </div>
      </div>

      {/* category tabs */}
      <div
        className="mx-auto mt-[var(--space-24)] box-border w-full px-[var(--space-16)] md:mt-[var(--space-32)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Категорії новинок"
          className="flex gap-[var(--space-8)] overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {tabs.map((t) => {
            const on = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pickTab(t.key)}
                className="flex h-[var(--control-h-40)] shrink-0 cursor-pointer items-center whitespace-nowrap rounded-[var(--radius-sm)] border-[length:var(--border-hairline)] border-solid px-[var(--space-16)] text-14 transition-colors duration-200 ease-[var(--ease-brand)]"
                style={{
                  boxSizing: 'border-box',
                  fontWeight: 500,
                  background: on ? 'var(--color-neutral-900)' : 'var(--color-neutral-0)',
                  color: on ? 'var(--color-neutral-0)' : 'var(--color-neutral-900)',
                  borderColor: on ? 'var(--color-neutral-900)' : 'var(--color-neutral-200)',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        {activeCar ? (
          <p
            className="mt-[var(--space-12)] text-14"
            style={{ margin: 'var(--space-12) 0 0', color: 'var(--color-neutral-600)' }}
          >
            Показуємо новинки на {activeCar.label} ·{' '}
            <button
              type="button"
              onClick={() => setIgnoreCar(true)}
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-14 underline"
              style={{ color: 'var(--color-neutral-900)', textUnderlineOffset: '0.1875rem' }}
            >
              Показати всі
            </button>
          </p>
        ) : null}
      </div>

      {/* carousel */}
      <div style={{ opacity: fading ? 0 : 1, transition: 'opacity var(--duration-200) ease-out' }}>
        {shown.length ? (
          <div
            ref={scrollRef}
            onScroll={syncEdges}
            className="flex items-stretch gap-[var(--space-24)] overflow-x-auto [--dls-pad:var(--space-16)] md:[--dls-pad:var(--space-32)] wide:[--dls-pad:var(--space-64)]"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              paddingTop: 'var(--space-24)',
              paddingBottom: '10.5rem',
              paddingInline: 'max(var(--dls-pad), calc((100% - var(--container-max)) / 2))',
              scrollPaddingLeft: 'max(var(--dls-pad), calc((100% - var(--container-max)) / 2))',
              marginTop: 'var(--space-8)',
              marginBottom: '-9rem',
            }}
          >
            {shown.map((c) => (
              <div
                key={c.id}
                className="relative flex min-w-0 hover:z-[3]"
                style={{
                  flex: '0 0 14rem',
                  width: '14rem',
                  zIndex: c.discountPercent || c.featured ? 2 : 1,
                  scrollSnapAlign: 'start',
                }}
              >
                <ProductCard data={c} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="mx-auto box-border w-full px-[var(--space-16)] py-[var(--space-48)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
            style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
          >
            <p className="text-16" style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
              Нових карток цієї категорії тут поки немає.
            </p>
          </div>
        )}
      </div>

      {/* arrows (desktop/tablet) */}
      <div
        className="relative mx-auto box-border hidden w-full justify-end gap-[var(--space-8)] px-[var(--space-16)] pb-[var(--space-64)] md:flex md:px-[var(--space-32)] lg:pb-[var(--space-96)] wide:px-[var(--space-64)]"
        style={{ zIndex: 2, maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <ScrollArrow dir="prev" disabled={atStart} onClick={() => scrollBy(-1)} />
        <ScrollArrow dir="next" disabled={atEnd} onClick={() => scrollBy(1)} />
      </div>
    </section>
  )
}

function ScrollArrow({
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
      className="flex shrink-0 items-center justify-center rounded-full border-[length:var(--border-hairline)] border-solid border-neutral-300 transition-colors duration-150 ease-out hover:enabled:border-[color:var(--color-neutral-900)]"
      style={{
        width: 'var(--control-h-48)',
        height: 'var(--control-h-48)',
        background: 'var(--color-neutral-0)',
        color: disabled ? 'var(--color-neutral-400)' : 'var(--color-neutral-900)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        style={{
          width: 'var(--icon-20)',
          height: 'var(--icon-20)',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        <path d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  )
}
