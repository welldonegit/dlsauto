'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { Locale } from '@/i18n/config'
import { partsLabel } from '@/lib/rules'

/**
 * "Деталі для вашого авто" (DLSBrandIndex-v4 export). A tablist of brand chips
 * with a dark pill that morphs between the active chip (measured at runtime),
 * each chip cross-fading its logo colour↔white and label grey↔white; below, the
 * chosen brand's models as cards (up to 3 + a dashed "Усі моделі" card when
 * there are more). Switching brands plays an out→in choreography; the grid keeps
 * a constant min-height so the page does not jump. Honours reduced-motion.
 *
 * Data (brands, models, counts, logos) comes from Payload via the server
 * wrapper. The active-chip white logo is the colour logo whitened with a CSS
 * filter (the export ships a separate tight-light asset — see stage batch).
 */

export type PickerModelCard = { slug: string; name: string; years: string; partsCount: number }
export type ModelsBrand = {
  slug: string
  name: string
  logo: string | null
  aspect: number
  models: PickerModelCard[]
}

const OUT_MS = 180
const STAGGER = 60
const IN_MS = 650
const EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE = 'var(--ease-brand)'
const ARROW_BG = {
  rest: 'rgba(224,0,27,0)',
  hover: 'rgba(224,0,27,0.08)',
  press: 'rgba(224,0,27,0.12)',
}

type Phase = 'idle' | 'out' | 'pre' | 'in'
type Rect = { x: number; y: number; w: number; h: number }

/** Fit one logo into a box by equal optical area, as the export's chipLogos does. */
function logoSize(aspect: number, boxW: number, boxH: number): { w: number; h: number } {
  let h = Math.min(boxH, Math.sqrt((boxH * boxH) / aspect))
  let w = h * aspect
  if (w > boxW) {
    w = boxW
    h = w / aspect
  }
  return { w: Math.round(w), h: Math.round(h) }
}

