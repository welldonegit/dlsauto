'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import type { MegaMenuBrand, MegaMenuData } from '@/lib/data'
import { useSelectedCar, type SelectedCar } from '@/lib/selectedCar'

type CarInfo = { brand: MegaMenuBrand; modelName: string; name: string } | null

/** Resolve the selected-car cookie against the menu data (brand logo + model label). */
function resolveCar(car: SelectedCar | null, data: MegaMenuData): CarInfo {
  if (!car) return null
  for (const b of data.brands) {
    const m = b.models.find((mm) => mm.slug === car.slug)
    if (m) return { brand: b, modelName: m.name, name: car.label }
  }
  return null
}

/**
 * Catalog mega-menu (DLSMegaMenu3 export). Two faces driven by width:
 *
 * • **Wide panel** (≥1360, the desktop Catalog trigger): a full-width dropdown
 *   under the header — Марки (brand list) · Моделі (the active brand's models,
 *   switched on hover with a cross-fade, plus a "Популярне у …" filler when the
 *   brand is short) · Категорії (Новинки / Популярне + category rows). A car
 *   banner shows when a car is selected.
 * • **Drawer** (<1360, the hamburger): a right-sliding sheet with two screens —
 *   the main nav, and a "Каталог" screen (search, car card, За маркою / За
 *   категорією accordions).
 *
 * Esc / scrim / outside-click close; focus is trapped while open and restored to
 * the trigger on close. Mounted lazily (dynamic import) and only kept in the DOM
 * while open, so it costs nothing until first opened. Data comes from Payload via
 * the SiteHeader server wrapper; links are real §8 URLs (catalog pages in 3c).
 */

const EASE = 'var(--ease-brand)'
const GRAY = 'grayscale(1) brightness(0.35)'

export type MegaMenuChrome = {
  phone: string
  phoneHref: string
  hours: string
  telegramHref: string
  viberHref: string
}

export type MegaMenuProps = {
  open: boolean
  onClose: () => void
  data: MegaMenuData
  locale: Locale
  chrome: MegaMenuChrome
}

/* -------------------------------------------------------------- inline icons */

function Icon({ d, size = '20', width }: { d: string | string[]; size?: string; width?: number }) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: `var(--icon-${size})`,
        height: `var(--icon-${size})`,
        display: 'block',
        flexShrink: 0,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: width ?? 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  )
}

const ARROW_RIGHT = ['M5 12h14', 'm12 5 7 7-7 7']
const CHEVRON_RIGHT = 'm9 18 6-6-6-6'
const CHEVRON_DOWN = 'm6 9 6 6 6-6'
const CHEVRON_LEFT = 'm15 18-6-6 6-6'
const CLOSE = ['M18 6 6 18', 'm6 6 12 12']

/* ------------------------------------------------------------------ helpers */

/** All visible, focusable descendants of a dialog, for the Tab trap. */
function focusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  const sel =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

/* ----------------------------------------------------------------- component */

