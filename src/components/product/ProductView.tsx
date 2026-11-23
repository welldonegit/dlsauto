import Link from 'next/link'

import type { ProductCardData } from '@/components/ProductCard'
import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import { toReco, relatedTypesOf } from '@/lib/reco'
import { availability, boughtTogether, modelYears } from '@/lib/rules'
import type { Brand, Media, Model, Product } from '@/payload-types'

import { ProductBuyActions } from './ProductBuyActions'
import { ProductCarFit, type BrandOpt } from './ProductCarFit'
import { ProductGallery, type Slide } from './ProductGallery'
import { CartAddButton, OemCopy } from './ProductBits'

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

export function ProductView({
  product,
  pool,
  category,
  brands,
  modelsByBrand,
  brandLogoById,
  locale,
}: {
  product: Product
  pool: Product[]
  category: { slug: string; name: string } | null
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

  // Model / brand / donor labels.
  const model = product.model && typeof product.model === 'object' ? (product.model as Model) : null
  const brand =
    model && model.brand && typeof model.brand === 'object' ? (model.brand as Brand) : null
  const donorLabel = model ? `${brand ? brand.name + ' ' : ''}${modelShort(model)}`.trim() : ''
  const brandLogo = brand ? (brandLogoById.get(brand.id) ?? null) : null
  const fitSlugs = [
    ...(model?.slug ? [model.slug] : []),
    ...(product.alsoFits ?? []).map((m) => (typeof m === 'object' ? (m as Model).slug : null)),
  ].filter((s): s is string => !!s)

  const avail = availability({
    status: product.status,
    quantity: product.quantity,
    inReserve: product.inReserve ?? 0,
  })
  const oem = product.oem?.[0]?.number ?? null
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

  const favItem: ProductCardData = {
    id: product.sku,
    href: `${prefix}/product/${product.slug ?? product.id}-${product.sku}`,
    name: product.name,
    oem: oem ?? product.sku,
    price: product.price,
    discountPercent: product.discountPercent ?? null,
    model: model ? modelShort(model) : '',
    modelSlug: model?.slug ?? null,
    brandLogo,
    status: avail === 'sold' ? 'sold' : 'in_stock',
    photos: photoImgs.length ? photoImgs : [''],
    city: stockCity,
    specs: [],
  }

  return (
    <main className="dls-pd">
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
                  Стан деталі
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
              {product.conditionText ? (
                <p className="dls-pd__condText">{product.conditionText}</p>
              ) : null}
            </section>

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
    text: 'Оплата при отриманні або monoPay',
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
