'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ProductCard, type ProductCardData } from '@/components/ProductCard'
import { useSelectedCar } from '@/lib/selectedCar'

/**
 * Shared "Запчастини на пікапи / позашляховики" section (DLSPickups / DLSSuvs).
 * A 9/16 autoplay video banner on the left (title, subtitle, "Усі …" CTA) and,
 * on the right, a rail of model tabs (brand logo + name + count) over a
 * full-bleed snap-carousel of that model's ProductCards. Switching models
 * cross-fades the row; prev/next arrows disable at the edges. The aside aligns
 * with the content column; the carousel bleeds into the right gutter.
 */

export type VehicleModelTab = {
  key: string
  label: string
  logo: string | null
  count: number
  cards: ProductCardData[]
}

export function VehicleCarousel({
  title,
  subtitle,
  allHref,
  allLabel,
  videoSrc,
  videoLabel,
  models,
  ariaLabel,
  titleId,
}: {
  title: string
  subtitle: string
  allHref: string
  allLabel: string
  videoSrc: string | null
  videoLabel: string
  models: VehicleModelTab[]
  ariaLabel: string
  titleId: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [tabsOverflow, setTabsOverflow] = useState(false)
  const fadeT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const car = useSelectedCar()

  // If the visitor's car matches one of the model tabs, select it automatically
  // (render-phase derived-state reset on car change — no effect needed).
  const [prevCar, setPrevCar] = useState(car)
  if (car !== prevCar) {
    setPrevCar(car)
    if (car) {
      const idx = models.findIndex((m) => m.key === car.slug)
      if (idx >= 0) setActive(idx)
    }
  }

  const current = models[active] ?? models[0]

  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 2)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])

  const syncTabsOverflow = useCallback(() => {
    const el = tabsRef.current
    if (el) setTabsOverflow(el.scrollWidth > el.clientWidth + 2)
  }, [])

  useEffect(() => {
    syncEdges()
    syncTabsOverflow()
    const onResize = () => {
      syncEdges()
      syncTabsOverflow()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [syncEdges, syncTabsOverflow])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
    syncEdges()
  }, [active, syncEdges])

  useEffect(() => () => clearTimeout(fadeT.current), [])

  // pause the banner video when off-screen (perf)
  useEffect(() => {
    const v = videoRef.current
    if (!v || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void v.play().catch(() => {})
      else v.pause()
    })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  const select = (i: number) => {
    if (i === active || fading) return
    setFading(true)
    clearTimeout(fadeT.current)
    fadeT.current = setTimeout(() => {
      setActive(i)
      setFading(false)
    }, 200)
  }
  const scrollBy = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * (224 + 24), behavior: 'smooth' })

  const side = 'max(var(--dls-pad), calc((100% - var(--container-max)) / 2))'

  if (!current) return null

  return (
    <section
      aria-labelledby={titleId}
      className="bg-neutral-50 pb-[var(--space-64)] [--dls-pad:var(--space-16)] md:[--dls-pad:var(--space-32)] lg:pb-[var(--space-96)] wide:[--dls-pad:var(--space-64)]"
    >
      <div
        className="grid grid-cols-1 items-stretch gap-[var(--space-24)] md:grid-cols-[17rem_minmax(0,1fr)] wide:grid-cols-[20.5rem_minmax(0,1fr)]"
        style={{ paddingLeft: side }}
      >
        {/* video banner aside */}
        <aside
          className="relative min-w-0 self-start overflow-hidden mr-[max(var(--dls-pad),calc((100%-var(--container-max))/2))] md:mr-0"
          style={{
            aspectRatio: '9 / 16',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-neutral-800)',
            color: 'var(--color-neutral-0)',
          }}
        >
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              aria-label={videoLabel}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="absolute inset-0 block h-full w-full"
              style={{ objectFit: 'cover' }}
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'rgba(18,22,28,0.2)' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(18,22,28,0.72) 0%, rgba(18,22,28,0.32) 55%, rgba(18,22,28,0) 80%)',
            }}
          />
          <div className="relative flex h-full flex-col items-start p-[var(--space-24)]">
            <h2
              id={titleId}
              className="text-32 md:text-[1.625rem] wide:text-32"
              style={{
                margin: 0,
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--color-neutral-0)',
                textWrap: 'balance',
              }}
            >
              {title}
            </h2>
            <p
              className="text-16"
              style={{
                margin: 'var(--space-12) 0 0',
                lineHeight: 1.5,
                color: 'var(--color-neutral-0)',
                textWrap: 'pretty',
              }}
            >
              {subtitle}
            </p>
            <a
              href={allHref}
              className="dls-fill mt-[var(--space-24)] flex h-[var(--control-h-48)] items-center whitespace-nowrap text-16 no-underline"
              style={{
                boxSizing: 'border-box',
                padding: '0 var(--space-24)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-neutral-0)',
                ['--dls-fill' as string]: 'var(--color-primary-dark-2)',
              }}
            >
              {allLabel}
            </a>
          </div>
        </aside>

        {/* right: model tabs + carousel + arrows */}
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 flex-col gap-[var(--space-16)]">
            {tabsOverflow ? (
              <div
                aria-hidden="true"
                className="flex items-center gap-[var(--space-8)] text-14"
                style={{ color: 'var(--color-neutral-600)' }}
              >
                <SwipeHand />
                <span>Гортайте</span>
              </div>
            ) : null}
            <div
              ref={tabsRef}
              role="tablist"
              aria-label={ariaLabel}
              className="flex min-w-0 gap-[var(--space-8)] overflow-x-auto"
              style={{ paddingRight: side, scrollbarWidth: 'none' }}
            >
              {models.map((mo, i) => {
                const on = i === active
                return (
                  <button
                    key={mo.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => select(i)}
                    className="flex h-[var(--control-h-40)] shrink-0 cursor-pointer items-center gap-[var(--space-8)] whitespace-nowrap rounded-[var(--radius-sm)] border-[length:var(--border-hairline)] border-solid pr-[var(--space-16)] pl-[var(--space-12)] text-14 transition-colors duration-200 ease-[var(--ease-brand)]"
                    style={{
                      boxSizing: 'border-box',
                      fontWeight: 500,
                      background: on ? 'var(--color-neutral-900)' : 'var(--color-neutral-0)',
                      color: on ? 'var(--color-neutral-0)' : 'var(--color-neutral-900)',
                      borderColor: on ? 'var(--color-neutral-900)' : 'var(--color-neutral-200)',
                    }}
                  >
                    <span className="flex items-center gap-[0.375rem]">
                      {mo.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small brand mark
                        <img
                          src={mo.logo}
                          alt=""
                          className="block shrink-0"
                          style={{
                            width: 'var(--icon-16)',
                            height: 'var(--icon-16)',
                            objectFit: 'contain',
                            filter: on ? 'brightness(0) invert(1)' : 'none',
                            transition: 'filter var(--duration-200) var(--ease-brand)',
                          }}
                        />
                      ) : null}
                      {mo.label}
                    </span>
                    <span
                      className="text-12"
                      style={{
                        fontWeight: 400,
                        color: on ? 'var(--color-neutral-300)' : 'var(--color-neutral-500)',
                      }}
                    >
                      {mo.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={syncEdges}
            className="flex items-stretch gap-[var(--space-24)] overflow-x-auto"
            style={{
              flex: 1,
              margin: '0 0 -9rem calc(var(--space-16) * -1)',
              padding: `var(--space-24) ${side} 10.5rem var(--space-16)`,
              scrollPaddingLeft: 'var(--space-16)',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              opacity: fading ? 0 : 1,
              transition: 'opacity var(--duration-200) ease-out',
            }}
          >
            {current.cards.map((c) => (
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

          <div
            className="relative hidden justify-end gap-[var(--space-8)] md:flex"
            style={{ zIndex: 2, paddingRight: side }}
          >
            <CarouselArrow dir="prev" disabled={atStart} onClick={() => scrollBy(-1)} />
            <CarouselArrow dir="next" disabled={atEnd} onClick={() => scrollBy(1)} />
          </div>
        </div>
      </div>
    </section>
  )
}

function CarouselArrow({
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

function SwipeHand() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      style={{
        width: 'var(--icon-20)',
        height: 'var(--icon-20)',
        flexShrink: 0,
        fill: 'none',
        stroke: 'var(--color-neutral-900)',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        animation: 'dls-swipe 1.6s ease-in-out infinite',
      }}
    >
      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )
}
