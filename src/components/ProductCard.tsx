'use client'

import { useState } from 'react'

import { showToast } from '@/components/ui/ToastHost'
import { useSelectedCar } from '@/lib/selectedCar'
import { useWishlisted, wishlistToggle } from '@/lib/wishlist'

/**
 * ProductCard — the keystone card (DLSProductCard export). Fixed 4/5 photo with
 * a hover-revealed carousel (arrows + dots), wishlist heart and quick-view eye;
 * below it the fit/donor pill, name, OEM, stock line and price, then a cart
 * control. On hover the card lifts, a white backing card grows in behind it and
 * a "Характеристики" panel reveals underneath.
 *
 * States (all from data): in_stock · discount (−N% badge, struck price, red
 * price) · featured (running conic frame) · popular · sold (dimmed, "Продано",
 * "Знайти схожу") · fits ("Підходить на ваше авто" replaces the donor pill).
 *
 * Behaviours per stage 3b: heart → localStorage wishlist (header badge); cart →
 * toast "Кошик — етап 5" (cart is stage 5); quick-view → optional handler, wired
 * to the QuickView modal when it lands. Links are real §8 URLs (pages in 3c).
 */

const EASE = 'var(--ease-brand)'
const tr = (props: string[], ms: number, delay = 0) =>
  props.map((p) => `${p} ${ms}ms ${EASE} ${delay}ms`).join(', ')

export type ProductCardData = {
  id: string
  href: string
  name: string
  oem: string
  price: number
  /** Discount percent → "−N%" badge, struck old price, red current price. */
  discountPercent?: number | null
  /** Donor/model label shown in the pill (e.g. "Ranger 2006–2012"). */
  model: string
  /** Model slug — matched against the selected car to show the "fits" pill. */
  modelSlug?: string | null
  brandLogo?: string | null
  status: 'in_stock' | 'sold'
  featured?: boolean
  popular?: boolean
  fits?: boolean
  photos: string[]
  city: string
  specs: { k: string; v: string }[]
}

const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const uah = (n: number) => `${groupThousands(n)} ₴`

