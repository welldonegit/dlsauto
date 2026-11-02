'use client'

import { useEffect, useRef, useState } from 'react'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "DLSAuto в цифрах" v2 (PROJECT_CONTEXT §4.3, STAGE_3A §3). Light band, four
 * cards with alternating dark/red fill ("чёрні і червоні через одну"), a round
 * notch at the top carrying a line glyph, numbers that count up once in view,
 * and transform-only hover micro-animations. Reusable — the same component
 * serves the home page. Texts come from the block.
 *
 * The visible heading is screen-reader-only (the cards are self-describing),
 * matching the export.
 */

const DURATION = 1200
// Decorative rotation per card (degrees), from the export.
const GLYPH_ROT = [12, 38, 4, 27]

type StatItem = { eyebrow: string; value: string; text: string; accent: boolean }

function parseValue(v: string): { prefix: string; num: number; suffix: string } {
  const first = v.search(/\d/)
  if (first === -1) return { prefix: '', num: 0, suffix: v }
  let last = first
  for (let i = first; i < v.length; i += 1) if (/\d/.test(v[i])) last = i
  const num = parseInt(v.slice(first, last + 1).replace(/\D/g, ''), 10) || 0
  return { prefix: v.slice(0, first), num, suffix: v.slice(last + 1) }
}

const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function StatsBlock({ heading, items }: BlockComponentProps<'stats'>) {
  const cards: StatItem[] = (items ?? []).map((it) => ({
    eyebrow: it.eyebrow ?? '',
    value: it.value ?? '',
    text: it.text ?? '',
    accent: !!it.accent,
  }))
  const rootRef = useRef<HTMLElement>(null)
  const [t, setT] = useState(0)
  const [shown, setShown] = useState(false)
  const [hover, setHover] = useState<Record<number, 'in' | 'out'>>({})
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window) || !rootRef.current) {
      setT(1)
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          setShown(true)
          const t0 = performance.now()
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / DURATION)
            setT(1 - Math.pow(1 - p, 3))
            if (p < 1) raf.current = requestAnimationFrame(tick)
          }
          raf.current = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 },
    )
    io.observe(rootRef.current)
    return () => {
      io.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  if (!cards.length) return null

  return (
    <section
      ref={rootRef}
      aria-labelledby="stats-h"
      className="bg-neutral-50 pt-[var(--space-64)] pb-[var(--space-64)] lg:pt-[var(--space-96)] lg:pb-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <h2 id="stats-h" className="sr-only">
          {heading}
        </h2>
        <div className="grid grid-cols-2 gap-[var(--space-12)] md:gap-[var(--space-24)] lg:grid-cols-4">
          {cards.map((c, i) => {
            const v = parseValue(c.value)
            const hv = hover[i]
            const anim = !hv
              ? 'none'
              : !c.accent
                ? hv === 'in'
                  ? 'dls-sway-in 600ms ease-in-out forwards'
                  : 'dls-sway-out 300ms ease-out forwards'
                : hv === 'in'
                  ? 'dls-shake 400ms ease-in-out, dls-grow-in 250ms ease-out 400ms forwards'
                  : 'dls-grow-out 250ms ease-out forwards'
            return (
              <article
                key={i}
                onMouseEnter={() => setHover((h) => ({ ...h, [i]: 'in' }))}
                onMouseLeave={() => setHover((h) => ({ ...h, [i]: 'out' }))}
                style={{
                  minWidth: 0,
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(2rem)',
                  transition: `opacity 500ms ease-out ${i * 80}ms, transform 500ms ease-out ${i * 80}ms`,
                }}
              >
                <div
                  className="relative flex h-full flex-col items-center overflow-hidden text-center"
                  style={{
                    background: c.accent ? 'var(--color-primary)' : 'var(--color-neutral-950)',
                    color: 'var(--color-neutral-0)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-48) var(--space-12) var(--space-32)',
                    boxShadow: hv === 'in' ? 'var(--shadow-md)' : 'none',
                    transition: 'box-shadow var(--duration-300) ease-out',
                    animation: anim,
                  }}
                >
                  {/* notch + line glyph */}
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2"
                    style={{
                      top: 'calc(-1 * var(--space-32))',
                      width: 'var(--space-64)',
                      height: 'var(--space-64)',
                      marginLeft: 'calc(-1 * var(--space-32))',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-neutral-50)',
                    }}
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="dls-icon absolute left-1/2"
                    style={{
                      width: 'var(--icon-24)',
                      height: 'var(--icon-24)',
                      top: 'var(--space-4)',
                      marginLeft: 'calc(-1 * var(--icon-24) / 2)',
                      color: 'var(--color-neutral-900)',
                    }}
                  >
                    <circle cx="12" cy="12" r="7.5" />
                    <path
                      transform={`rotate(${GLYPH_ROT[i % 4]} 12 12)`}
                      d="M12 8.5V15.5M8.5 12H15.5"
                    />
                  </svg>

                  <p
                    className="text-12 md:text-14"
                    style={{
                      margin: 0,
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: c.accent ? 'var(--color-neutral-0)' : 'var(--color-neutral-400)',
                    }}
                  >
                    {c.eyebrow}
                  </p>
                  <p
                    aria-label={c.value}
                    className="flex items-baseline justify-center"
                    style={{
                      margin: 'var(--space-12) 0 0',
                      gap: 'var(--space-4)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {v.prefix ? (
                      <span
                        aria-hidden="true"
                        className="text-18 wide:text-24"
                        style={{
                          lineHeight: 1,
                          color: c.accent ? 'rgba(252,252,253,0.8)' : 'var(--color-neutral-400)',
                        }}
                      >
                        {v.prefix}
                      </span>
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="text-40 wide:text-d"
                      style={{
                        fontWeight: 400,
                        lineHeight: 1,
                        letterSpacing: '-0.03em',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {groupThousands(Math.round(v.num * t))}
                    </span>
                    {v.suffix ? (
                      <span
                        aria-hidden="true"
                        className="self-start text-18 wide:text-24"
                        style={{
                          lineHeight: 1,
                          color: c.accent ? 'rgba(252,252,253,0.8)' : 'var(--color-neutral-400)',
                        }}
                      >
                        {v.suffix}
                      </span>
                    ) : null}
                  </p>
                  <p
                    className="text-14 md:text-16"
                    style={{
                      margin: 'var(--space-12) 0 0',
                      maxWidth: '17.5rem',
                      lineHeight: 1.5,
                      color: c.accent ? 'rgba(252,252,253,0.8)' : 'var(--color-neutral-400)',
                      textWrap: 'balance',
                    }}
                  >
                    {c.text}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