export function MegaMenu({ open, onClose, data, locale, chrome }: MegaMenuProps) {
  const [shown, setShown] = useState(false)
  const [wide, setWide] = useState(true)
  const [top, setTop] = useState(0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const prefix = locale === 'uk' ? '' : '/ru'
  const car = useSelectedCar()

  // width class (wide catalog panel vs. nav drawer)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1360px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // keep the panel anchored just under the header as the page scrolls
  const measure = useCallback(() => {
    const a = anchorRef.current
    if (a) setTop(Math.max(0, a.getBoundingClientRect().top))
  }, [])

  // animate in/out from the `open` prop (state set inside rAF, never synchronously)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      measure()
      setShown(open)
    })
    return () => cancelAnimationFrame(id)
  }, [open, measure])

  // reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [open, measure])

  // scroll-lock the body for the drawer (not the wide dropdown)
  useEffect(() => {
    if (open && !wide) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open, wide])

  // Esc + focus trap + restore focus to the trigger
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const id = requestAnimationFrame(() => {
      const f = focusablesIn(dialogRef.current)
      ;(closeRef.current ?? f[0])?.focus({ preventScroll: true })
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const f = focusablesIn(dialogRef.current)
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (dialogRef.current && active && !dialogRef.current.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  // resolve the selected car against the menu data (brand logo + model label)
  const carInfo = resolveCar(car, data)

  const changeCar = useCallback(() => {
    onClose()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [onClose])

  return wide ? (
    <WidePanel
      anchorRef={anchorRef}
      dialogRef={dialogRef}
      closeRef={closeRef}
      shown={shown}
      top={top}
      data={data}
      prefix={prefix}
      carInfo={carInfo}
      onClose={onClose}
      changeCar={changeCar}
    />
  ) : (
    <Drawer
      anchorRef={anchorRef}
      dialogRef={dialogRef}
      closeRef={closeRef}
      shown={shown}
      data={data}
      prefix={prefix}
      carInfo={carInfo}
      chrome={chrome}
      onClose={onClose}
    />
  )
}

/* ================================================================ wide panel */

function WidePanel({
  anchorRef,
  dialogRef,
  closeRef,
  shown,
  top,
  data,
  prefix,
  carInfo,
  onClose,
  changeCar,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>
  dialogRef: React.RefObject<HTMLDivElement | null>
  closeRef: React.RefObject<HTMLButtonElement | null>
  shown: boolean
  top: number
  data: MegaMenuData
  prefix: string
  carInfo: CarInfo
  onClose: () => void
  changeCar: () => void
}) {
  const [active, setActive] = useState(carInfo?.brand.slug ?? data.brands[0]?.slug ?? '')
  const [ctxOn, setCtxOn] = useState(true)
  const hoverT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const fadeT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cur = useRef(active)

  const pick = (slug: string, now = false) => {
    clearTimeout(hoverT.current)
    const go = () => {
      if (cur.current === slug) return
      cur.current = slug
      setCtxOn(false)
      clearTimeout(fadeT.current)
      fadeT.current = setTimeout(() => {
        setActive(slug)
        setCtxOn(true)
      }, 150)
    }
    if (now) go()
    else hoverT.current = setTimeout(go, 120)
  }
  useEffect(
    () => () => {
      clearTimeout(hoverT.current)
      clearTimeout(fadeT.current)
    },
    [],
  )

  const brand = data.brands.find((b) => b.slug === active) ?? data.brands[0]
  const models = brand.models

  return (
    <div ref={anchorRef} style={{ height: 0 }}>
      <div
        onClick={onClose}
        role="presentation"
        style={{
          position: 'fixed',
          top: `${top}px`,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 900,
          background: 'rgba(18,22,28,0.3)',
          opacity: shown ? 1 : 0,
          visibility: shown ? 'visible' : 'hidden',
          pointerEvents: shown ? 'auto' : 'none',
          transition: shown
            ? 'opacity 200ms ease-out, visibility 0s linear 0s'
            : 'opacity 200ms ease-out, visibility 0s linear 200ms',
          color: 'var(--color-neutral-900)',
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Каталог"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-neutral-0)',
            boxShadow: '0 1rem 1.5rem -0.75rem rgba(18,22,28,0.24)',
            transform: shown ? 'translateY(0)' : 'translateY(-0.5rem)',
            transition: `transform 200ms ${EASE}`,
          }}
        >
          <Container>
            {carInfo ? <CarBanner carInfo={carInfo} changeCar={changeCar} /> : null}

            <div
              className="grid items-start"
              style={{
                padding: '1.25rem 0 var(--space-32)',
                gridTemplateColumns: 'minmax(max-content,22fr) minmax(0,47fr) minmax(0,31fr)',
              }}
            >
              {/* Марки */}
              <div className="min-w-0" style={{ paddingRight: 'var(--space-24)' }}>
                <ColLabel>Марки</ColLabel>
                <div className="flex flex-col">
                  {data.brands.map((b) => {
                    const a = b.slug === active
                    return (
                      <a
                        key={b.slug}
                        href={b.href}
                        aria-current={a ? 'true' : undefined}
                        onMouseEnter={() => pick(b.slug)}
                        onFocus={() => pick(b.slug, true)}
                        className="box-border flex items-center no-underline"
                        style={{
                          height: 'var(--control-h-32)',
                          padding: '0 var(--space-12)',
                          gap: 'var(--space-12)',
                          borderRadius: 'var(--radius-sm)',
                          background: a ? 'var(--color-neutral-100)' : 'transparent',
                          color: 'var(--color-neutral-900)',
                          transition: 'background var(--duration-150) ease-out',
                        }}
                      >
                        <span
                          className="flex shrink-0 items-center justify-center"
                          style={{ width: 'var(--icon-20)', height: 'var(--icon-20)' }}
                        >
                          {b.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element -- small brand mark
                            <img
                              src={b.logo}
                              alt=""
                              className="block"
                              style={{
                                maxWidth: 'var(--icon-20)',
                                maxHeight: 'var(--icon-20)',
                                objectFit: 'contain',
                                filter: GRAY,
                              }}
                            />
                          ) : null}
                        </span>
                        <span
                          className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-15"
                          style={{ fontWeight: a ? 600 : 400 }}
                        >
                          {b.name}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Моделі */}
              <div
                className="flex min-w-0 flex-col self-stretch"
                style={{ padding: '0 var(--space-24)' }}
              >
                <ColLabel>Моделі</ColLabel>
                <div
                  className="flex flex-1 flex-col"
                  style={{
                    opacity: ctxOn ? 1 : 0,
                    transition: 'opacity 150ms ease-out',
                  }}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gridAutoRows: '1fr',
                      gap: 'var(--space-12)',
                      alignContent: 'start',
                    }}
                  >
                    {models.map((m) => (
                      <ModelCard key={m.slug} href={m.href} name={m.name} line={m.line} />
                    ))}
                  </div>

                  <div
                    className="flex"
                    style={{ marginTop: 'auto', paddingTop: 'var(--space-16)' }}
                  >
                    <OutlineLink href={brand.href}>
                      Усі деталі {brand.name} ({brand.total})
                    </OutlineLink>
                  </div>
                </div>
              </div>

              {/* Категорії */}
              <div
                className="flex min-w-0 flex-col self-stretch"
                style={{
                  paddingLeft: 'var(--space-24)',
                  borderLeft: 'var(--border-hairline) solid var(--color-neutral-200)',
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    margin: '0 0 var(--space-8)',
                    paddingLeft: 'var(--space-12)',
                    height: 'var(--control-h-32)',
                    gap: 'var(--space-16)',
                  }}
                >
                  <p
                    className="text-12"
                    style={{
                      margin: 0,
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-neutral-600)',
                    }}
                  >
                    Категорії
                  </p>
                  <button
                    type="button"
                    ref={closeRef}
                    onClick={onClose}
                    aria-label="Закрити каталог"
                    className="flex shrink-0 cursor-pointer items-center justify-center border-0"
                    style={{
                      width: 'var(--control-h-32)',
                      height: 'var(--control-h-32)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      color: 'var(--color-neutral-900)',
                    }}
                  >
                    <Icon d={CLOSE} size="20" />
                  </button>
                </div>
                <div className="flex flex-col">
                  <CatRow href={`${prefix}/catalog?sort=new`} name="Новинки" bold />
                  <CatRow href={`${prefix}/catalog?sort=popular`} name="Популярне" bold />
                  <div
                    style={{
                      margin: 'var(--space-8) var(--space-12)',
                      height: 'var(--border-hairline)',
                      background: 'var(--color-neutral-200)',
                    }}
                  />
                  {data.categories.map((c) => (
                    <CatRow key={c.slug} href={c.href} name={c.name} count={c.count} />
                  ))}
                </div>
                <div
                  className="flex"
                  style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--space-16)',
                    paddingLeft: 'var(--space-12)',
                  }}
                >
                  <OutlineLink href={`${prefix}/catalog`}>Усі категорії</OutlineLink>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  )
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center text-12"
      style={{
        margin: '0 0 var(--space-8)',
        padding: '0 var(--space-12)',
        height: 'var(--control-h-32)',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-neutral-600)',
      }}
    >
      {children}
    </p>
  )
}