export function ProductCard({
  data,
  fullCart = false,
  onQuickView,
}: {
  data: ProductCardData
  /** Full-width "В кошик" button instead of the compact icon cart. */
  fullCart?: boolean
  onQuickView?: (data: ProductCardData) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [photo, setPhoto] = useState(0)
  const [pop, setPop] = useState(0)
  const fav = useWishlisted(data.id)
  const car = useSelectedCar()
  // "Підходить на ваше авто" when the chosen car matches this part's model.
  const fits = !!data.fits || (!!car && !!data.modelSlug && car.slug === data.modelSlug)

  const sold = data.status === 'sold'
  const promo = !!data.discountPercent && data.discountPercent > 0 && !sold
  const oldPrice = promo ? Math.round(data.price / (1 - (data.discountPercent as number) / 100)) : 0
  const showPopular = !promo && !sold && !!data.popular
  const photos = data.photos.length ? data.photos : ['']
  const hasCarousel = photos.length > 1
  const k = Math.min(photo, photos.length - 1)
  const step = (d: number) => setPhoto((s) => (s + d + photos.length) % photos.length)

  const toggleFav = () => {
    const nowFav = wishlistToggle(data.id)
    if (nowFav) setPop((p) => p + 1)
  }
  const addToCart = () =>
    showToast({ title: 'Кошик — етап 5', description: 'Кошик запрацює на наступному етапі.' })

  const hov = hovered
  const badgeStyle = {
    position: 'absolute' as const,
    top: 'var(--space-8)',
    left: 'var(--space-8)',
    padding: 'var(--space-2) var(--space-8)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-14)',
    lineHeight: 'var(--text-14--line-height)',
    fontWeight: 500,
  }

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative box-border flex h-full w-full min-w-0 font-sans"
      style={{
        color: 'var(--color-neutral-900)',
        transform: hov ? 'translateY(-0.25rem)' : 'none',
        transition: tr(['transform'], hov ? 420 : 280),
      }}
    >
      {/* backing card (grows in on hover, extends down over the specs panel) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 'calc(var(--space-16) * -1)',
          left: 'calc(var(--space-16) * -1)',
          right: 'calc(var(--space-16) * -1)',
          bottom: hov ? '-9.125rem' : 'calc(var(--space-16) * -1)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-neutral-white)',
          opacity: hov ? 1 : 0,
          boxShadow: hov ? '0 0.25rem 1rem rgba(18,22,28,0.08)' : 'none',
          transform: hov ? 'scale(1)' : 'scale(0.98)',
          transformOrigin: '50% 0',
          transition: tr(['bottom', 'opacity', 'box-shadow', 'transform'], hov ? 420 : 280),
        }}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* photo */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '4 / 5',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-neutral-white)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- product photo carousel frame */}
          <img
            src={photos[k]}
            alt={`Фото деталі: ${data.name.toLowerCase()} — ${k + 1} з ${photos.length}`}
            className="absolute inset-0 block h-full w-full"
            style={{ objectFit: 'cover', opacity: sold ? 0.5 : 1 }}
          />
          {data.featured && !sold ? <RunningFrame /> : null}

          {promo ? (
            <span
              style={{
                ...badgeStyle,
                background: 'var(--color-primary)',
                color: 'var(--color-neutral-0)',
              }}
            >
              −{data.discountPercent}%
            </span>
          ) : sold ? (
            <span
              style={{
                ...badgeStyle,
                background: 'var(--color-neutral-900)',
                color: 'var(--color-neutral-0)',
              }}
            >
              Продано
            </span>
          ) : showPopular ? (
            <span
              style={{
                ...badgeStyle,
                background: 'var(--color-neutral-0)',
                color: 'var(--color-neutral-900)',
              }}
            >
              Популярне
            </span>
          ) : null}

          {/* top-right actions */}
          <div
            className="absolute flex flex-col"
            style={{
              zIndex: 1,
              top: 'var(--space-8)',
              right: 'var(--space-8)',
              gap: 'var(--space-8)',
            }}
          >
            <RoundButton
              label={fav ? 'Прибрати з обраного' : 'Додати в обране'}
              onClick={toggleFav}
              ariaPressed={fav}
              color={fav ? 'var(--color-primary)' : 'var(--color-neutral-900)'}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                style={{
                  width: '1.125rem',
                  height: '1.125rem',
                  fill: fav ? 'var(--color-primary)' : 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  transition: 'fill var(--duration-200) var(--ease-brand)',
                  animation:
                    pop && fav
                      ? `dls-heart-pop-${pop % 2 ? 'a' : 'b'} var(--duration-300) var(--ease-brand)`
                      : 'none',
                }}
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </RoundButton>
            <RoundButton
              label="Швидкий перегляд"
              onClick={() => onQuickView?.(data)}
              color="var(--color-neutral-900)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                style={{
                  width: '1.125rem',
                  height: '1.125rem',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </RoundButton>
          </div>

          {/* carousel (hover) */}
          {hasCarousel ? (
            <div
              style={{
                opacity: hov ? 1 : 0,
                pointerEvents: hov ? 'auto' : 'none',
                transition: tr(['opacity'], hov ? 320 : 160, hov ? 60 : 0),
              }}
            >
              <CarouselArrow side="left" hovered={hov} onClick={() => step(-1)} />
              <CarouselArrow side="right" hovered={hov} onClick={() => step(1)} />
              <div
                className="absolute flex justify-center"
                style={{ left: 0, right: 0, bottom: 'var(--space-8)', gap: 'var(--space-4)' }}
              >
                {photos.map((_, j) => (
                  <span
                    key={j}
                    style={{
                      width: 'var(--space-8)',
                      height: 'var(--space-8)',
                      borderRadius: 'var(--radius-full)',
                      background: j === k ? 'var(--color-neutral-900)' : 'var(--color-neutral-300)',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* fit / donor pill */}
        {fits ? (
          <Pill>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
              style={{
                width: '0.875rem',
                height: '0.875rem',
                flexShrink: 0,
                fill: 'none',
                stroke: 'var(--color-success)',
                strokeWidth: 2,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <PillText>Підходить на ваше авто</PillText>
          </Pill>
        ) : (
          <Pill title={data.model}>
            {data.brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element -- small brand mark
              <img
                src={data.brandLogo}
                alt=""
                className="block shrink-0"
                style={{ width: 'var(--icon-16)', height: 'var(--icon-16)', objectFit: 'contain' }}
              />
            ) : (
              <span
                aria-hidden="true"
                className="box-border shrink-0 rounded-full"
                style={{
                  width: 'var(--icon-16)',
                  height: 'var(--icon-16)',
                  border: 'calc(var(--border-hairline) * 1.5) solid var(--color-neutral-900)',
                }}
              />
            )}
            <PillText>{data.model}</PillText>
          </Pill>
        )}

        <h3
          title={data.name}
          className="overflow-hidden text-ellipsis whitespace-nowrap text-16"
          style={{
            margin: 'var(--space-8) 0 0',
            height: '1.375rem',
            lineHeight: '1.375rem',
            fontWeight: 600,
            color: 'var(--color-neutral-900)',
          }}
        >
          <a href={data.href} style={{ color: 'inherit', textDecoration: 'none' }}>
            {data.name}
          </a>
        </h3>
        <p
          className="overflow-hidden text-ellipsis whitespace-nowrap text-13"
          style={{ margin: 'var(--space-4) 0 0', color: 'var(--color-neutral-600)' }}
        >
          Артикул: OEM {data.oem}
        </p>
        {!sold ? (
          <p
            className="flex items-center whitespace-nowrap text-13"
            style={{
              margin: 'var(--space-4) 0 0',
              gap: '0.375rem',
              color: 'var(--color-neutral-600)',
            }}
          >
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
            <span>В наявності, {data.city}</span>
          </p>
        ) : null}

        {/* price + cart */}
        <div
          className="flex items-end"
          style={{ marginTop: 'auto', paddingTop: 'var(--space-16)', gap: 'var(--space-8)' }}
        >
          <div className="min-w-0 flex-1">
            {promo ? (
              <p
                className="text-13"
                style={{
                  margin: 0,
                  color: 'var(--color-neutral-600)',
                  textDecoration: 'line-through',
                }}
              >
                {uah(oldPrice)}
              </p>
            ) : null}
            {!sold ? (
              <p
                className="whitespace-nowrap text-20"
                style={{
                  margin: 0,
                  lineHeight: 1.2,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: promo ? 'var(--color-primary)' : 'var(--color-neutral-900)',
                }}
              >
                {uah(data.price)}
              </p>
            ) : (
              <p
                className="text-14"
                style={{
                  margin: 0,
                  lineHeight: 'var(--space-24)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                Деталі вже немає
              </p>
            )}
          </div>
          {!fullCart && !sold ? (
            <button
              type="button"
              onClick={addToCart}
              aria-label="Додати в кошик"
              className="flex shrink-0 cursor-pointer items-center justify-center border-0"
              style={{
                width: 'var(--control-h-40)',
                height: 'var(--control-h-40)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                color: 'var(--color-neutral-0)',
              }}
            >
              <CartGlyph />
            </button>
          ) : null}
        </div>

        {fullCart && !sold ? (
          <button
            type="button"
            onClick={addToCart}
            aria-label="Додати в кошик"
            className="dls-fill mt-[var(--space-12)] flex h-[var(--control-h-48)] w-full cursor-pointer items-center justify-center border-0 font-sans text-16"
            style={{
              boxSizing: 'border-box',
              padding: '0 var(--space-16)',
              gap: 'var(--space-8)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-neutral-0)',
              ['--dls-fill' as string]: 'var(--color-primary-dark)',
            }}
          >
            <span>В кошик</span>
          </button>
        ) : null}

        {sold ? (
          <a
            href={data.href}
            aria-label={`Знайти схожу: ${data.name}`}
            className="dls-fill mt-[var(--space-12)] flex h-[var(--control-h-48)] w-full items-center justify-center whitespace-nowrap text-16 no-underline"
            style={{
              boxSizing: 'border-box',
              padding: '0 var(--space-16)',
              border: 'var(--border-hairline) solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              color: 'var(--color-primary)',
              ['--dls-fill' as string]: 'var(--color-primary-tint)',
            }}
          >
            Знайти схожу
          </a>
        ) : null}

        {/* specs panel (revealed under the card on hover) */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--space-16))',
            left: 0,
            right: 0,
            opacity: hov ? 1 : 0,
            pointerEvents: hov ? 'auto' : 'none',
            transform: hov ? 'none' : 'translateY(var(--space-8))',
            transition: tr(['opacity', 'transform'], hov ? 380 : 160, hov ? 100 : 0),
          }}
        >
          <p
            className="text-14"
            style={{ margin: 0, fontWeight: 600, color: 'var(--color-neutral-900)' }}
          >
            Характеристики
          </p>
          <dl
            className="flex flex-col"
            style={{ margin: 'var(--space-8) 0 0', gap: 'var(--space-4)' }}
          >
            {data.specs.slice(0, 4).map((sp, i) => (
              <div
                key={i}
                className="flex justify-between text-13"
                style={{ gap: 'var(--space-12)' }}
              >
                <dt
                  className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ color: 'var(--color-neutral-600)' }}
                >
                  {sp.k}
                </dt>
                <dd
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-right"
                  style={{
                    margin: 0,
                    flexShrink: 0,
                    maxWidth: '60%',
                    color: 'var(--color-neutral-900)',
                  }}
                >
                  {sp.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  )
}

function RunningFrame() {
  const mask = 'linear-gradient(rgba(0,0,0,1) 0 0) content-box, linear-gradient(rgba(0,0,0,1) 0 0)'
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        padding: 'var(--border-thick)',
        boxSizing: 'border-box',
        borderRadius: 'var(--radius-sm)',
        pointerEvents: 'none',
        background:
          'conic-gradient(from var(--dlsA), rgba(224,0,27,0) 0deg, rgba(224,0,27,0) 144deg, var(--color-primary) 360deg)',
        WebkitMask: mask,
        WebkitMaskComposite: 'xor',
        mask,
        maskComposite: 'exclude',
        animation: 'dls-spin 3.5s linear infinite',
      }}
    />
  )
}

function RoundButton({
  label,
  onClick,
  ariaPressed,
  color,
  children,
}: {
  label: string
  onClick: () => void
  ariaPressed?: boolean
  color: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={ariaPressed}
      className="dls-round-fill flex cursor-pointer items-center justify-center border-0"
      style={{
        width: 'var(--control-h-32)',
        height: 'var(--control-h-32)',
        padding: 0,
        borderRadius: 'var(--radius-full)',
        ['--dls-rf-color' as string]: color,
      }}
    >
      {children}
    </button>
  )
}

function CarouselArrow({
  side,
  hovered,
  onClick,
}: {
  side: 'left' | 'right'
  hovered: boolean
  onClick: () => void
}) {
  const hidden = side === 'left' ? 'translateX(-0.5rem)' : 'translateX(0.5rem)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Попереднє фото' : 'Наступне фото'}
      className="absolute flex cursor-pointer items-center justify-center border-0"
      style={{
        top: '50%',
        [side]: 'var(--space-8)',
        width: 'var(--control-h-32)',
        height: 'var(--control-h-32)',
        marginTop: 'calc(var(--control-h-32) * -0.5)',
        transform: hovered ? 'none' : hidden,
        transition: tr(['transform'], hovered ? 420 : 200, hovered ? 60 : 0),
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-neutral-0)',
        color: 'var(--color-neutral-900)',
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
        <path d={side === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  )
}

function CartGlyph() {
  return (
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
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function Pill({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className="box-border flex max-w-full items-center self-start"
      style={{
        marginTop: 'var(--space-16)',
        padding: 'var(--space-4) var(--space-8) var(--space-4) 0.375rem',
        gap: '0.375rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-neutral-100)',
      }}
    >
      {children}
    </span>
  )
}

function PillText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-13"
      style={{ color: 'var(--color-neutral-600)' }}
    >
      {children}
    </span>
  )
}
