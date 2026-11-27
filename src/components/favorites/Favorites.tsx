'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ProductCard, type ProductCardData } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import { showToast } from '@/components/ui/ToastHost'
import type { Locale } from '@/i18n/config'
import type { CarInfo, FavoritesData } from '@/lib/favorites'
import { wishlistClear, wishlistItems, wishlistSet } from '@/lib/wishlist'

/**
 * «Обране» page (DLSFavorites). The wishlist lives in localStorage, so on mount we
 * read the SKUs + selected car and ask the server (one action) for their card data
 * plus a few more parts for the car. The list is then managed locally: removing a
 * card writes the wishlist and offers an undo toast; clearing empties it. Cart is
 * stage 5 → the buy buttons toast. noindex (set by the route).
 */

const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const uah = (n: number) => `${group(n)} ₴`

/** Read the selected-car model slug straight from the cookie (the hook's value lags
 * one render behind hydration, which would make the mount-time load miss the car). */
function carSlugFromCookie(): string | null {
  try {
    const m = document.cookie.match(/(?:^|; )dls_car=([^;]*)/)
    if (!m) return null
    return (JSON.parse(decodeURIComponent(m[1])) as { slug?: string }).slug ?? null
  } catch {
    return null
  }
}

export function Favorites({ locale }: { locale: Locale }) {
  const prefix = locale === 'uk' ? '' : '/ru'
  const [ready, setReady] = useState(false)
  const [cards, setCards] = useState<ProductCardData[]>([])
  const [more, setMore] = useState<ProductCardData[]>([])
  const [carInfo, setCarInfo] = useState<CarInfo | null>(null)
  const [toast, setToast] = useState<{ title: string; undo?: () => void } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fireToast = useCallback((t: { title: string; undo?: () => void }) => {
    setToast(t)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Load once on mount from the wishlist SKUs + the car cookie.
  useEffect(() => {
    let alive = true
    const skus = wishlistItems()
    const carSlug = carSlugFromCookie()
    const qs = new URLSearchParams({ skus: skus.join(','), locale })
    if (carSlug) qs.set('car', carSlug)
    fetch(`/api/favorites?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json() as Promise<FavoritesData>)
      .then((data) => {
        if (!alive) return
        setCards(data.cards)
        setMore(data.more)
        setCarInfo(data.car)
        setReady(true)
      })
      .catch(() => {
        if (alive) setReady(true) // show the (empty) page rather than a stuck spinner
      })
    return () => {
      alive = false
    }
    // Load only on mount — the list is managed locally afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remove = useCallback(
    (card: ProductCardData, index: number) => {
      wishlistSet(card.id, false)
      setCards((cs) => cs.filter((c) => c.id !== card.id))
      fireToast({
        title: 'Видалено з обраного',
        undo: () => {
          wishlistSet(card.id, true)
          setToast(null)
          setCards((cs) => {
            if (cs.some((c) => c.id === card.id)) return cs
            const next = [...cs]
            next.splice(Math.min(index, next.length), 0, card)
            return next
          })
        },
      })
    },
    [fireToast],
  )

  const clearAll = () => {
    wishlistClear()
    setCards([])
  }

  const cartToast = () =>
    showToast({ title: 'Кошик — етап 5', description: 'Кошик запрацює на наступному етапі.' })

  if (!ready) return <main className="dls-fav" aria-busy="true" />

  const isEmpty = cards.length === 0

  return (
    <main className="dls-fav">
      <Container>
        <nav aria-label="Хлібні крихти" className="dls-fav__crumbs">
          <Link href={`${prefix}/`} className="dls-fav__crumbLink">
            Головна
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Обране</span>
        </nav>

        <div className="dls-fav__head">
          <h1 className="dls-fav__h1">
            Обране
            {!isEmpty ? <span className="dls-fav__count">{cards.length}</span> : null}
          </h1>
          {!isEmpty ? (
            <div className="dls-fav__actions">
              <button type="button" onClick={cartToast} className="dls-fav__addAll">
                Додати все в кошик
              </button>
              <button type="button" onClick={clearAll} className="dls-fav__clear">
                Очистити список
              </button>
            </div>
          ) : null}
        </div>

        {isEmpty ? (
          <div className="dls-fav__empty">
            <svg viewBox="0 0 24 24" aria-hidden className="dls-fav__emptyIco">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <p className="dls-fav__emptyTitle">В обраному поки порожньо</p>
            <p className="dls-fav__emptyText">
              Натискайте серце на картці товару — деталь збережеться тут
            </p>
            <Link href={`${prefix}/catalog`} className="dls-fav__emptyBtn">
              До каталогу
            </Link>
          </div>
        ) : (
          <div className="dls-fav__gridWrap">
            <div className="dls-fav__grid" data-count={Math.min(cards.length, 5)}>
              {cards.map((c, i) => (
                <FavoriteCard
                  key={c.id}
                  card={c}
                  prefix={prefix}
                  onRemove={() => remove(c, i)}
                  onCart={cartToast}
                />
              ))}
            </div>
          </div>
        )}
      </Container>

      {!isEmpty && more.length && carInfo ? (
        <section aria-labelledby="fav-more" className="dls-fav__more">
          <Container>
            <div className="dls-fav__moreHead">
              <h2 id="fav-more" className="dls-fav__moreTitle">
                Ще на ваше авто
              </h2>
              <p className="dls-fav__moreCar">
                {carInfo.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={carInfo.logo} alt="" />
                ) : null}
                <span>{carInfo.label}</span>
              </p>
            </div>
          </Container>
          <MoreRail items={more} />
        </section>
      ) : null}

      <div
        role="status"
        aria-live="polite"
        className="dls-fav__toast"
        data-show={toast ? 'true' : 'false'}
      >
        {toast ? (
          <>
            <svg viewBox="0 0 24 24" aria-hidden className="dls-fav__toastIco">
              <path
                d="M20 6 9 17l-5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="dls-fav__toastText">{toast.title}</span>
            {toast.undo ? (
              <button type="button" onClick={toast.undo} className="dls-fav__toastUndo">
                Повернути
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Закрити"
              onClick={() => setToast(null)}
              className="dls-fav__toastClose"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </>
        ) : null}
      </div>
    </main>
  )
}

function FavoriteCard({
  card,
  prefix,
  onRemove,
  onCart,
}: {
  card: ProductCardData
  prefix: string
  onRemove: () => void
  onCart: () => void
}) {
  // Availability drives the closed state (Р39): both sold and reserved close the
  // purchase and show a status badge. `card.status` collapses reserved → in_stock,
  // so key off the richer `card.availability`.
  const avail = card.availability ?? (card.status === 'sold' ? 'sold' : 'in_stock')
  const closed = avail === 'sold' || avail === 'reserved'
  const statusLabel = avail === 'reserved' ? 'Заброньовано' : 'Продано'
  const similar = card.modelSlug ? `${prefix}/catalog?model=${card.modelSlug}` : `${prefix}/catalog`
  return (
    <div className="dls-fav__cell">
      <div className="dls-fav__photo">
        {card.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photos[0]} alt={card.name} data-sold={closed ? 'true' : 'false'} />
        ) : null}
        {closed ? <span className="dls-fav__soldBadge">{statusLabel}</span> : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Прибрати з обраного"
          aria-pressed="true"
          className="dls-fav__unfav"
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
      {card.model ? (
        <span className="dls-fav__donor" title={card.model}>
          {card.brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.brandLogo} alt="" />
          ) : null}
          <span>{card.model}</span>
        </span>
      ) : null}
      <p className="dls-fav__name">
        <Link href={card.href}>{card.name}</Link>
      </p>
      <p className="dls-fav__oem">Артикул: OEM {card.oem}</p>
      <div className="dls-fav__priceRow">
        {closed ? (
          <p className="dls-fav__gone">Деталі вже немає</p>
        ) : (
          <p className="dls-fav__price">{uah(card.price)}</p>
        )}
      </div>
      {closed ? (
        <Link href={similar} className="dls-fav__similar">
          Знайти схожу
        </Link>
      ) : (
        <button type="button" onClick={onCart} className="dls-fav__cart">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
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
          <span>В кошик</span>
        </button>
      )}
    </div>
  )
}

function MoreRail({ items }: { items: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return
    setAtStart(el.scrollLeft <= 2)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])
  useEffect(() => {
    sync()
  }, [sync])

  const nudge = (dir: number) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.9), behavior: 'smooth' })
  }

  return (
    <div className="dls-fav__railOuter">
      <Container>
        <div className="dls-fav__railArrows">
          <button
            type="button"
            aria-label="Попередні"
            onClick={() => nudge(-1)}
            disabled={atStart}
            className="dls-fav__railArrow"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Наступні"
            onClick={() => nudge(1)}
            disabled={atEnd}
            className="dls-fav__railArrow"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </Container>
      <div ref={ref} onScroll={sync} className="dls-rail dls-fav__rail">
        {items.map((c) => (
          <div key={c.id} className="dls-fav__railCell">
            <ProductCard data={c} listId="favorites-more" listName="Ще на ваше авто" />
          </div>
        ))}
      </div>
    </div>
  )
}
