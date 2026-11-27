import Link from 'next/link'

import type { ProductCardData } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import { toReco, relatedTypesOf } from '@/lib/reco'
import { toProductCardData } from '@/lib/productCard'
import { alternatives, availability, boughtTogether, fromSameCar, modelYears } from '@/lib/rules'
import { formatScheduleLabel } from '@/lib/schedule'
import type { Brand, Donor, Media, Model, Product } from '@/payload-types'

import { ProductBuyActions } from './ProductBuyActions'
import { ProductCarFit, type BrandOpt } from './ProductCarFit'
import { CompatValue } from './ProductCompat'
import { ProductDelivery, type DeliveryCopy } from './ProductDelivery'
import { ProductGallery, type Slide } from './ProductGallery'
import { ProductRecent } from './ProductRecent'
import { ProductRecommend, type DonorCard } from './ProductRecommend'
import { ProductSpecList, type SpecRow } from './ProductSpecList'
import { CartAddButton, OemCopy, ViewItemTracker } from './ProductBits'

/**
 * Product page (DLSProduct) — server component. Resolves the gallery, the car-fit
 * row, the buy card, «Стан деталі» and «З цим товаром купують» (boughtTogether on
 * the fly, Р25/Р37). Sold/reserved parts keep a 200 and close the purchase (Р39).
 * Delivery & payment sections land in a follow-up (carrier/payment logo assets +
 * editable copy). Recommendation blocks (DLSRecommend/DLSRecent) follow too.
 */

const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const uah = (n: number) => `${group(n)} ₴`

const COND_LABEL: Record<string, string> = {
  used_checked: 'Б/в, перевірений',
  used: 'Б/в',
  used_defects: 'Б/в, з дефектами',
  new: 'Новий',
}

const mediaUrl = (m: number | Media | null | undefined): string | null =>
  m && typeof m === 'object' ? (m.sizes?.card?.url ?? m.url ?? null) : null

function modelShort(model: Model): string {
  const years = modelYears(model)
  return years ? `${model.name} ${years}` : model.name
}

/** "Ford Ranger 2006–2012" — brand + name + years, for the «Сумісність» list (Р53). */
function modelFull(model: Model): string {
  const brand = model.brand && typeof model.brand === 'object' ? (model.brand as Brand) : null
  return `${brand ? brand.name + ' ' : ''}${modelShort(model)}`.trim()
}

