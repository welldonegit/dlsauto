import { cookies } from 'next/headers'
import Link from 'next/link'

import { ProductCard } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import {
  getBrands,
  getCatalog,
  getCategoryTree,
  getModelsGroupedByBrand,
  type CatalogSort,
} from '@/lib/data'
import { toProductCardData } from '@/lib/productCard'
import type { Media, Model } from '@/payload-types'

import { CatalogFilters, type BrandOpt } from './CatalogFilters'

/**
 * Catalog listing (DLSCatalog) — server component. Reads the filter params,
 * queries the data layer (products + category facets), and renders the
 * breadcrumbs, heading, category rail and the product grid inside the client
 * filter island. Filters are URL-driven (§8); the grid is server-rendered so
 * every filtered view is indexable. Sold products never appear (§5).
 */

const PAGE = 20

export type CatalogSearch = {
  brand?: string
  model?: string
  cat?: string | string[]
  pmin?: string
  pmax?: string
  warr?: string | string[]
  side?: string | string[]
  cond?: string | string[]
  promo?: string
  vid?: string
  car?: string // 'off' — opt out of the cookie car pre-filter for this view
  sort?: string
  shown?: string
}

const arr = (v: string | string[] | undefined): string[] =>
  v == null ? [] : Array.isArray(v) ? v : [v]
const num = (v: string | undefined, d: number) => {
  const n = v != null ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : d
}
const logoUrl = (m: number | Media | null | undefined): string | null =>
  m && typeof m === 'object' ? (m.url ?? null) : null

