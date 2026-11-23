import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ProductView } from '@/components/product/ProductView'
import type { BrandOpt } from '@/components/product/ProductCarFit'
import { isLocale, type Locale } from '@/i18n/config'
import { getBrands, getModelsGroupedByBrand, getProductBySku, getRecoPool } from '@/lib/data'
import { breadcrumbJsonLd, localeAlternates, metadataBase } from '@/lib/meta'
import { availability } from '@/lib/rules'
import type { Brand, Category, Media, Product } from '@/payload-types'

/**
 * Product page `/product/<slug>-<sku>` (§8). The SKU is the stable key; since both
 * slug and sku can contain hyphens, we resolve by trying the longest suffixes of
 * the path as the SKU. Sold/reserved parts keep a 200 (Р39); hidden ones 404.
 */

/** Resolve the product from `<slug>-<sku>` by matching the longest suffix that is a SKU. */
async function resolveProduct(slugSku: string, locale: Locale): Promise<Product | null> {
  const parts = slugSku.split('-')
  for (let i = 0; i < parts.length; i++) {
    const sku = parts.slice(i).join('-')
    const p = await getProductBySku(sku, locale)
    if (p) return p
  }
  return null
}

const logoColor = (m: number | Media | null | undefined): string | null =>
  m && typeof m === 'object' ? (m.url ?? null) : null
const img = (m: number | Media | null | undefined): string | null =>
  m && typeof m === 'object' ? (m.sizes?.card?.url ?? m.url ?? null) : null

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slugSku: string }>
}): Promise<Metadata> {
  const { locale, slugSku } = await params
  if (!isLocale(locale)) return {}
  const product = await resolveProduct(slugSku, locale as Locale)
  if (!product) return {}
  const canonical = `/product/${product.slug ?? product.id}-${product.sku}`
  return {
    metadataBase: metadataBase(),
    title: `${product.name} — DLSAuto`,
    description:
      product.conditionText?.trim() ||
      `${product.name} — вживана деталь з власної розбірки DLSAuto. Перевірена, з фото реальної деталі, відправка в день замовлення.`,
    alternates: localeAlternates(locale, canonical),
  }
}

export default async function ProductRoutePage({
  params,
}: {
  params: Promise<{ locale: string; slugSku: string }>
}) {
  const { locale, slugSku } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const product = await resolveProduct(slugSku, loc)
  if (!product) notFound()

  const [pool, brandsRaw, modelsByBrand] = await Promise.all([
    getRecoPool(loc),
    getBrands(),
    getModelsGroupedByBrand(loc),
  ])

  const brands: BrandOpt[] = brandsRaw
    .filter((b) => b.slug && (modelsByBrand[b.slug as string]?.length ?? 0) > 0)
    .map((b) => ({ slug: b.slug as string, name: b.name }))
  const brandLogoById = new Map(brandsRaw.map((b) => [b.id, logoColor(b.logoColor)]))

  const category =
    product.category && typeof product.category === 'object' ? (product.category as Category) : null
  const cat = category && category.slug ? { slug: category.slug, name: category.name } : null

  const prefix = loc === 'uk' ? '' : '/ru'
  const canonicalPath = `/product/${product.slug ?? product.id}-${product.sku}`
  const avail = availability({
    status: product.status,
    quantity: product.quantity,
    inReserve: product.inReserve ?? 0,
  })

  const crumbs = breadcrumbJsonLd([
    { name: 'Головна', path: `${prefix}/` },
    { name: 'Каталог', path: `${prefix}/catalog` },
    ...(cat ? [{ name: cat.name, path: `${prefix}/catalog/${cat.slug}` }] : []),
    { name: product.name, path: `${prefix}${canonicalPath}` },
  ])

  const image = (product.photos ?? [])
    .map(img)
    .filter((u): u is string => !!u)
    .slice(0, 4)
  const brand =
    product.model &&
    typeof product.model === 'object' &&
    product.model.brand &&
    typeof product.model.brand === 'object'
      ? (product.model.brand as Brand)
      : null
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    ...(product.oem?.[0]?.number ? { mpn: product.oem[0].number } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand.name } } : {}),
    ...(image.length ? { image } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'UAH',
      availability:
        avail === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${metadataBase().origin}${prefix}${canonicalPath}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <SiteHeader locale={loc} />
      <ProductView
        product={product}
        pool={pool}
        category={cat}
        brands={brands}
        modelsByBrand={modelsByBrand}
        brandLogoById={brandLogoById}
        locale={loc}
      />
      <Footer />
    </>
  )
}
