import type { ProductCardData } from '@/components/ProductCard'
import type { Locale } from '@/i18n/config'
import { getBrands, getProductsByModel } from '@/lib/data'
import { getPayloadClient } from '@/lib/payload'
import { toProductCardData } from '@/lib/productCard'
import type { Media, Model } from '@/payload-types'

/**
 * Data for the «Обране» page (DLSFavorites). The wishlist is client-side
 * (localStorage SKUs), so the page fetches exactly those cards plus — when a car
 * is selected — a few more in-stock parts for it. Server-only; called from the
 * /api/favorites route handler (a fetch, not a server action, which streams
 * reliably in dev + prod). Sold favorites are kept to show their «Продано» state.
 */

const logo = (m: number | Media | null | undefined): string | null =>
  m && typeof m === 'object' ? (m.url ?? null) : null

export type CarInfo = { label: string; logo: string | null }
export type FavoritesData = {
  cards: ProductCardData[]
  more: ProductCardData[]
  car: CarInfo | null
}

export async function favoritesData(
  skus: string[],
  carSlug: string | null,
  locale: Locale = 'uk',
): Promise<FavoritesData> {
  const brands = await getBrands()
  const logoById = new Map(brands.map((b) => [b.id, logo(b.logoMono)]))
  const brandLogo = (id: number) => logoById.get(id) ?? null
  const payload = await getPayloadClient()

  let cards: ProductCardData[] = []
  if (skus.length) {
    const res = await payload.find({
      collection: 'products',
      locale,
      where: { and: [{ sku: { in: skus } }, { status: { not_equals: 'hidden' } }] },
      limit: 200,
      depth: 2,
    })
    const bySku = new Map(res.docs.map((p) => [p.sku, p]))
    cards = skus
      .map((sku) => bySku.get(sku))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => toProductCardData(p, locale, brandLogo))
  }

  let more: ProductCardData[] = []
  let car: CarInfo | null = null
  if (carSlug) {
    const owned = new Set(skus)
    const prods = await getProductsByModel(carSlug, locale, 16)
    more = prods
      .map((p) => toProductCardData(p, locale, brandLogo))
      .filter((c) => !owned.has(c.id))
      .map((c) => ({ ...c, fits: true }))
      .slice(0, 12)

    const mRes = await payload.find({
      collection: 'models',
      locale,
      where: { and: [{ slug: { equals: carSlug } }, { published: { equals: true } }] },
      limit: 1,
      depth: 2,
    })
    const m = mRes.docs[0] as Model | undefined
    if (m) {
      const brand = m.brand && typeof m.brand === 'object' ? m.brand : null
      car = {
        label: `${brand ? brand.name + ' ' : ''}${m.name}`.trim(),
        logo: brand ? logo(brand.logoMono) : null,
      }
    }
  }

  return { cards, more, car }
}