export async function CatalogView({
  locale,
  category,
  search,
}: {
  locale: Locale
  category: { slug: string; name: string } | null
  search: CatalogSearch
}) {
  const prefix = locale === 'uk' ? '' : '/ru'
  const basePath = category ? `${prefix}/catalog/${category.slug}` : `${prefix}/catalog`

  const PMIN = 100
  const PMAX = 120000
  const sort = (
    ['pop', 'new', 'cheap', 'exp'].includes(search.sort ?? '') ? search.sort : 'pop'
  ) as CatalogSort
  const cats = [...new Set([...(category ? [category.slug] : []), ...arr(search.cat)])]
  const priceFrom = num(search.pmin, PMIN)
  const priceTo = num(search.pmax, PMAX)
  const shown = Math.max(PAGE, num(search.shown, PAGE))
  const video = search.vid === '1'

  const [brandsRaw, tree, modelsByBrand] = await Promise.all([
    getBrands(),
    getCategoryTree(locale),
    getModelsGroupedByBrand(locale),
  ])

  // Only brands that have models become Авто options (others open an empty Модель).
  const brands: BrandOpt[] = brandsRaw
    .filter((b) => b.slug && (modelsByBrand[b.slug as string]?.length ?? 0) > 0)
    .map((b) => ({ slug: b.slug as string, name: b.name }))

  // Selected car cookie ("моє авто"): fit pill on cards, plus — unless an explicit
  // Авто filter is in the URL or the visitor opted out (?car=off) — a pre-filter of
  // the whole listing (Р-decision 4). Reading the cookie makes the route dynamic, so
  // one visitor's car is never cached for another; the canonical stays the clean path.
  let carSlug: string | null = null
  let carLabel: string | null = null
  try {
    const raw = (await cookies()).get('dls_car')?.value
    if (raw) {
      const c = JSON.parse(decodeURIComponent(raw)) as { slug?: string; label?: string }
      carSlug = c.slug ?? null
      carLabel = c.label ?? null
    }
  } catch {
    carSlug = null
    carLabel = null
  }

  // Resolve the effective car: explicit URL Авто filter wins; else the cookie car
  // (unless opted out). The cookie stores the model slug + label — derive its brand
  // from the model groups so the Авто selects pre-fill (matching the export).
  const optedOut = search.car === 'off'
  const cookieBrandSlug = carSlug
    ? (Object.entries(modelsByBrand).find(([, ms]) => ms.some((m) => m.slug === carSlug))?.[0] ??
      null)
    : null
  const cookieApplies = !optedOut && !search.brand && !search.model && !!carSlug
  const effBrand = search.brand || (cookieApplies ? (cookieBrandSlug ?? undefined) : undefined)
  const effModel = search.model || (cookieApplies ? (carSlug ?? undefined) : undefined)

  const { products, total, categoryFacets, hasVideo } = await getCatalog({
    categories: cats,
    brand: effBrand,
    model: effModel,
    priceFrom: priceFrom > PMIN ? priceFrom : undefined,
    priceTo: priceTo < PMAX ? priceTo : undefined,
    warranty: arr(search.warr).map(Number).filter(Boolean),
    sides: arr(search.side).filter((s) => s === 'left' || s === 'right') as ('left' | 'right')[],
    conditions: arr(search.cond),
    promo: search.promo === '1',
    video,
    sort,
    limit: shown,
    locale,
  })

  const logoByBrand = new Map(brandsRaw.map((b) => [b.id, logoUrl(b.logoMono)]))
  const cards = products.map((p) => {
    const data = toProductCardData(p, locale, () => null)
    // depth:1 leaves model.brand as an id — resolve the logo from the brand map.
    const model = p.model && typeof p.model === 'object' ? (p.model as Model) : null
    const brandId =
      model && model.brand != null
        ? typeof model.brand === 'object'
          ? model.brand.id
          : model.brand
        : null
    const brandLogo = brandId != null ? (logoByBrand.get(brandId) ?? null) : null
    const also = (p.alsoFits ?? []).map((m) => (typeof m === 'object' ? (m as Model).slug : null))
    const fits = !!carSlug && (data.modelSlug === carSlug || also.includes(carSlug))
    return { ...data, brandLogo, fits }
  })

  const facets = categoryFacets.map((f) => ({ value: f.slug, label: f.name, count: f.count }))
  const fullCar = !!effBrand && !!effModel
  const carBannerLabel = fullCar
    ? cookieApplies && carLabel
      ? carLabel
      : `${brands.find((b) => b.slug === effBrand)?.name ?? effBrand} ${
          (modelsByBrand[effBrand!] ?? []).find((m) => m.slug === effModel)?.name ?? effModel
        }`
    : cookieApplies && carLabel
      ? carLabel
      : null

  return (
    <main className="dls-cat-page">
      <Container>
        <nav aria-label="Хлібні крихти" className="dls-cat-page__crumbs">
          <Link href={`${prefix}/`} className="dls-cat-page__crumbLink">
            Головна
          </Link>
          <span aria-hidden>/</span>
          {category ? (
            <>
              <Link href={`${prefix}/catalog`} className="dls-cat-page__crumbLink">
                Каталог
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page">{category.name}</span>
            </>
          ) : (
            <span aria-current="page">Каталог</span>
          )}
        </nav>
        <h1 className="dls-cat-page__h1">{category ? category.name : 'Каталог запчастин'}</h1>
        {carBannerLabel ? (
          <p className="dls-cat-page__carLine">
            Показуємо деталі на <strong>{carBannerLabel}</strong>
          </p>
        ) : null}
      </Container>

      {/* category rail */}
      <Container>
        <div className="dls-cat-page__rail">
          {tree.map((c) => (
            <Link
              key={c.slug}
              href={`${prefix}/catalog/${c.slug}`}
              className="dls-cat-page__railCard"
              data-active={c.slug === category?.slug ? 'true' : 'false'}
            >
              <div className="dls-cat-page__railPhoto">
                {c.photo && typeof c.photo === 'object' && c.photo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo.url} alt="" loading="lazy" />
                ) : null}
              </div>
              <div className="dls-cat-page__railName">{c.name}</div>
              <div className="dls-cat-page__railCount">{c.partsCount} деталей</div>
            </Link>
          ))}
        </div>
      </Container>

      <Container>
        <div className="dls-cat-page__body">
          <CatalogFilters
            brands={brands}
            modelsByBrand={modelsByBrand}
            categoryFacets={facets}
            basePath={basePath}
            categoryLocked={category?.slug ?? null}
            carFromCookie={cookieApplies}
            hasVideo={hasVideo}
            current={{
              brand: effBrand ?? '',
              model: effModel ?? '',
              cats,
              priceFrom,
              priceTo,
              warr: arr(search.warr),
              sides: arr(search.side),
              conds: arr(search.cond),
              promo: search.promo === '1',
              video,
              sort,
            }}
          >
            {total > 0 ? (
              <>
                <div className="dls-cat-page__grid">
                  {cards.map((c) => (
                    <div key={c.id} className="dls-cat-page__cell">
                      <ProductCard data={c} listId="catalog" listName="Каталог" />
                    </div>
                  ))}
                </div>
                <div className="dls-cat-page__more">
                  {shown < total ? (
                    <Link
                      href={`${basePath}?${buildShownQuery(search, shown + PAGE)}`}
                      scroll={false}
                      className="dls-cat-page__moreBtn"
                    >
                      Показати ще {Math.min(PAGE, total - shown)}
                    </Link>
                  ) : null}
                  <p className="dls-cat-page__shown">
                    Показано {Math.min(shown, total)} із {total}
                  </p>
                </div>
              </>
            ) : (
              <div className="dls-cat-page__empty">
                <svg viewBox="0 0 24 24" aria-hidden className="dls-cat-page__emptyIcon">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <p className="dls-cat-page__emptyTitle">За цими фільтрами нічого немає</p>
                <p className="dls-cat-page__emptyText">
                  Спробуйте прибрати частину фільтрів або запитайте менеджера — можливо, деталь є,
                  але ще не додана на сайт
                </p>
                <div className="dls-cat-page__emptyActions">
                  <Link href={basePath} className="dls-cat-page__moreBtn">
                    Скинути фільтри
                  </Link>
                  <Link href={`${prefix}/contacts`} className="dls-cat-page__emptyLink">
                    Запитати менеджера
                  </Link>
                </div>
              </div>
            )}
          </CatalogFilters>
        </div>
      </Container>
    </main>
  )
}

function buildShownQuery(search: CatalogSearch, shown: number): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(search)) {
    if (k === 'shown') continue
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x))
    else if (v != null) p.set(k, v)
  }
  p.set('shown', String(shown))
  return p.toString()
}