export function ProductView({
  product,
  pool,
  category,
  brands,
  modelsByBrand,
  brandLogoById,
  delivery,
  locale,
}: {
  product: Product
  pool: Product[]
  category: { slug: string; name: string } | null
  delivery: DeliveryCopy
  brands: BrandOpt[]
  modelsByBrand: Record<string, BrandOpt[]>
  brandLogoById: Map<number, string | null>
  locale: Locale
}) {
  const prefix = locale === 'uk' ? '' : '/ru'

  // Gallery slides: image photos first, inspection video (mp4) last.
  const photoImgs: string[] = []
  let videoSrc: string | null = null
  for (const m of product.photos ?? []) {
    if (m && typeof m === 'object') {
      if (m.mimeType?.startsWith('video/')) videoSrc = m.url ?? null
      else {
        const u = m.sizes?.card?.url ?? m.url
        if (u) photoImgs.push(u)
      }
    }
  }
  const slides: Slide[] = photoImgs.map((src) => ({ src, isVideo: false }))
  if (videoSrc) slides.push({ src: photoImgs[0] ?? '', isVideo: true, videoSrc })

  // Model / brand / donor labels. The brand/model badge (above the title, in the
  // card and the sticky bar) falls back to the first «також підходить» model when
  // the part has no primary model (wheels/tyres by size, Р49) — never empty (point C).
  const ownModel =
    product.model && typeof product.model === 'object' ? (product.model as Model) : null
  const alsoFitsModelObjs = (product.alsoFits ?? []).filter(
    (m): m is Model => typeof m === 'object' && m !== null,
  )
  const model = ownModel ?? alsoFitsModelObjs[0] ?? null
  const brand =
    model && model.brand && typeof model.brand === 'object' ? (model.brand as Brand) : null
  const donorLabel = model ? `${brand ? brand.name + ' ' : ''}${modelShort(model)}`.trim() : ''
  const brandLogo = brand ? (brandLogoById.get(brand.id) ?? null) : null
  const fitSlugs = [
    ...(model?.slug ? [model.slug] : []),
    ...(product.alsoFits ?? []).map((m) => (typeof m === 'object' ? (m as Model).slug : null)),
  ].filter((s): s is string => !!s)
  // «Сумісність» (Р53): own model + every alsoFits model, no cap, de-duplicated.
  const compatModels = [
    ...(model ? [modelFull(model)] : []),
    ...(product.alsoFits ?? [])
      .filter((m): m is Model => typeof m === 'object' && m !== null)
      .map(modelFull),
  ].filter((v, i, a) => v && a.indexOf(v) === i)

  const avail = availability({
    status: product.status,
    quantity: product.quantity,
    inReserve: product.inReserve ?? 0,
  })
  const oem = product.oem?.[0]?.number ?? null
  // Cross / replacement numbers (Р52) — rendered as a row in the «Характеристики»
  // list below (owner decision 25.11).
  const crossNums = (product.crossNumbers ?? [])
    .map((c) => c.number?.trim())
    .filter((n): n is string => !!n)
  const pickup =
    product.pickupPoint && typeof product.pickupPoint === 'object' ? product.pickupPoint : null
  const stockCity = pickup?.name ?? ''

  const promo = !!product.discountPercent && product.discountPercent > 0 && avail === 'in_stock'
  const oldPrice = promo
    ? Math.round(product.price / (1 - (product.discountPercent as number) / 100))
    : 0
  const priceHtml = uah(product.price)
  const oldPriceHtml = promo ? uah(oldPrice) : null

  // «З цим товаром купують» (Р37) — related types with the side condition, donor first.
  const reco = toReco(product)
  const recoPool = pool.map(toReco)
  const byId = new Map(pool.map((p) => [p.id, p]))
  const withItems = boughtTogether(reco, recoPool, relatedTypesOf(product), 3)
    .map((r) => byId.get(r.id))
    .filter((p): p is Product => !!p)
    .map((p) => {
      const pm = p.model && typeof p.model === 'object' ? (p.model as Model) : null
      const pb = pm && pm.brand && typeof pm.brand === 'object' ? (pm.brand as Brand) : null
      const firstPhoto = (p.photos ?? []).find(
        (m) => m && typeof m === 'object' && !m.mimeType?.startsWith('video/'),
      )
      return {
        sku: p.sku,
        href: `${prefix}/product/${p.slug ?? p.id}-${p.sku}`,
        name: p.name,
        photo: mediaUrl(firstPhoto),
        donor: pm ? `${pb ? pb.name + ' ' : ''}${modelShort(pm)}`.trim() : '',
        price: uah(p.price),
      }
    })

  // «Характеристики» list (owner decision 25.11): Стан → характеристики категорії →
  // Пробіг донора → Сумісність → Крос-номери → Авто-донор. Empty rows dropped by
  // ProductSpecList. Placed under «Стан деталі».
  const donorObj =
    product.donor && typeof product.donor === 'object' ? (product.donor as Donor) : null
  const donorMileage = donorObj?.mileage ? `${group(donorObj.mileage)} км` : null
  const specRows: SpecRow[] = [
    { k: 'Стан', v: COND_LABEL[product.conditionLabel] },
    ...(product.specValues ?? []).map((s) => ({ k: s.label, v: s.value })),
    ...(donorMileage ? [{ k: 'Пробіг донора', v: donorMileage }] : []),
    ...(compatModels.length ? [{ k: 'Сумісність', v: <CompatValue models={compatModels} /> }] : []),
    ...(crossNums.length ? [{ k: 'Крос-номери', v: crossNums.join(', ') }] : []),
    ...(donorObj ? [{ k: 'Авто-донор', v: donorLabel }] : []),
  ]
  // Defect box (owner decision): shown only for «Б/в, з дефектами» — text from
  // conditionText, photos from defectPhotos. No new field (export `critical` was demo).
  const isDefects = product.conditionLabel === 'used_defects'
  const defectImgs = (product.defectPhotos ?? [])
    .map((m) => (m && typeof m === 'object' ? (m.sizes?.card?.url ?? m.url ?? null) : null))
    .filter((u): u is string => !!u)

  // «Може знадобитися» (5a): alternatives (OEM/cross within type + model, Р44/Р52)
  // and the donor's other in-stock parts (fromSameCar, Р50). Mapped to card data
  // over the in-stock pool; brand logo resolved from the id map (pool is depth 1).
  const cardOf = (p: Product | undefined): ProductCardData | null => {
    if (!p) return null
    const card = toProductCardData(p, locale, () => null)
    const m = p.model && typeof p.model === 'object' ? (p.model as Model) : null
    const bId = m ? (typeof m.brand === 'object' ? (m.brand as Brand).id : m.brand) : null
    card.brandLogo = bId != null ? (brandLogoById.get(bId as number) ?? null) : null
    return card
  }
  const altCards = alternatives(reco, recoPool, 6)
    .map((r) => cardOf(byId.get(r.id)))
    .filter((c): c is ProductCardData => !!c)
  const sameCarCards = fromSameCar(reco, recoPool, 8)
    .map((r) => cardOf(byId.get(r.id)))
    .filter((c): c is ProductCardData => !!c)
  const donorIdOf = (p: Product) => (typeof p.donor === 'object' ? p.donor?.id : p.donor)
  const donorPartsCount = donorObj ? pool.filter((p) => donorIdOf(p) === donorObj.id).length : 0
  const donorPhoto =
    donorObj && typeof donorObj.photo === 'object'
      ? (donorObj.photo?.sizes?.card?.url ?? donorObj.photo?.url ?? null)
      : null
  const donorCard: DonorCard | null = donorObj
    ? {
        photo: donorPhoto,
        title: donorLabel || donorObj.label,
        subtitle: donorObj.year ? `${donorObj.year} рік` : null,
        partsCount: donorPartsCount,
        partsLabel: 'Усі деталі з цього авто',
        href:
          brand?.slug && model?.slug
            ? `${prefix}/brand/${brand.slug}/${model.slug}`
            : `${prefix}/catalog`,
      }
    : null

  const favItem: ProductCardData = {
    id: product.sku,
    href: `${prefix}/product/${product.slug ?? product.id}-${product.sku}`,
    name: product.name,
    oem,
    sku: product.sku,
    price: product.price,
    discountPercent: product.discountPercent ?? null,
    model: model ? modelShort(model) : '',
    modelSlug: model?.slug ?? null,
    compat: compatModels,
    warrantyDays: product.warrantyDays,
    brandLogo,
    status: avail === 'sold' ? 'sold' : 'in_stock',
    availability: avail === 'hidden' ? 'in_stock' : avail,
    photos: photoImgs.length ? photoImgs : [''],
    city: stockCity,
    specs: [],
  }

  return (
    <main className="dls-pd">
      <ViewItemTracker item={favItem} />
      <Container>
        <nav aria-label="Хлібні крихти" className="dls-pd__crumbs">
          <Link href={`${prefix}/`} className="dls-pd__crumbLink">
            Головна
          </Link>
          <span aria-hidden>/</span>
          <Link href={`${prefix}/catalog`} className="dls-pd__crumbLink">
            Каталог
          </Link>
          {category ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`${prefix}/catalog/${category.slug}`} className="dls-pd__crumbLink">
                {category.name}
              </Link>
            </>
          ) : null}
          <span aria-hidden>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="dls-pd__layout">
          <div className="dls-pd__galCol">
            <ProductGallery slides={slides} name={product.name} />
          </div>

          <div className="dls-pd__panel">
            {/* head: brand/fit, title, OEM, stock */}
            <div className="dls-pd__head">
              <ProductCarFit
                brandLogo={brandLogo}
                donorLabel={donorLabel}
                fitSlugs={fitSlugs}
                brands={brands}
                modelsByBrand={modelsByBrand}
              />
              <h1 className="dls-pd__title">{product.name}</h1>
              {oem ? (
                <div className="dls-pd__oem">
                  <span>
                    OEM {oem}
                    <OemCopy value={oem} />
                  </span>
                </div>
              ) : null}
              <div className="dls-pd__plates">
                {avail === 'in_stock' ? (
                  <span className="dls-pd__stock dls-pd__stock--in">
                    <span aria-hidden className="dls-pd__dot" />В наявності
                    {stockCity ? `, ${stockCity}` : ''}
                  </span>
                ) : avail === 'reserved' ? (
                  <span className="dls-pd__stock dls-pd__stock--reserved">Заброньовано</span>
                ) : (
                  <span className="dls-pd__stock dls-pd__stock--sold">Продано</span>
                )}
              </div>
            </div>

            {/* buy card */}
            <section aria-label="Покупка" className="dls-pd__buy">
              <div className="dls-pd__price">
                {oldPriceHtml ? <span className="dls-pd__priceOld">{oldPriceHtml}</span> : null}
                <span className="dls-pd__priceNow">{priceHtml}</span>
                {promo ? (
                  <span className="dls-pd__priceBadge">−{product.discountPercent}%</span>
                ) : null}
              </div>
              <ProductBuyActions
                item={favItem}
                availability={avail}
                priceHtml={priceHtml}
                oldPriceHtml={oldPriceHtml}
                donorLabel={donorLabel}
                brandLogo={brandLogo}
              />
              <div aria-hidden className="dls-pd__rule" />
              <ul aria-label="Переваги" className="dls-pd__benefits">
                {BENEFITS.map((b) => (
                  <li key={b.text}>
                    {b.icon}
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* condition */}
            <section aria-labelledby="pd-cond" className="dls-pd__cond">
              <div className="dls-pd__condHead">
                <h2 id="pd-cond" className="dls-pd__h2">
                  Опис
                </h2>
                {product.conditionLabel === 'used_checked' ? (
                  <span className="dls-pd__condChip dls-pd__condChip--ok">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Перевірено
                  </span>
                ) : (
                  <span className="dls-pd__condChip">{COND_LABEL[product.conditionLabel]}</span>
                )}
              </div>
              {isDefects ? (
                <>
                  {product.conditionText ? (
                    <div className="dls-pd__defect">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        />
                        <path
                          d="M12 8v4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 16h.01"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </svg>
                      <p>{product.conditionText}</p>
                    </div>
                  ) : null}
                  {defectImgs.length ? (
                    <div className="dls-pd__defectPhotos">
                      {defectImgs.map((src) => (
                        // eslint-disable-next-line @next/next/no-img-element -- defect thumbnail
                        <img key={src} src={src} alt="Фото дефекту деталі" />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : product.conditionText ? (
                <p className="dls-pd__condText">{product.conditionText}</p>
              ) : null}
            </section>

            {/* characteristics list — Р52/Р53 live here (owner decision 25.11) */}
            <ProductSpecList rows={specRows} />

            {/* delivery + payment (texts from settings, logos static — owner 26.11) */}
            <ProductDelivery
              delivery={delivery}
              pickup={
                pickup
                  ? {
                      name: pickup.name,
                      address: pickup.address,
                      hours: pickup.schedule ? formatScheduleLabel(pickup.schedule) : null,
                    }
                  : null
              }
              warrantyDays={product.warrantyDays}
            />

            {/* bought together (boughtTogether) */}
            {withItems.length ? (
              <section aria-labelledby="pd-with" className="dls-pd__with">
                <h2 id="pd-with" className="dls-pd__h2">
                  З цим товаром купують
                </h2>
                <div className="dls-pd__withList">
                  {withItems.map((w, i) => (
                    <div
                      key={w.sku}
                      className="dls-pd__withRow"
                      data-last={i === withItems.length - 1 ? 'true' : 'false'}
                    >
                      <span className="dls-pd__withPhoto">
                        {w.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.photo} alt="" />
                        ) : null}
                      </span>
                      <span className="dls-pd__withInfo">
                        <Link href={w.href} className="dls-pd__withName">
                          {w.name}
                        </Link>
                        <span className="dls-pd__withDonor">{w.donor}</span>
                      </span>
                      <span className="dls-pd__withPrice">{w.price}</span>
                      <CartAddButton label={`Додати в кошик: ${w.name}`} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </Container>

      {/* «Може знадобитися» — alternatives (cross-aware, Р52) + donor's parts (5a) */}
      <ProductRecommend
        sameCar={sameCarCards}
        alternatives={altCards}
        donor={donorCard}
        ownModelSlug={model?.slug ?? null}
        currentSku={product.sku}
        locale={locale}
      />

      {/* «Ви дивилися» (5b) — recently-viewed rail (localStorage) */}
      <ProductRecent currentSku={product.sku} locale={locale} />
    </main>
  )
}

const BENEFITS: { text: string; icon: React.ReactNode }[] = [
  {
    text: 'Перевірка на авто або стенді',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__benIco">
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    text: 'Обмін або повернення, якщо не підійшла',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__benIco">
        <path
          d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 3v5h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 16H3v5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    text: 'Відправка в день замовлення',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__benIco">
        <path
          d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 18H9"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth={1.75} />
        <circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth={1.75} />
      </svg>
    ),
  },
  {
    // Payment copy follows PROJECT_CONTEXT §1/§3.1 (texts = PROJECT_CONTEXT, not
    // the export): neutral, no cash-on-delivery promise until the client confirms
    // it (open question №1). Export literal was «Оплата при отриманні або monoPay».
    text: 'Картка онлайн (monoPay) або готівка при самовивозі',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__benIco">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 10h20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]