export function ModelsPicker({
  heading,
  brands,
  initial,
  locale,
}: {
  heading: string
  brands: ModelsBrand[]
  initial: number
  locale: Locale
}) {
  const chipsRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initial)
  const [shown, setShown] = useState(initial)
  const [phase, setPhase] = useState<Phase>('idle')
  const [hc, setHc] = useState(-1)
  const [pk, setPk] = useState<number | null>(null)
  const [ind, setInd] = useState<Rect | null>(null)
  const [indLive, setIndLive] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [reduce, setReduce] = useState(false)

  const fadeT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const idleT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const raf1 = useRef<number>(undefined)
  const raf2 = useRef<number>(undefined)

  // reduced-motion + mobile breakpoint (logo box sizing follows <768). Both are
  // driven off matchMedia subscriptions so state only changes via their callbacks.
  useEffect(() => {
    const mqW = window.matchMedia('(max-width: 767px)')
    const mqR = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncW = () => setMobile(mqW.matches)
    const syncR = () => setReduce(mqR.matches)
    syncW()
    syncR()
    mqW.addEventListener('change', syncW)
    mqR.addEventListener('change', syncR)
    return () => {
      mqW.removeEventListener('change', syncW)
      mqR.removeEventListener('change', syncR)
    }
  }, [])

  // measure the active chip so the pill can morph onto it
  const measure = useCallback(() => {
    const box = chipsRef.current
    const el = box?.querySelector<HTMLElement>(`[data-i="${active}"]`)
    if (!el) return
    setInd((o) => {
      const r = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
      return o && o.x === r.x && o.y === r.y && o.w === r.w && o.h === r.h ? o : r
    })
  }, [active])

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // enable the morph transition only after the first paint (no entry slide)
  useEffect(() => {
    const t = setTimeout(() => setIndLive(true), 50)
    return () => clearTimeout(t)
  }, [])

  const clearTimers = () => {
    clearTimeout(fadeT.current)
    clearTimeout(idleT.current)
    if (raf1.current !== undefined) cancelAnimationFrame(raf1.current)
    if (raf2.current !== undefined) cancelAnimationFrame(raf2.current)
    raf1.current = undefined
    raf2.current = undefined
  }
  useEffect(() => clearTimers, [])

  const pick = (i: number) => {
    if (i === active) return
    clearTimers()
    setActive(i)
    setPhase('out')
    setHc(-1)
    fadeT.current = setTimeout(() => {
      setShown(i)
      setPhase('pre')
      raf1.current = requestAnimationFrame(() => {
        raf2.current = requestAnimationFrame(() => setPhase('in'))
      })
      idleT.current = setTimeout(() => setPhase('idle'), IN_MS + 4 * STAGGER + 80)
    }, OUT_MS)
  }

  // per-card entrance/hover motion, ported from the export's motion()
  const motion = (k: number, on: boolean) => {
    const rd = reduce
    const hover = `transform ${on ? 420 : 280}ms ${EASE}, box-shadow ${on ? 420 : 280}ms ${EASE}, border-color var(--duration-150) ease-out`
    if (phase === 'out')
      return {
        opacity: 0,
        filter: rd ? 'none' : 'blur(0.125rem)',
        transform: rd ? 'none' : 'translateY(-0.5rem)',
        transition: `opacity ${OUT_MS}ms ease-in ${k * 20}ms, transform ${OUT_MS}ms ease-in ${k * 20}ms, filter ${OUT_MS}ms ease-in ${k * 20}ms`,
      }
    if (phase === 'pre')
      return {
        opacity: 0,
        filter: rd ? 'none' : 'blur(0.375rem)',
        transform: rd ? 'none' : 'translateY(1.5rem) scale(0.98)',
        transition: 'none',
      }
    const lift = on ? 'translateY(-0.25rem)' : 'none'
    if (phase === 'in') {
      const dl = k * STAGGER
      return {
        opacity: 1,
        filter: 'blur(0)',
        transform: lift,
        transition: `opacity 420ms ${EASE} ${dl}ms, filter 420ms ${EASE} ${dl}ms, transform ${IN_MS}ms ${EXPO} ${dl}ms, box-shadow 280ms ${EASE}, border-color var(--duration-150) ease-out`,
      }
    }
    return { opacity: 1, filter: 'none', transform: lift, transition: hover }
  }

  const prefix = locale === 'uk' ? '' : '/ru'
  const brand = brands[shown]
  const hasMore = brand.models.length > 3
  const models = brand.models.slice(0, 3)
  const box = mobile ? { w: 56, h: 24 } : { w: 80, h: 32 }

  return (
    <section
      aria-labelledby="models-picker-title"
      className="bg-neutral-50 pt-[var(--space-64)] pb-[var(--space-64)] lg:pt-[var(--space-96)] lg:pb-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <h2
          id="models-picker-title"
          className="text-24 md:text-28 wide:text-40"
          style={{
            margin: 0,
            lineHeight: 1.15,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-neutral-900)',
            textWrap: 'balance',
          }}
        >
          {heading}
        </h2>

        <h3
          className="text-18 mt-[var(--space-32)]"
          style={{
            margin: 'var(--space-32) 0 0',
            fontWeight: 600,
            color: 'var(--color-neutral-900)',
          }}
        >
          Оберіть марку
        </h3>

        {/* brand chip tablist with morphing dark pill */}
        <div
          ref={chipsRef}
          role="tablist"
          aria-label="Марка авто"
          className="relative z-0 mt-[var(--space-16)] grid grid-cols-4 gap-[var(--space-16)] md:grid-cols-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-[1]"
            style={{
              width: ind ? `${ind.w}px` : '0',
              height: ind ? `${ind.h}px` : '0',
              transform: ind ? `translate(${ind.x}px, ${ind.y}px)` : 'none',
              opacity: ind ? 1 : 0,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-neutral-900)',
              transition:
                indLive && !reduce
                  ? `transform 560ms ${EXPO}, width 560ms ${EXPO}, height 560ms ${EXPO}`
                  : 'none',
            }}
          />
          {brands.map((b, i) => {
            const a = i === active
            const sz = logoSize(b.aspect, box.w, box.h)
            return (
              <button
                key={b.slug}
                type="button"
                role="tab"
                data-i={i}
                aria-selected={a}
                aria-controls="models-picker-panel"
                aria-label={`${b.name}, ${partsLabel(b.models.reduce((s, m) => s + m.partsCount, 0))}`}
                title={b.name}
                onClick={() => pick(i)}
                className="relative box-border flex h-[4.5rem] min-w-0 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border-[length:var(--border-hairline)] border-solid border-neutral-200 bg-transparent px-[var(--space-8)] transition-colors duration-200 ease-out hover:border-[color:var(--color-neutral-900)] md:h-[5.5rem]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 z-0"
                  style={{
                    borderRadius: 'calc(var(--radius-sm) - var(--border-hairline))',
                    background: 'var(--color-neutral-0)',
                  }}
                />
                <span className="relative z-[2] flex min-w-0 max-w-full flex-col items-center gap-[var(--space-4)] md:gap-[var(--space-8)]">
                  <span
                    className="flex items-center"
                    style={{ height: mobile ? 'var(--icon-24)' : 'var(--icon-32)' }}
                  >
                    {b.logo ? (
                      <span
                        className="relative block shrink-0"
                        style={{ width: `${sz.w}px`, height: `${sz.h}px` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG mark */}
                        <img
                          src={b.logo}
                          alt=""
                          className="absolute inset-0 block h-full w-full"
                          style={{
                            opacity: a ? 0 : 1,
                            transition: `opacity 260ms ease-out ${a ? 120 : 0}ms`,
                          }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element -- whitened copy for the dark pill */}
                        <img
                          src={b.logo}
                          alt=""
                          className="absolute inset-0 block h-full w-full"
                          style={{
                            opacity: a ? 1 : 0,
                            filter: 'brightness(0) invert(1)',
                            transition: `opacity 260ms ease-out ${a ? 120 : 0}ms`,
                          }}
                        />
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className="max-w-full overflow-hidden text-ellipsis text-11 md:text-13"
                    style={{
                      fontWeight: 500,
                      lineHeight: 1.1,
                      color: a ? 'var(--color-neutral-0)' : 'var(--color-neutral-600)',
                      whiteSpace: mobile ? 'normal' : 'nowrap',
                      transition: `color 260ms ease-out ${a ? 120 : 0}ms`,
                    }}
                  >
                    {b.name}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <h3
          className="text-18 mt-[var(--space-48)]"
          style={{
            margin: 'var(--space-48) 0 0',
            fontWeight: 600,
            color: 'var(--color-neutral-900)',
          }}
        >
          Моделі {brand.name}
        </h3>

        {/* model cards (constant min-height so switching brands does not jump) */}
        <div
          id="models-picker-panel"
          role="tabpanel"
          aria-label={`Моделі ${brand.name}`}
          className="mt-[var(--space-16)] grid grid-cols-1 content-start gap-[var(--space-16)] md:grid-cols-2 md:gap-[var(--space-24)] lg:grid-cols-4"
          style={{ minHeight: 'var(--space-200)' }}
        >
          {models.map((m, i) => {
            const on = hc === i
            const mo = motion(i, on)
            const arrowBg = pk === i ? ARROW_BG.press : on ? ARROW_BG.hover : ARROW_BG.rest
            return (
              <a
                key={m.slug}
                href={`${prefix}/brand/${brand.slug}/${m.slug}`}
                aria-label={`${brand.name} ${m.name} ${m.years}, ${partsLabel(m.partsCount)}`.replace(
                  ' ,',
                  ',',
                )}
                onMouseEnter={() => setHc(i)}
                onMouseLeave={() => setHc((x) => (x === i ? -1 : x))}
                onFocus={() => setHc(i)}
                onBlur={() => setHc((x) => (x === i ? -1 : x))}
                onPointerDown={() => setPk(i)}
                onPointerUp={() => setPk((x) => (x === i ? null : x))}
                onPointerLeave={() => setPk((x) => (x === i ? null : x))}
                onPointerCancel={() => setPk((x) => (x === i ? null : x))}
                className="box-border flex min-w-0 flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] border-[length:var(--border-hairline)] border-solid border-neutral-200 p-[var(--space-16)] no-underline md:p-[var(--space-24)]"
                style={{
                  height: 'var(--space-200)',
                  background: 'var(--color-neutral-0)',
                  color: 'var(--color-neutral-900)',
                  boxShadow: on ? '0 0.25rem 1rem rgba(18,22,28,0.08)' : 'none',
                  ...mo,
                }}
              >
                <div className="flex min-w-0 flex-1 flex-col justify-start">
                  <span
                    title={m.name}
                    className="text-24 overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                  >
                    {m.name}
                  </span>
                  <span
                    className="text-14"
                    style={{ minHeight: '1.25rem', color: 'var(--color-neutral-600)' }}
                  >
                    {m.years}
                  </span>
                  <div className="mt-auto flex items-center justify-between gap-[var(--space-12)] pt-[var(--space-16)]">
                    <span
                      className="text-14"
                      style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}
                    >
                      {partsLabel(m.partsCount)}
                    </span>
                    <CardArrow bg={arrowBg} />
                  </div>
                </div>
              </a>
            )
          })}

          {hasMore ? (
            <AllModelsCard
              href={`${prefix}/brand/${brand.slug}`}
              label={`Усі моделі ${brand.name}`}
              brandName={brand.name}
              total={brand.models.length}
              on={hc === 99}
              pressed={pk === 99}
              motion={motion(models.length, false)}
              onEnter={() => setHc(99)}
              onLeave={() => setHc((x) => (x === 99 ? -1 : x))}
              onDown={() => setPk(99)}
              onUp={() => setPk((x) => (x === 99 ? null : x))}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function CardArrow({ bg }: { bg: string }) {
  return (
    <span
      aria-hidden="true"
      className="box-border flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: 'var(--control-h-32)',
        height: 'var(--control-h-32)',
        border: 'var(--border-hairline) solid var(--color-primary)',
        background: bg,
        color: 'var(--color-primary)',
        transition: 'background var(--duration-150) ease-out',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        style={{
          width: 'var(--icon-16)',
          height: 'var(--icon-16)',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </span>
  )
}

function AllModelsCard({
  href,
  label,
  brandName,
  total,
  on,
  pressed,
  motion,
  onEnter,
  onLeave,
  onDown,
  onUp,
}: {
  href: string
  label: string
  brandName: string
  total: number
  on: boolean
  pressed: boolean
  motion: React.CSSProperties
  onEnter: () => void
  onLeave: () => void
  onDown: () => void
  onUp: () => void
}) {
  const arrowBg = pressed ? ARROW_BG.press : on ? ARROW_BG.hover : ARROW_BG.rest
  return (
    <a
      href={href}
      aria-label={`Усі моделі ${brandName}: ${total}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      className="box-border flex min-w-0 flex-col rounded-[var(--radius-lg)] p-[var(--space-16)] no-underline md:p-[var(--space-24)]"
      style={{
        height: 'var(--space-200)',
        border: `var(--border-hairline) ${on ? 'solid' : 'dashed'} ${on ? 'var(--color-neutral-900)' : 'var(--color-neutral-300)'}`,
        background: 'var(--color-neutral-0)',
        color: 'var(--color-neutral-900)',
        ...motion,
      }}
    >
      <span
        className="text-20"
        style={{ fontWeight: 600, letterSpacing: '-0.01em', textWrap: 'balance' }}
      >
        {label}
      </span>
      <span className="mt-auto self-end">
        <CardArrow bg={arrowBg} />
      </span>
    </a>
  )
}