function CarBanner({
  carInfo,
  changeCar,
}: {
  carInfo: NonNullable<CarInfo>
  changeCar: () => void
}) {
  return (
    <div
      className="flex items-center"
      style={{
        marginTop: 'var(--space-16)',
        padding: 'var(--space-4) var(--space-8) var(--space-4) var(--space-12)',
        gap: 'var(--space-12)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-neutral-100)',
      }}
    >
      <span
        className="flex items-center"
        style={{
          padding: 'var(--space-4) var(--space-8) var(--space-4) var(--space-4)',
          gap: 'var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-neutral-0)',
        }}
      >
        {carInfo.brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- small brand mark
          <img
            src={carInfo.brand.logo}
            alt=""
            className="block shrink-0"
            style={{
              width: 'var(--icon-16)',
              height: 'var(--icon-16)',
              objectFit: 'contain',
              filter: GRAY,
            }}
          />
        ) : null}
        <span className="whitespace-nowrap text-13" style={{ color: 'var(--color-neutral-600)' }}>
          {carInfo.modelName}
        </span>
      </span>
      <p
        className="min-w-0 flex-1 text-14"
        style={{ margin: 0, color: 'var(--color-neutral-600)' }}
      >
        Показуємо наявність для{' '}
        <strong style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>
          {carInfo.name}
        </strong>
      </p>
      <button
        type="button"
        onClick={changeCar}
        className="flex cursor-pointer items-center border-0 bg-transparent font-sans font-medium text-14"
        style={{
          height: 'var(--control-h-40)',
          padding: '0 var(--space-12)',
          color: 'var(--color-neutral-900)',
          textDecoration: 'underline',
          textUnderlineOffset: 'var(--space-4)',
          textDecorationColor: 'var(--color-neutral-400)',
        }}
      >
        Змінити
      </button>
    </div>
  )
}

