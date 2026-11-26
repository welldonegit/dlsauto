'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { ProductCard, type ProductCardData } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import { compareItems, compareSet } from '@/lib/compare'

/**
 * «Може знадобитися» (DLSRecommend) — a tabbed block on the product page:
 * «Ще з цього авто» (donor card + the donor's other in-stock parts, §10/Р50) and
 * «Альтернативи» (same part from other cars — OEM/cross within the type + model,
 * §12/Р44/Р52) with «Порівняти всі». Both pools come from the server (reco
 * engine). Tabs with no content aren't offered; an empty block isn't rendered.
 * The «На ваше авто» tab (car-scoped) is a follow-up.
 */

export type DonorCard = {
  photo: string | null
  title: string
  subtitle: string | null
  partsCount: number
  partsLabel: string
  href: string
}

export function ProductRecommend({
  sameCar,
  alternatives,
  donor,
  locale,
}: {
  sameCar: ProductCardData[]
  alternatives: ProductCardData[]
  donor: DonorCard | null
  locale: Locale
}) {
  const prefix = locale === 'uk' ? '' : '/ru'
  const hasSame = sameCar.length > 0 || !!donor
  const hasAlt = alternatives.length > 0
  const tabs = [
    ...(hasSame ? [{ key: 'same' as const, label: 'Ще з цього авто', count: sameCar.length }] : []),
    ...(hasAlt ? [{ key: 'alt' as const, label: 'Альтернативи', count: alternatives.length }] : []),
  ]
  const [tab, setTab] = useState<'same' | 'alt'>(tabs[0]?.key ?? 'same')
  const [added, setAdded] = useState(() => {
    const ids = new Set(compareItems())
    return alternatives.length > 0 && alternatives.every((c) => ids.has(c.id))
  })
  const railRef = useRef<HTMLDivElement>(null)

  if (!tabs.length) return null

  const compareAll = () => {
    for (const c of alternatives) compareSet(c.id, true)
    setAdded(true)
  }

  const active = tabs.some((t) => t.key === tab) ? tab : tabs[0].key
  const items = active === 'same' ? sameCar : alternatives

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
