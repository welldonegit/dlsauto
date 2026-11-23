'use client'

import { useEffect, useRef, useState } from 'react'

import type { ProductCardData } from '@/components/ProductCard'
import { showToast } from '@/components/ui/ToastHost'
import type { Availability } from '@/lib/rules'
import { trackAddToWishlist } from '@/lib/analytics'
import { useWishlisted, wishlistToggle } from '@/lib/wishlist'

/**
 * Buy actions for the product page (DLSProduct): the «В кошик» + wishlist buttons
 * inside the buy card, plus the sticky quick-buy bar that fades in once the card
 * actions scroll out of view (wide centred pill ≥1024, bottom sheet below). Cart
 * is stage 5, so «В кошик» fires the "Кошик — етап 5" toast; sold/reserved parts
 * (Р39) close the purchase — the button is disabled with the state label.
 */

const CART_TOAST = { title: 'Кошик — етап 5', description: 'Кошик запрацює на наступному етапі.' }

export function ProductBuyActions({
  item,
  availability,
  priceHtml,
  oldPriceHtml,
  donorLabel,
  brandLogo,
}: {
  item: ProductCardData
  availability: Availability
  priceHtml: string
  oldPriceHtml: string | null
  donorLabel: string
  brandLogo: string | null
}) {
  const faved = useWishlisted(item.id)
  const [barIn, setBarIn] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  const closed = availability === 'sold' || availability === 'reserved'
  const closedLabel = availability === 'sold' ? 'Продано' : 'Заброньовано'

  useEffect(() => {
    const el = actionsRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([en]) =>
      setBarIn(!en.isIntersecting && en.boundingClientRect.top < 0),
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const addToCart = () => showToast(CART_TOAST)
  const toggleFav = () => {
    const nowFaved = wishlistToggle(item.id)
    if (nowFaved) trackAddToWishlist(item)
  }

  const cartBtn = (variant: 'card' | 'bar') =>
    closed ? (
      <button
        type="button"
        disabled
        className={`dls-pd-buy__cart dls-pd-buy__cart--${variant} dls-pd-buy__cart--closed`}
      >
        {closedLabel}
      </button>
    ) : (
      <button
        type="button"
        onClick={addToCart}
        className={`dls-pd-buy__cart dls-pd-buy__cart--${variant}`}
      >
        <CartIcon />
        <span>В кошик</span>
      </button>
    )

  const favBtn = (
    <button
      type="button"
      onClick={toggleFav}
      aria-label={faved ? 'Прибрати з обраного' : 'Додати в обране'}
      aria-pressed={faved}
      className="dls-pd-buy__fav"
    >
      <HeartIcon filled={faved} />
    </button>
  )

  return (
    <>
      <div ref={actionsRef} className="dls-pd-buy__actions">
        {cartBtn('card')}
        {favBtn}
      </div>

      {/* sticky quick-buy bar — fixed, so its DOM position is irrelevant. One markup:
          desktop lays it out in a row (thumb/info left), mobile stacks name over the
          price+actions row. */}
      <div
        role="region"
        aria-label="Швидка покупка"
        aria-hidden={!barIn}
        className="dls-pd-bar"
        data-in={barIn ? 'true' : 'false'}
      >
        <span className="dls-pd-bar__thumb">
          {item.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photos[0]} alt="" />
          ) : null}
        </span>
        <div className="dls-pd-bar__info">
          <span className="dls-pd-bar__iname">{item.name}</span>
          <span className="dls-pd-bar__donor">
            {brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brandLogo} alt="" />
            ) : null}
            <span>{donorLabel}</span>
          </span>
        </div>
        <span className="dls-pd-bar__title">{item.name}</span>
        <div className="dls-pd-bar__buy">
          <span className="dls-pd-bar__price">
            {oldPriceHtml ? <span className="dls-pd-bar__old">{oldPriceHtml}</span> : null}
            <span className="dls-pd-bar__now">{priceHtml}</span>
          </span>
          {cartBtn('bar')}
          {favBtn}
        </div>
      </div>
    </>
  )
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="dls-pd-ico"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="dls-pd-buy__heart"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}