function ModelCard({ href, name, line }: { href: string; name: string; line: string }) {
  const [on, setOn] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      className="box-border flex items-center no-underline"
      style={{
        minHeight: '4.75rem',
        padding: 'var(--space-16)',
        gap: 'var(--space-12)',
        borderRadius: 'var(--radius-lg)',
        background: on ? 'var(--color-neutral-200)' : 'var(--color-neutral-100)',
        color: 'var(--color-neutral-900)',
        transition: 'background var(--duration-150) ease-out',
      }}
    >
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 'var(--space-2)' }}>
        <span className="text-18" style={{ fontWeight: 600, textWrap: 'pretty' }}>
          {name}
        </span>
        <span className="text-14" style={{ color: 'var(--color-neutral-600)', textWrap: 'pretty' }}>
          {line}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="box-border flex shrink-0 items-center justify-center"
        style={{
          width: 'var(--control-h-32)',
          height: 'var(--control-h-32)',
          border: 'var(--border-hairline) solid var(--color-primary)',
          borderRadius: 'var(--radius-full)',
          background: on ? 'var(--color-primary-tint)' : 'transparent',
          color: 'var(--color-primary)',
          transition: 'background var(--duration-150) ease-out',
        }}
      >
        <Icon d={ARROW_RIGHT} size="16" />
      </span>
    </a>
  )
}

function OutlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="dls-fill box-border inline-flex items-center no-underline text-14"
      style={{
        height: '2.25rem',
        padding: '0 var(--space-16)',
        gap: 'var(--space-8)',
        border: 'var(--border-hairline) solid var(--color-primary)',
        borderRadius: 'var(--radius-sm)',
        fontWeight: 600,
        color: 'var(--color-primary)',
        ['--dls-fill' as string]: 'var(--color-primary-tint)',
      }}
    >
      {children}
      <Icon d={ARROW_RIGHT} size="16" />
    </a>
  )
}

