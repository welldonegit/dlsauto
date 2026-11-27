'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { showToast } from '@/components/ui/ToastHost'
import type { ProductCardData } from '@/components/ProductCard'
import { useSelectedCar } from '@/lib/selectedCar'
import { useWishlisted, wishlistToggle } from '@/lib/wishlist'

/**
 * Quick-view modal (DLSQuickView export). A product preview without leaving the
 * list: gallery (photos + optional inspection video, arrows, thumbnails),
 * donor/fit pills, OEM + copyable code, stock/warranty/checked badges, price
 * with −N%, add-to-cart + favourite, condition note, a 6-row spec list, the
 * service list and a link to the full product page.
 *
 * Three layouts by width — desktop (≥1024) two columns in a 1040 modal, tablet
 * (768–1023) one column with a sticky action bar, mobile (<768) a bottom-sheet.
 * Esc / scrim close, focus trapped and restored to the opener. Cart is stage 5,
 * so "В кошик" fires the "Кошик — етап 5" toast; the heart writes the wishlist.
 */

const GENERIC_CONDITION =
  'Деталь перевірена, кріплення цілі. Дрібні сліди експлуатації позначені маркером на фото, на роботу не впливають.'

type Slide = { type: 'photo' | 'video'; src: string }

// Positional icons for the service list (shipping · return · payment), as in the
// export. Compact spec per ServiceItem: "pathD|…|circle:cx,cy,r|rect:x,y,w,h,rx".
const SERVICE_ICONS = [
  'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2|M15 18H9|M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14|circle:17,18,2|circle:7,18,2',
  'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8|M21 3v5h-5|M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16|M8 16H3v5',
  'rect:2,5,20,14,2|M2 10h20',
]

const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const uah = (n: number) => `${groupThousands(n)} ₴`

