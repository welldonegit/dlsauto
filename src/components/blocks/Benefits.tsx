'use client'

import { useEffect, useRef, useState } from 'react'

import { dispatchLabel } from '@/lib/rules'

/**
 * "Переваги" over the footer (DLSBenefits). A dark band with three light cards
 * (Відправка / Оплата / Гарантія): an eyebrow + badge, a big value, a divider,
 * three key/value pairs, and a dark plate with an icon, a note and a green tag.
 * The first card's value is the live Kyiv ship-day (Сьогодні / Завтра / У
 * понеділок, §5), updated on the minute. Cards reveal on scroll (stagger) and
 * lift on hover; reduced-motion shows them at once.
 */

export type BenefitPair = { k: string; v: string }
export type BenefitCard = {
  label: string
  badge: string
  shipDay: boolean
  value: string
  icon: 'tread' | 'card' | 'wrench'
  note: string
  tag: string
  pairs: BenefitPair[]
}

const EASE = 'var(--ease-brand)'

export function Benefits({ items, shipLabel }: { items: BenefitCard[]; shipLabel: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const [live, setLive] = useState(shipLabel)
  const [shown, setShown] = useState(false)
  const [settled, setSettled] = useState(false)
  const [hov, setHov] = useState(-1)

  // reveal on scroll (or immediately under reduced-motion)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window) || !rootRef.current) {
      setShown(true)
      setSettled(true)
      return
    }
    let settleT: ReturnType<typeof setTimeout>
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return
        io.disconnect()
        setShown(true)
        settleT = setTimeout(() => setSettled(true), 700)
      },
      { threshold: 0.2 },
    )
    io.observe(rootRef.current)
    return () => {
      io.disconnect()
      clearTimeout(settleT)
    }
  }, [])

  // live ship-day, re-evaluated on each minute boundary
  useEffect(() => {
    if (!items.some((c) => c.shipDay)) return
    let t: ReturnType<typeof setTimeout>
    const sync = () => {
      setLive(dispatchLabel(new Date()))
      t = setTimeout(sync, 60000 - (Date.now() % 60000) + 50)
    }
    t = setTimeout(sync, 60000 - (Date.now() % 60000) + 50)
    return () => clearTimeout(t)
  }, [items])

  if (!items.length) return null

  return (
    <section
      ref={rootRef}
      aria-label="Наші переваги"
      className="bg-neutral-950 pt-[var(--space-64)] pb-[var(--space-64)] lg:pt-[var(--space-96)] lg:pb-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border grid w-full grid-cols-1 items-stretch gap-[var(--space-16)] px-[var(--space-16)] md:px-[var(--space-32)] lg:grid-cols-3 wide:gap-[var(--space-24)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        {items.map((c, i) => {
          const on = hov === i
          const value = c.shipDay ? live : c.value
          const trans = settled
            ? `transform 250ms ${EASE}, box-shadow 250ms ${EASE}`
            : `opacity 500ms ${EASE} ${i * 80}ms, transform 500ms ${EASE} ${i * 80}ms`
          return (
            <article
              key={i}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov((x) => (x === i ? -1 : x))}
              className="box-border flex min-w-0 flex-col rounded-[var(--radius-lg)] p-[1.25rem] md:p-[var(--space-24)] wide:p-[var(--space-32)]"
              style={{
                background: 'var(--color-neutral-50)',
                border: 'var(--border-hairline) solid rgba(255,255,255,0.1)',
                boxShadow: on ? '0 0.75rem 2rem rgba(18,22,28,0.16)' : 'none',
                opacity: shown ? 1 : 0,
                transform: !shown ? 'translateY(1.5rem)' : on ? 'translateY(-0.5rem)' : 'none',
                transition: trans,
              }}
            >
              <div className="flex flex-col items-start gap-[var(--space-16)]">
                <div className="flex min-w-0 items-center gap-[var(--space-12)]">
                  <h3
                    className="text-12"
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-neutral-600)',
                    }}
                  >
                    {c.label}
                  </h3>
                  <span
                    className="text-13 whitespace-nowrap"
                    style={{
                      padding: 'var(--space-4) var(--space-8)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-neutral-200)',
                      fontWeight: 500,
                      color: 'var(--color-neutral-900)',
                    }}
                  >
                    {c.badge}
                  </span>
                </div>
                <p
                  aria-live={c.shipDay ? 'polite' : 'off'}
                  className="whitespace-nowrap text-[2.25rem] md:text-[3rem] lg:text-[2.5rem] wide:text-[3.5rem]"
                  style={{
                    margin: 0,
                    lineHeight: 1.05,
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-neutral-900)',
                  }}
                >
                  {value}
                </p>
              </div>

              <div
                aria-hidden="true"
                style={{
                  height: 'var(--border-hairline)',
                  margin: 'var(--space-24) 0',
                  background: 'var(--color-neutral-200)',
                }}
              />

              <dl className="m-0 grid grid-cols-1 gap-[var(--space-16)]">
                {c.pairs.map((pr, j) => (
                  <div key={j} className="min-w-0">
                    <dt className="text-13" style={{ color: 'var(--color-neutral-600)' }}>
                      {pr.k}
                    </dt>
                    <dd
                      className="text-[0.9375rem]"
                      style={{
                        margin: 'var(--space-4) 0 0',
                        lineHeight: 1.4,
                        fontWeight: 600,
                        color: 'var(--color-neutral-900)',
                        textWrap: 'pretty',
                      }}
                    >
                      {pr.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto pt-[var(--space-24)]">
                <div
                  className="box-border flex items-center gap-[var(--space-12)]"
                  style={{
                    padding: 'var(--space-12) var(--space-12) var(--space-12) var(--space-16)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-neutral-900)',
                  }}
                >
                  <PlateIcon icon={c.icon} />
                  <span
                    className="min-w-0 flex-1 text-14"
                    style={{ color: 'var(--color-neutral-0)', textWrap: 'pretty' }}
                  >
                    {c.note}
                  </span>
                  <span
                    className="shrink-0 whitespace-nowrap text-14"
                    style={{
                      padding: '0.375rem 0.625rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(31,138,76,0.15)',
                      fontWeight: 600,
                      color: 'var(--color-success)',
                    }}
                  >
                    {c.tag}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function PlateIcon({ icon }: { icon: 'tread' | 'card' | 'wrench' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block shrink-0"
      style={{
        width: 'var(--icon-20)',
        height: 'var(--icon-20)',
        fill: 'none',
        stroke: 'var(--color-neutral-300)',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      {icon === 'tread' ? (
        <g>
          <path d="M5 3V21M19 3V21" />
          <path d="M7.5 4.5L12 7L16.5 4.5M7.5 9L12 11.5L16.5 9M7.5 13.5L12 16L16.5 13.5M7.5 18L12 20.5L16.5 18" />
        </g>
      ) : icon === 'card' ? (
        <g>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3 10H21M7 14.5H10" />
        </g>
      ) : (
        <g>
          <path
            transform="translate(12 12) rotate(45) scale(0.85) translate(-12 -12)"
            vectorEffect="non-scaling-stroke"
            d="M9.5 10.33A5 5 0 0 1 10.5 1.23L10.5 5L13.5 5L13.5 1.23A5 5 0 0 1 14.5 10.33L14.5 20.5A2.5 2.5 0 0 1 9.5 20.5Z"
          />
          <path d="M8.3 14.5L9.3 15.5L11 13.7" />
        </g>
      )}
    </svg>
  )
}