function CatRow({
  href,
  name,
  count,
  bold,
}: {
  href: string
  name: string
  count?: number
  bold?: boolean
}) {
  const [on, setOn] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      className="box-border flex items-center no-underline"
      style={{
        height: 'var(--control-h-32)',
        padding: '0 var(--space-8) 0 var(--space-12)',
        gap: 'var(--space-8)',
        borderRadius: 'var(--radius-sm)',
        background: on ? 'var(--color-neutral-100)' : 'transparent',
        color: 'var(--color-neutral-900)',
        transition: 'background var(--duration-150) ease-out',
      }}
    >
      <span
        className="min-w-0 flex-1 whitespace-nowrap text-15"
        style={{ fontWeight: bold ? 600 : 400 }}
      >
        {name}
      </span>
      {count !== undefined ? (
        <span
          className="shrink-0 text-14"
          style={{ color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums' }}
        >
          {count}
        </span>
      ) : null}
      <span style={{ color: 'var(--color-neutral-500)' }}>
        <Icon d={CHEVRON_RIGHT} size="16" />
      </span>
    </a>
  )
}

/* ==================================================================== drawer */

function Drawer({
  anchorRef,
  dialogRef,
  closeRef,
  shown,
  data,
  prefix,
  carInfo,
  chrome,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>
  dialogRef: React.RefObject<HTMLDivElement | null>
  closeRef: React.RefObject<HTMLButtonElement | null>
  shown: boolean
  data: MegaMenuData
  prefix: string
  carInfo: CarInfo
  chrome: MegaMenuChrome
  onClose: () => void
}) {
  const [screen, setScreen] = useState<'main' | 'catalog'>('main')
  const searchRef = useRef<HTMLInputElement>(null)

  // Оплата/Гарантія are not standalone pages (that content lives in the home FAQ
  // / Оферта), so they are omitted rather than linking to a dead "#".
  const navRows: { name: string; href: string; chev?: boolean; toCatalog?: boolean }[] = [
    { name: 'Каталог', href: `${prefix}/catalog`, chev: true, toCatalog: true },
    { name: 'Акції', href: `${prefix}/catalog?promo=1` },
    { name: 'Нові надходження', href: `${prefix}/catalog?sort=new` },
    { name: 'Про компанію', href: `${prefix}/about` },
    { name: 'Контакти', href: `${prefix}/contacts`, chev: true },
  ]

  return (
    <div ref={anchorRef} style={{ height: 0 }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          overflow: 'hidden',
          background: 'var(--color-neutral-0)',
          transform: shown ? 'translateX(0)' : 'translateX(100%)',
          visibility: shown ? 'visible' : 'hidden',
          transition: shown
            ? `transform 300ms ${EASE}, visibility 0s linear 0s`
            : 'transform 250ms ease-in, visibility 0s linear 250ms',
          color: 'var(--color-neutral-900)',
        }}
      >
        {/* screen 1 — main nav */}
        <div
          aria-hidden={screen === 'catalog'}
          className="absolute inset-0 flex flex-col"
          style={{
            transform: screen === 'catalog' ? 'translateX(-30%)' : 'translateX(0)',
            transition: `transform 250ms ${EASE}`,
          }}
        >
          <div
            className="grid shrink-0 items-center"
            style={{
              height: 'var(--space-64)',
              padding: '0 var(--space-8)',
              gridTemplateColumns: 'var(--control-h-44) 1fr var(--control-h-44)',
              gap: 'var(--space-8)',
              borderBottom: 'var(--border-hairline) solid var(--color-neutral-200)',
            }}
          >
            <DrawerIconButton ref={closeRef} label="Закрити меню" onClick={onClose}>
              <Icon d={CLOSE} size="24" />
            </DrawerIconButton>
            <a
              href={`${prefix}/`}
              aria-label="DLSAuto — на головну"
              className="justify-self-center no-underline"
              style={{
                fontSize: 'var(--text-20)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: 'var(--color-neutral-900)',
              }}
            >
              <span style={{ fontWeight: 600 }}>DLS</span>
              <span style={{ fontWeight: 400 }}>Auto</span>
            </a>
            <DrawerIconButton
              label="Пошук"
              onClick={() => {
                setScreen('catalog')
                setTimeout(() => searchRef.current?.focus(), 260)
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  width: 'var(--icon-24)',
                  height: 'var(--icon-24)',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.75,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </DrawerIconButton>
          </div>

          <nav
            aria-label="Меню"
            className="min-h-0 flex-1 overflow-y-auto"
            style={{ padding: '0 var(--space-16)' }}
          >
            {navRows.map((r) => (
              <a
                key={r.name}
                href={r.href}
                onClick={
                  r.toCatalog
                    ? (e) => {
                        e.preventDefault()
                        setScreen('catalog')
                      }
                    : undefined
                }
                className="flex items-center justify-between no-underline text-17"
                style={{
                  minHeight: 'var(--control-h-56)',
                  gap: 'var(--space-16)',
                  borderBottom: 'var(--border-hairline) solid var(--color-neutral-200)',
                  fontWeight: 500,
                  color: 'var(--color-neutral-900)',
                }}
              >
                <span>{r.name}</span>
                {r.chev ? (
                  <span style={{ color: 'var(--color-neutral-600)' }}>
                    <Icon d={CHEVRON_RIGHT} size="20" />
                  </span>
                ) : null}
              </a>
            ))}
          </nav>

          <div
            className="flex shrink-0 flex-col"
            style={{
              padding: 'var(--space-16) var(--space-16) 1.25rem',
              gap: 'var(--space-16)',
              borderTop: 'var(--border-hairline) solid var(--color-neutral-200)',
              background: 'var(--color-neutral-0)',
            }}
          >
            <div className="flex items-center justify-between" style={{ gap: 'var(--space-16)' }}>
              <div className="flex flex-col">
                <a
                  href={chrome.phoneHref}
                  className="text-18 no-underline"
                  style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}
                >
                  {chrome.phone}
                </a>
                <span className="text-13" style={{ color: 'var(--color-neutral-600)' }}>
                  {chrome.hours}
                </span>
              </div>
              <div className="flex" style={{ gap: 'var(--space-8)' }}>
                <MessengerLink href={chrome.telegramHref} label="Telegram" />
                <MessengerLink href={chrome.viberHref} label="Viber" />
              </div>
            </div>
            <div
              className="flex items-center text-15"
              style={{ gap: 'var(--space-12)', fontWeight: 500 }}
            >
              <a
                href={`${prefix}/favorites`}
                className="flex items-center no-underline"
                style={{ minHeight: 'var(--control-h-44)', color: 'var(--color-neutral-900)' }}
              >
                Обране
              </a>
              <span aria-hidden="true" style={{ color: 'var(--color-neutral-400)' }}>
                ·
              </span>
              <a
                href={`${prefix}/compare`}
                className="flex items-center no-underline"
                style={{ minHeight: 'var(--control-h-44)', color: 'var(--color-neutral-900)' }}
              >
                Порівняння
              </a>
            </div>
          </div>
        </div>

        {/* screen 2 — catalog */}
        <div
          aria-hidden={screen === 'main'}
          className="absolute inset-0 flex flex-col"
          style={{
            background: 'var(--color-neutral-0)',
            transform: screen === 'catalog' ? 'translateX(0)' : 'translateX(100%)',
            transition: `transform 250ms ${EASE}`,
          }}
        >
          <div
            className="grid shrink-0 items-center"
            style={{
              height: 'var(--space-64)',
              padding: '0 var(--space-8)',
              gridTemplateColumns: 'var(--control-h-44) 1fr var(--control-h-44)',
              gap: 'var(--space-8)',
              borderBottom: 'var(--border-hairline) solid var(--color-neutral-200)',
            }}
          >
            <DrawerIconButton label="Назад" onClick={() => setScreen('main')}>
              <Icon d={CHEVRON_LEFT} size="24" />
            </DrawerIconButton>
            <p className="justify-self-center text-18" style={{ margin: 0, fontWeight: 600 }}>
              Каталог
            </p>
            <DrawerIconButton label="Закрити меню" onClick={onClose}>
              <Icon d={CLOSE} size="24" />
            </DrawerIconButton>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto"
            style={{ padding: 'var(--space-16) var(--space-16) var(--space-32)' }}
          >
            <form
              role="search"
              action={`${prefix}/search`}
              className="flex items-center"
              style={{
                height: 'var(--control-h-48)',
                boxSizing: 'border-box',
                padding: 'var(--space-4) var(--space-4) var(--space-4) 0',
                gap: 'var(--space-8)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-neutral-100)',
              }}
            >
              <input
                ref={searchRef}
                type="search"
                name="q"
                aria-label="Пошук у каталозі"
                placeholder="Назва деталі, OEM-номер або модель авто"
                className="min-w-0 flex-1 font-sans text-16"
                style={{
                  height: 'var(--control-h-40)',
                  boxSizing: 'border-box',
                  padding: '0 var(--space-16)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--color-neutral-900)',
                }}
              />
              <button
                type="submit"
                aria-label="Знайти"
                className="flex shrink-0 cursor-pointer items-center justify-center border-0"
                style={{
                  width: 'var(--control-h-40)',
                  height: 'var(--control-h-40)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-neutral-200)',
                  color: 'var(--color-neutral-900)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{
                    width: 'var(--icon-20)',
                    height: 'var(--icon-20)',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 1.5,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </form>

            {carInfo ? <DrawerCarCard carInfo={carInfo} /> : null}

            <div className="flex flex-col" style={{ marginTop: 'var(--space-8)' }}>
              <DrawerAccordion title="За маркою" defaultOpen>
                <div className="flex flex-col" style={{ paddingBottom: 'var(--space-8)' }}>
                  {data.brands.map((b) => (
                    <BrandAccordion key={b.slug} brand={b} />
                  ))}
                </div>
              </DrawerAccordion>
              <DrawerAccordion title="За категорією">
                <div className="flex flex-col" style={{ paddingBottom: 'var(--space-12)' }}>
                  <DrawerCatRow href={`${prefix}/catalog?sort=new`} name="Новинки" bold />
                  <DrawerCatRow href={`${prefix}/catalog?sort=popular`} name="Популярне" bold />
                  {data.categories.map((c, i) => (
                    <DrawerCatRow
                      key={c.slug}
                      href={c.href}
                      name={c.name}
                      count={c.count}
                      divider={i === 0}
                    />
                  ))}
                </div>
              </DrawerAccordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DrawerIconButton = ({
  ref,
  label,
  onClick,
  children,
}: {
  ref?: React.Ref<HTMLButtonElement>
  label: string
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    aria-label={label}
    className="flex cursor-pointer items-center justify-center border-0"
    style={{
      width: 'var(--control-h-44)',
      height: 'var(--control-h-44)',
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      color: 'var(--color-neutral-900)',
    }}
  >
    {children}
  </button>
)

function MessengerLink({ href, label }: { href: string; label: string }) {
  const d =
    label === 'Telegram'
      ? 'M21.5 4.3 2.9 11.5c-1.1.4-1.1 1.6 0 1.9l4.6 1.4 1.8 5.5c.2.6.9.8 1.4.3l2.5-2.3 4.7 3.5c.6.4 1.4.1 1.6-.6l3.2-15.4c.2-1-.7-1.8-1.7-1.5Z'
      : 'M12 3c5 0 9 3.5 9 8 0 4.5-4 8-9 8-1 0-2-.1-2.9-.4L5 20l1-3.2C4.2 15.3 3 13.3 3 11c0-4.5 4-8 9-8Z'
  return (
    <a
      href={href}
      aria-label={label}
      className="flex items-center justify-center"
      style={{
        width: 'var(--control-h-44)',
        height: 'var(--control-h-44)',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-neutral-100)',
        color: 'var(--color-neutral-600)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          width: 'var(--icon-20)',
          height: 'var(--icon-20)',
          fill: 'currentColor',
          stroke: 'none',
        }}
      >
        <path d={d} />
      </svg>
    </a>
  )
}

function DrawerCarCard({ carInfo }: { carInfo: NonNullable<CarInfo> }) {
  return (
    <div style={{ marginTop: 'var(--space-16)' }}>
      <a
        href={carInfo.brand.href}
        className="box-border flex items-end no-underline"
        style={{
          padding: 'var(--space-16)',
          gap: 'var(--space-12)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-neutral-100)',
          color: 'var(--color-neutral-900)',
        }}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className="flex items-center self-start"
            style={{
              marginBottom: 'var(--space-8)',
              padding: 'var(--space-4) var(--space-8) var(--space-4) var(--space-4)',
              gap: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-neutral-0)',
            }}
          >
            {carInfo.brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- small brand mark
              <img
                src={carInfo.brand.logo}
                alt=""
                className="block"
                style={{
                  width: 'var(--icon-16)',
                  height: 'var(--icon-16)',
                  objectFit: 'contain',
                  filter: GRAY,
                }}
              />
            ) : null}
            <span
              className="text-12"
              style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}
            >
              Ваше авто
            </span>
          </span>
          <span className="text-18" style={{ fontWeight: 600 }}>
            {carInfo.name}
          </span>
          <span
            className="text-14"
            style={{ marginTop: 'var(--space-2)', color: 'var(--color-neutral-600)' }}
          >
            {carInfo.modelName}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 'var(--control-h-40)',
            height: 'var(--control-h-40)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-neutral-0)',
            color: 'var(--color-neutral-900)',
          }}
        >
          <Icon d={ARROW_RIGHT} size="20" />
        </span>
      </a>
    </div>
  )
}

function DrawerAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: 'var(--border-hairline) solid var(--color-neutral-200)' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center border-0 bg-transparent text-left font-sans"
        style={{
          minHeight: 'var(--control-h-56)',
          padding: 'var(--space-8) 0',
          gap: 'var(--space-12)',
          color: 'var(--color-neutral-900)',
        }}
      >
        <span className="min-w-0 flex-1 text-18" style={{ fontWeight: 600 }}>
          {title}
        </span>
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 'var(--control-h-32)',
            height: 'var(--control-h-32)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-neutral-100)',
          }}
        >
          <span
            style={{
              display: 'flex',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--duration-200) ease-out',
            }}
          >
            <Icon d={CHEVRON_DOWN} size="16" />
          </span>
        </span>
      </button>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows var(--duration-200) ease-out',
        }}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

function BrandAccordion({ brand }: { brand: MegaMenuBrand }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center border-0 text-left font-sans"
        style={{
          minHeight: 'var(--control-h-48)',
          boxSizing: 'border-box',
          padding: '0 var(--space-8) 0 var(--space-12)',
          gap: 'var(--space-12)',
          borderRadius: 'var(--radius-sm)',
          background: open ? 'var(--color-neutral-100)' : 'transparent',
          color: 'var(--color-neutral-900)',
        }}
      >
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: 'var(--icon-20)', height: 'var(--icon-20)' }}
        >
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- small brand mark
            <img
              src={brand.logo}
              alt=""
              className="block"
              style={{
                maxWidth: 'var(--icon-20)',
                maxHeight: 'var(--icon-20)',
                objectFit: 'contain',
                filter: GRAY,
              }}
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 text-16" style={{ fontWeight: open ? 600 : 500 }}>
          {brand.name}
        </span>
        <span
          style={{
            display: 'flex',
            color: 'var(--color-neutral-600)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--duration-200) ease-out',
          }}
        >
          <Icon d={CHEVRON_DOWN} size="16" />
        </span>
      </button>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows var(--duration-200) ease-out',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="flex flex-col"
            style={{ padding: 'var(--space-8) 0 var(--space-12)', gap: 'var(--space-8)' }}
          >
            {brand.models.map((m) => (
              <a
                key={m.slug}
                href={m.href}
                className="box-border flex items-end no-underline"
                style={{
                  padding: 'var(--space-16)',
                  gap: 'var(--space-12)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-neutral-100)',
                  color: 'var(--color-neutral-900)',
                }}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-18" style={{ fontWeight: 600 }}>
                    {m.name}
                  </span>
                  <span
                    className="text-14"
                    style={{ marginTop: 'var(--space-2)', color: 'var(--color-neutral-600)' }}
                  >
                    {m.line}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 'var(--control-h-40)',
                    height: 'var(--control-h-40)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-neutral-0)',
                    color: 'var(--color-neutral-900)',
                  }}
                >
                  <Icon d={ARROW_RIGHT} size="20" />
                </span>
              </a>
            ))}
            <a
              href={brand.href}
              className="flex items-center no-underline text-14"
              style={{
                minHeight: 'var(--control-h-44)',
                padding: '0 var(--space-12)',
                fontWeight: 500,
                color: 'var(--color-neutral-900)',
                textDecoration: 'underline',
                textUnderlineOffset: 'var(--space-4)',
                textDecorationColor: 'var(--color-neutral-400)',
              }}
            >
              Усі деталі {brand.name} ({brand.total})
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function DrawerCatRow({
  href,
  name,
  count,
  bold,
  divider,
}: {
  href: string
  name: string
  count?: number
  bold?: boolean
  divider?: boolean
}) {
  return (
    <a
      href={href}
      className="flex items-center no-underline"
      style={{
        minHeight: 'var(--control-h-48)',
        padding: '0 var(--space-4) 0 var(--space-12)',
        gap: 'var(--space-8)',
        borderRadius: 'var(--radius-sm)',
        borderTop: divider ? 'var(--border-hairline) solid var(--color-neutral-200)' : 'none',
        color: 'var(--color-neutral-900)',
      }}
    >
      <span className="min-w-0 flex-1 text-16" style={{ fontWeight: bold ? 600 : 400 }}>
        {name}
      </span>
      {count !== undefined ? (
        <span className="shrink-0 text-14" style={{ color: 'var(--color-neutral-500)' }}>
          {count}
        </span>
      ) : null}
      <span style={{ color: 'var(--color-neutral-500)' }}>
        <Icon d={CHEVRON_RIGHT} size="16" />
      </span>
    </a>
  )
}