export function QuickView({
  data,
  open,
  onClose,
  services = [],
}: {
  data: ProductCardData
  open: boolean
  onClose: () => void
  /** Service lines (from settings) — one per entry, icons are positional. */
  services?: string[]
}) {
  // Warranty from the product itself (Р14): «Гарантія N днів»; 0 → no badge, no
  // settings fallback (owner 25.11).
  const warranty =
    data.warrantyDays && data.warrantyDays > 0 ? `Гарантія ${data.warrantyDays} днів` : null
  const [shown, setShown] = useState(false)
  const [vw, setVw] = useState(1440)
  const [idx, setIdx] = useState(0)
  const [hoverPhoto, setHoverPhoto] = useState(false)
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const copyT = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fav = useWishlisted(data.id)
  const car = useSelectedCar()

  // viewport width → device
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // enter/exit animation (state set inside rAF, never synchronously in the effect)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(open))
    return () => cancelAnimationFrame(id)
  }, [open])

  // body scroll-lock while open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Esc + focus trap + restore focus to the opener
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const raf = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const f = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
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
      } else if (active && !root.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  useEffect(() => () => clearTimeout(copyT.current), [])

  const device = vw >= 1024 ? 'desktop' : vw >= 768 ? 'tablet' : 'mobile'
  const d = device === 'desktop'
  const t = device === 'tablet'
  const m = device === 'mobile'

  const photos = data.photos.filter(Boolean).length ? data.photos.filter(Boolean) : ['']
  const slides: Slide[] = [
    ...photos.map((src) => ({ type: 'photo' as const, src })),
    ...(data.video ? [{ type: 'video' as const, src: data.video }] : []),
  ]
  const total = slides.length
  const k = Math.min(idx, total - 1)
  const slide = slides[k]
  const go = (n: number) => setIdx(((n % total) + total) % total)

  const fits = !!data.fits || (!!car && !!data.modelSlug && car.slug === data.modelSlug)
  // Availability (Р39, owner 26.11): closed (sold/reserved) → «В кошик» inactive + status label.
  const avail = data.availability ?? (data.status === 'sold' ? 'sold' : 'in_stock')
  const closed = avail !== 'in_stock'
  const statusLabel = avail === 'sold' ? 'Продано' : avail === 'reserved' ? 'Заброньовано' : ''
  const promo = !!data.discountPercent && data.discountPercent > 0 && !closed
  const oldPrice = promo ? Math.round(data.price / (1 - (data.discountPercent as number) / 100)) : 0

  const copy = useCallback(() => {
    const done = () => {
      clearTimeout(copyT.current)
      setCopied(true)
      copyT.current = setTimeout(() => setCopied(false), 2000)
    }
    const value = data.oem ?? data.sku
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done, done)
    else done()
  }, [data.oem, data.sku])

  const addToCart = () =>
    showToast({ title: 'Кошик — етап 5', description: 'Кошик запрацює на наступному етапі.' })
  const toggleFav = () => wishlistToggle(data.id)

  const arrowsShown = hoverPhoto || m

  return (
    <div
      onClick={onClose}
      role="presentation"
      className="fixed inset-0 z-[200] flex justify-center font-sans"
      style={{
        alignItems: m ? 'flex-end' : 'center',
        padding: m ? 'var(--space-24) 0 0' : d ? 'var(--space-32) 4.5rem' : 'var(--space-32)',
        boxSizing: 'border-box',
        background: 'rgba(18,22,28,0.5)',
        backdropFilter: 'blur(0.375rem)',
        WebkitBackdropFilter: 'blur(0.375rem)',
        opacity: shown ? 1 : 0,
        visibility: shown || open ? 'visible' : 'hidden',
        pointerEvents: shown ? 'auto' : 'none',
        transition: 'opacity var(--duration-300) ease-out',
        color: 'var(--color-neutral-900)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qv-title"
        onClick={(e) => e.stopPropagation()}
        className="relative box-border flex flex-col"
        style={{
          width: d ? '65rem' : t ? 'calc(100vw - var(--space-64))' : '100%',
          maxWidth: '100%',
          height: m ? '100%' : 'auto',
          maxHeight: m ? '100%' : 'calc(100vh - var(--space-64))',
          borderRadius: m ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
          background: 'var(--color-neutral-white)',
          boxShadow: 'var(--shadow-md)',
          transform: m
            ? shown
              ? 'translateY(0)'
              : 'translateY(100%)'
            : shown
              ? 'scale(1)'
              : 'scale(0.96)',
          opacity: shown ? 1 : 0,
          transition: `transform var(--duration-300) ease-out, opacity var(--duration-300) ease-out`,
        }}
      >
        {/* close */}
        <button
          type="button"
          ref={closeRef}
          onClick={onClose}
          aria-label="Закрити"
          className="absolute z-[3] flex cursor-pointer items-center justify-center border-0"
          style={{
            top: d ? '0' : m ? '1.25rem' : 'var(--space-16)',
            right: d ? '-3.5rem' : 'var(--space-16)',
            width: 'var(--control-h-40)',
            height: 'var(--control-h-40)',
            padding: 0,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-neutral-white)',
            color: 'var(--color-neutral-900)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CloseGlyph />
        </button>

        {m ? (
          <div
            aria-hidden="true"
            className="flex shrink-0 justify-center"
            style={{ paddingTop: 'var(--space-8)' }}
          >
            <span
              style={{
                width: 'var(--control-h-40)',
                height: 'var(--space-4)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-neutral-300)',
              }}
            />
          </div>
        ) : null}

        <div
          className="min-h-0 flex-1"
          style={{
            overflowY: d ? 'hidden' : 'auto',
            overscrollBehavior: 'contain',
            borderRadius: m ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
          }}
        >
          <div
            className="grid items-start"
            style={{
              padding: d
                ? 'var(--space-32)'
                : m
                  ? 'var(--space-16) var(--space-16) var(--space-24)'
                  : 'var(--space-24)',
              gridTemplateColumns: d ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
              gap: 'var(--space-32)',
            }}
          >
            {/* gallery */}
            <div className="min-w-0">
              <div
                onMouseEnter={() => setHoverPhoto(true)}
                onMouseLeave={() => setHoverPhoto(false)}
                className="relative overflow-hidden"
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-neutral-100)',
                }}
              >
                {slide.type === 'video' ? (
                  <video
                    src={slide.src}
                    controls
                    playsInline
                    muted
                    preload="metadata"
                    aria-label="Відео перевірки деталі"
                    className="absolute inset-0 block h-full w-full"
                    style={{ objectFit: 'cover', background: 'var(--color-neutral-950)' }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- product gallery frame
                  <img
                    src={slide.src}
                    alt={`${data.name} — фото ${k + 1} з ${total}`}
                    className="absolute inset-0 block h-full w-full"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <span
                  className="absolute text-13"
                  style={{
                    top: 'var(--space-12)',
                    left: 'var(--space-12)',
                    padding: 'var(--space-4) 0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-neutral-900)',
                    fontWeight: 500,
                    color: 'var(--color-neutral-0)',
                  }}
                >
                  Фото реальної деталі
                </span>
                <span
                  className="absolute text-13"
                  style={{
                    right: 'var(--space-12)',
                    bottom: 'var(--space-12)',
                    padding: 'var(--space-4) 0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(18,22,28,0.6)',
                    fontWeight: 500,
                    color: 'var(--color-neutral-0)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {k + 1} / {total}
                </span>
                {total > 1 ? (
                  <>
                    <GalleryArrow side="left" shown={arrowsShown} onClick={() => go(k - 1)} />
                    <GalleryArrow side="right" shown={arrowsShown} onClick={() => go(k + 1)} />
                  </>
                ) : null}
              </div>

              {total > 1 ? (
                <div
                  role="tablist"
                  aria-label="Фото деталі"
                  className="flex overflow-x-auto"
                  style={{
                    marginTop: 'var(--space-12)',
                    gap: 'var(--space-8)',
                    scrollbarWidth: 'none',
                  }}
                >
                  {slides.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === k}
                      aria-label={s.type === 'video' ? 'Відео перевірки' : `Фото ${i + 1}`}
                      onClick={() => go(i)}
                      className="relative box-border shrink-0 cursor-pointer overflow-hidden border-0 p-0"
                      style={{
                        width: 'var(--space-64)',
                        height: 'var(--space-64)',
                        border: `var(--border-thick) solid ${i === k ? 'var(--color-neutral-900)' : 'transparent'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-neutral-100)',
                        transition: 'border-color var(--duration-150) ease-out',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- gallery thumbnail */}
                      <img
                        src={s.type === 'video' ? photos[0] : s.src}
                        alt=""
                        className="absolute inset-0 block h-full w-full"
                        style={{ objectFit: 'cover' }}
                      />
                      {s.type === 'video' ? (
                        <span
                          className="absolute inset-0 flex flex-col items-center justify-center text-11"
                          style={{
                            gap: 'var(--space-2)',
                            background: 'rgba(18,22,28,0.55)',
                            color: 'var(--color-neutral-0)',
                          }}
                        >
                          <PlayGlyph />
                          <span style={{ fontWeight: 500 }}>Відео</span>
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* details */}
            <div
              className="min-w-0"
              style={{
                maxHeight: d ? 'calc(100vh - var(--space-64) - var(--space-64))' : 'none',
                overflowY: d ? 'auto' : 'visible',
                overscrollBehavior: 'contain',
                paddingRight: d ? 'var(--space-8)' : '0',
                scrollbarWidth: 'thin',
              }}
            >
              <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-8)' }}>
                {fits ? (
                  <Pill tint>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={iconStyle('14', 'var(--color-success)')}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span
                      className="text-13"
                      style={{ fontWeight: 500, color: 'var(--color-success)' }}
                    >
                      Підходить на ваше авто
                    </span>
                  </Pill>
                ) : (
                  <Pill title={data.model}>
                    {data.brandLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small brand mark
                      <img
                        src={data.brandLogo}
                        alt=""
                        className="block shrink-0"
                        style={{
                          width: 'var(--icon-16)',
                          height: 'var(--icon-16)',
                          objectFit: 'contain',
                        }}
                      />
                    ) : null}
                    <span
                      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-13"
                      style={{ color: 'var(--color-neutral-600)' }}
                    >
                      {data.model}
                    </span>
                  </Pill>
                )}
              </div>

              <h2
                id="qv-title"
                style={{
                  margin: 'var(--space-16) 0 0',
                  fontSize: d ? 'var(--text-28)' : 'var(--text-24)',
                  lineHeight: 1.2,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-neutral-900)',
                  textWrap: 'balance',
                }}
              >
                {data.name}
              </h2>

              <div
                className="flex flex-wrap items-center text-14"
                style={{
                  marginTop: 'var(--space-8)',
                  columnGap: 'var(--space-12)',
                  rowGap: 'var(--space-4)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                <span>{data.oem ? `OEM ${data.oem}` : `Артикул: ${data.sku}`}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 'var(--border-hairline)',
                    height: '0.875rem',
                    background: 'var(--color-neutral-300)',
                  }}
                />
                <span>Код: {data.id}</span>
                <button
                  type="button"
                  onClick={copy}
                  className="flex cursor-pointer items-center border-0 bg-transparent font-sans text-13"
                  style={{
                    marginLeft: 'auto',
                    height: '1.75rem',
                    padding: '0 var(--space-4)',
                    gap: 'var(--space-4)',
                    fontWeight: 500,
                    color: copied ? 'var(--color-success)' : 'var(--color-neutral-600)',
                    transition: 'color var(--duration-150) ease-out',
                  }}
                >
                  {copied ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle('14')}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle('14')}>
                      <rect x="8" y="8" width="14" height="14" rx="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  )}
                  <span>{copied ? 'Скопійовано' : 'Скопіювати'}</span>
                </button>
              </div>

              <div
                className="flex flex-wrap"
                style={{ marginTop: 'var(--space-16)', gap: 'var(--space-8)' }}
              >
                <InfoBadge>
                  {closed ? null : (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 'var(--space-8)',
                        height: 'var(--space-8)',
                        flexShrink: 0,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-success)',
                        animation: 'dls-stock-pulse 1.8s ease-in-out infinite',
                      }}
                    />
                  )}
                  {closed ? statusLabel : data.city ? `В наявності, ${data.city}` : 'В наявності'}
                </InfoBadge>
                {warranty ? (
                  <InfoBadge>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={iconStyle('14', 'var(--color-neutral-600)')}
                    >
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
                    </svg>
                    {warranty}
                  </InfoBadge>
                ) : null}
                <InfoBadge>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={iconStyle('14', 'var(--color-neutral-600)')}
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Перевірено на авто
                </InfoBadge>
              </div>

              <div
                className="flex flex-wrap items-center"
                style={{ marginTop: 'var(--space-24)', gap: 'var(--space-12)' }}
              >
                {promo ? (
                  <span
                    className="whitespace-nowrap text-16"
                    style={{
                      lineHeight: 1.2,
                      color: 'var(--color-neutral-600)',
                      textDecoration: 'line-through',
                    }}
                  >
                    {uah(oldPrice)}
                  </span>
                ) : null}
                <span
                  className="whitespace-nowrap text-32"
                  style={{
                    lineHeight: 1.1,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-neutral-900)',
                  }}
                >
                  {uah(data.price)}
                </span>
                {promo ? (
                  <span
                    className="text-14"
                    style={{
                      padding: 'var(--space-2) var(--space-8)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary)',
                      fontWeight: 600,
                      color: 'var(--color-neutral-0)',
                    }}
                  >
                    −{data.discountPercent}%
                  </span>
                ) : null}
              </div>

              {!t ? (
                <div className="flex" style={{ marginTop: '1.25rem', gap: 'var(--space-8)' }}>
                  <CartButton onClick={addToCart} disabled={closed} />
                  <FavButton fav={fav} onClick={toggleFav} />
                </div>
              ) : null}

              <div
                aria-hidden="true"
                style={{
                  margin: 'var(--space-24) 0',
                  height: 'var(--border-hairline)',
                  background: 'var(--color-neutral-200)',
                }}
              />

              <h3
                className="text-15"
                style={{ margin: 0, fontWeight: 600, color: 'var(--color-neutral-900)' }}
              >
                Стан деталі
              </h3>
              <p
                className="text-15"
                style={{
                  margin: 'var(--space-8) 0 0',
                  lineHeight: 1.5,
                  color: 'var(--color-neutral-900)',
                  textWrap: 'pretty',
                }}
              >
                {data.condition || GENERIC_CONDITION}
              </p>

              {data.specs.length ? (
                <dl className="flex flex-col" style={{ margin: 'var(--space-24) 0 0' }}>
                  {data.specs.map((sp, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between text-14"
                      style={{
                        padding: '0.625rem 0',
                        gap: 'var(--space-16)',
                        borderBottom: 'var(--border-hairline) solid var(--color-neutral-200)',
                      }}
                    >
                      <dt className="shrink-0" style={{ color: 'var(--color-neutral-600)' }}>
                        {sp.k}
                      </dt>
                      <dd
                        className="min-w-0"
                        style={{
                          margin: 0,
                          color: 'var(--color-neutral-900)',
                          textAlign: 'right',
                          textWrap: 'pretty',
                        }}
                      >
                        {sp.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {services.length ? (
                <ul
                  className="flex flex-col text-13"
                  style={{
                    margin: 'var(--space-24) 0 0',
                    padding: 0,
                    listStyle: 'none',
                    gap: 'var(--space-12)',
                    color: 'var(--color-neutral-600)',
                  }}
                >
                  {services.map((s, i) => (
                    <ServiceItem
                      key={i}
                      d={SERVICE_ICONS[i] ?? SERVICE_ICONS[SERVICE_ICONS.length - 1]}
                    >
                      {s}
                    </ServiceItem>
                  ))}
                </ul>
              ) : null}

              <a
                href={data.href}
                className="inline-flex text-15"
                style={{
                  marginTop: 'var(--space-24)',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  textDecoration: 'underline',
                  textDecorationColor: 'transparent',
                  textUnderlineOffset: 'var(--space-4)',
                  transition: 'text-decoration-color var(--duration-150) ease-out',
                }}
              >
                Більше інформації на сторінці товару →
              </a>
            </div>
          </div>

          {/* tablet sticky action bar */}
          {t ? (
            <div
              className="sticky bottom-0 z-[2] flex"
              style={{
                padding: 'var(--space-16) var(--space-24)',
                gap: 'var(--space-8)',
                borderTop: 'var(--border-hairline) solid var(--color-neutral-200)',
                background: 'var(--color-neutral-white)',
              }}
            >
              <CartButton onClick={addToCart} disabled={closed} />
              <FavButton fav={fav} onClick={toggleFav} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

// 14px icons sit between the --icon-* steps (16/20/…); use an explicit rem there.
const iconLen = (size: string) => (size === '14' ? '0.875rem' : `var(--icon-${size})`)
const iconStyle = (size: string, stroke = 'currentColor') => ({
  width: iconLen(size),
  height: iconLen(size),
  flexShrink: 0,
  fill: 'none' as const,
  stroke,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle('20')}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function PlayGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      style={{
        width: 'var(--icon-16)',
        height: 'var(--icon-16)',
        fill: 'currentColor',
        stroke: 'none',
      }}
    >
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

function GalleryArrow({
  side,
  shown,
  onClick,
}: {
  side: 'left' | 'right'
  shown: boolean
  onClick: () => void
}) {
  const off = side === 'left' ? 'translateX(-0.375rem)' : 'translateX(0.375rem)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Попереднє фото' : 'Наступне фото'}
      className="absolute flex cursor-pointer items-center justify-center border-0"
      style={{
        top: '50%',
        [side]: 'var(--space-12)',
        width: 'var(--control-h-40)',
        height: 'var(--control-h-40)',
        marginTop: 'calc(var(--control-h-40) * -0.5)',
        padding: 0,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-neutral-0)',
        color: 'var(--color-neutral-900)',
        boxShadow: 'var(--shadow-sm)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : off,
        transition: 'opacity var(--duration-200) ease-out, transform var(--duration-200) ease-out',
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle('20')}>
        <path d={side === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  )
}

function Pill({
  title,
  tint,
  children,
}: {
  title?: string
  tint?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      title={title}
      className="box-border flex max-w-full items-center"
      style={{
        padding: 'var(--space-4) var(--space-8) var(--space-4) 0.375rem',
        gap: '0.375rem',
        borderRadius: 'var(--radius-sm)',
        background: tint ? 'var(--color-success-tint)' : 'var(--color-neutral-100)',
      }}
    >
      {children}
    </span>
  )
}

function InfoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex items-center text-13"
      style={{
        padding: '0.375rem 0.625rem',
        gap: '0.375rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-neutral-100)',
        color: 'var(--color-neutral-900)',
      }}
    >
      {children}
    </span>
  )
}

function CartButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="dls-fill flex min-w-0 flex-1 items-center justify-center border-0 font-sans text-16"
      style={{
        height: 'var(--control-h-56)',
        boxSizing: 'border-box',
        padding: '0 var(--space-24)',
        gap: 'var(--space-8)',
        borderRadius: 'var(--radius-sm)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer',
        backgroundColor: disabled ? 'var(--color-neutral-200)' : 'var(--color-primary)',
        color: disabled ? 'var(--color-neutral-500)' : 'var(--color-neutral-0)',
        ['--dls-fill' as string]: disabled
          ? 'var(--color-neutral-200)'
          : 'var(--color-primary-dark)',
      }}
    >
      <span>В кошик</span>
    </button>
  )
}

function FavButton({ fav, onClick }: { fav: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={fav ? 'Прибрати з обраного' : 'Додати в обране'}
      aria-pressed={fav}
      className="dls-fill flex shrink-0 cursor-pointer items-center justify-center"
      style={{
        width: 'var(--control-h-56)',
        height: 'var(--control-h-56)',
        padding: 0,
        border: 'var(--border-hairline) solid var(--color-primary)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-primary)',
        ['--dls-fill' as string]: 'var(--color-primary-tint)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          width: '1.375rem',
          height: '1.375rem',
          fill: fav ? 'var(--color-primary)' : 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          transition: 'fill var(--duration-200) ease-out',
        }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  )
}

/** Service-row icon from a compact spec: "pathD|pathD|circle:cx,cy,r|rect:x,y,w,h,rx". */
function ServiceItem({ d, children }: { d: string; children: React.ReactNode }) {
  const parts = d.split('|')
  return (
    <li className="flex items-center" style={{ gap: 'var(--space-8)' }}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          width: 'var(--icon-16)',
          height: 'var(--icon-16)',
          flexShrink: 0,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.75,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        {parts.map((p, i) => {
          if (p.startsWith('circle:')) {
            const [cx, cy, r] = p.slice(7).split(',')
            return <circle key={i} cx={cx} cy={cy} r={r} />
          }
          if (p.startsWith('rect:')) {
            const [x, y, w, h, rx] = p.slice(5).split(',')
            return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />
          }
          return <path key={i} d={p} />
        })}
      </svg>
      {children}
    </li>
  )
}
