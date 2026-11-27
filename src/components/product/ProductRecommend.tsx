'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { ProductCard, type ProductCardData } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import { trackAddToCompare } from '@/lib/analytics'
import { compareItems, compareSet } from '@/lib/compare'
import type { FavoritesData } from '@/lib/favorites'
import { useSelectedCar } from '@/lib/selectedCar'

/**
 * «Може знадобитися» (DLSRecommend) — a tabbed block on the product page:
 * «Ще з цього авто» (donor card + the donor's other in-stock parts, §10/Р50),
 * «Альтернативи» (same part from other cars — OEM/cross within the type + model,
 * §12/Р44/Р52) with «Порівняти всі», and — when a car is selected and it differs
 * from this part's own model and has parts — «На ваше авто» (parts for the chosen
 * car, fetched client-side). Server pools come from the reco engine; the car pool
 * from /api/favorites by the cookie car. Empty tabs aren't offered (the car tab
 * stays hidden at 0 parts, not an empty state); empty block hidden.
 */

export type DonorCard = {
  photo: string | null
  title: string
  subtitle: string | null
  partsCount: number
  partsLabel: string
  href: string
}

type TabKey = 'same' | 'alt' | 'car'

export function ProductRecommend({
  sameCar,
  alternatives,
  donor,
  ownModelSlug,
  currentSku,
  locale,
}: {
  sameCar: ProductCardData[]
  alternatives: ProductCardData[]
  donor: DonorCard | null
  ownModelSlug: string | null
  currentSku: string
  locale: Locale
}) {
  const prefix = locale === 'uk' ? '' : '/ru'
  const car = useSelectedCar()
  const [carCards, setCarCards] = useState<ProductCardData[]>([])
  const [carInfo, setCarInfo] = useState<{
    label: string
    logo: string | null
    href: string | null
  } | null>(null)

  // «На ваше авто»: only when a car is chosen, it isn't this part's own model
  // (that one is already «Ще з цього авто»), AND the car has parts to show. The
  // fetch below still runs to learn the count; an empty tab is never offered —
  // the tab simply stays hidden when there are 0 parts (owner decision, 27.11).
  const carSlug = car?.slug
  const showCarTab = !!car && car.slug !== ownModelSlug && carCards.length > 0
  useEffect(() => {
    if (!carSlug || carSlug === ownModelSlug) return
    let alive = true
    const qs = new URLSearchParams({ skus: currentSku, car: carSlug, locale })
    fetch(`/api/favorites?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json() as Promise<FavoritesData>)
      .then((d) => {
        if (!alive) return
        setCarCards(d.more)
        setCarInfo(d.car ? { label: d.car.label, logo: d.car.logo, href: d.car.href } : null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [carSlug, ownModelSlug, currentSku, locale])

  const hasSame = sameCar.length > 0 || !!donor
  const hasAlt = alternatives.length > 0
  const tabs = [
    ...(hasSame
      ? [{ key: 'same' as TabKey, label: 'Ще з цього авто', count: sameCar.length }]
      : []),
    ...(hasAlt
      ? [{ key: 'alt' as TabKey, label: 'Альтернативи', count: alternatives.length }]
      : []),
    ...(showCarTab
      ? [{ key: 'car' as TabKey, label: 'На ваше авто', count: carCards.length }]
      : []),
  ]
  const [tab, setTab] = useState<TabKey>('same')
  const [added, setAdded] = useState(() => {
    const ids = new Set(compareItems())
    return alternatives.length > 0 && alternatives.every((c) => ids.has(c.id))
  })
  const railRef = useRef<HTMLDivElement>(null)

  if (!tabs.length) return null

  const compareAll = () => {
    const ids = new Set(compareItems())
    for (const c of alternatives) {
      if (!ids.has(c.id)) trackAddToCompare(c) // only count newly-added
      compareSet(c.id, true)
    }
    setAdded(true)
  }

  const active = tabs.some((t) => t.key === tab) ? tab : tabs[0].key
  const items = active === 'car' ? carCards : active === 'same' ? sameCar : alternatives

  return (
    <section aria-labelledby="pd-rec-title" className="dls-rec">
      <Container>
        <h2 id="pd-rec-title" className="dls-rec__title">
          Може знадобитися
        </h2>
        <div role="tablist" aria-label="Рекомендації" className="dls-rec__tabs">
          {tabs.map((t) => {
            const on = t.key === active
            return (
              <button
                key={t.key}
                role="tab"
                type="button"
                aria-selected={on}
                className="dls-rec__tab"
                data-on={on ? 'true' : 'false'}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                <span className="dls-rec__tabCount">{t.count}</span>
              </button>
            )
          })}
        </div>

        {active === 'alt' ? (
          <div className="dls-rec__altHead">
            <p>Такі самі деталі з інших авто — порівняйте стан і ціну</p>
            {added ? (
              <Link href={`${prefix}/compare`} className="dls-rec__cmpBtn">
                Відкрити порівняння
              </Link>
            ) : (
              <button type="button" className="dls-rec__cmpBtn" onClick={compareAll}>
                Порівняти всі
              </button>
            )}
          </div>
        ) : null}

        {active === 'car' && car ? (
          <div className="dls-rec__carHead">
            <span className="dls-rec__carChip" title={carInfo?.label ?? car.label}>
              {carInfo?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- small brand mark
                <img src={carInfo.logo} alt="" />
              ) : (
                <span aria-hidden className="dls-rec__carRing" />
              )}
              <span className="dls-rec__carName">{carInfo?.label ?? car.label}</span>
            </span>
            {/* Model page (/brand/<brand>/<model>) once loaded; the car cookie
                has no brand slug, so until the fetch returns carInfo.href fall
                back to the model-scoped catalog (always valid). */}
            <Link
              href={carInfo?.href ?? `${prefix}/catalog?model=${car.slug}`}
              className="dls-rec__carLink"
            >
              Усі деталі на {car.label} →
            </Link>
          </div>
        ) : null}
      </Container>

      <Container>
        <div className="dls-rec__body">
          {active === 'same' && donor ? (
            <article className="dls-rec__donor" aria-label="Авто-донор">
              <div className="dls-rec__donorPhoto">
                {donor.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- donor photo
                  <img src={donor.photo} alt={donor.title} />
                ) : null}
              </div>
              <div className="dls-rec__donorInfo">
                <h3>{donor.title}</h3>
                {donor.subtitle ? <p className="dls-rec__donorSub">{donor.subtitle}</p> : null}
                <dl className="dls-rec__donorStats">
                  <div>
                    <dt>Деталей у наявності</dt>
                    <dd>{donor.partsCount}</dd>
                  </div>
                </dl>
              </div>
              <Link href={donor.href} className="dls-rec__donorLink">
                {donor.partsLabel}
              </Link>
            </article>
          ) : null}

          {items.length ? (
            <div ref={railRef} className="dls-rail dls-rec__rail">
              {items.map((c) => (
                <div key={c.id} className="dls-rec__cardWrap">
                  <ProductCard data={c} listId="recommend" listName="Може знадобитися" />
                </div>
              ))}
            </div>
          ) : (
            <p className="dls-rec__empty">Поки немає інших деталей тут.</p>
          )}
        </div>
      </Container>
    </section>
  )
}
