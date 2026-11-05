import type { ProductCardData } from '@/components/ProductCard'
import type { Locale } from '@/i18n/config'
import { modelYears } from '@/lib/rules'
import type { Media, Model, Product } from '@/payload-types'

/**
 * Map a Payload Product to the ProductCard's view data (DEV_CONTEXT §4–5). The
 * card is used across New Arrivals, Pickups, SUVs and later the catalog, so this
 * is the single mapping. Brand logos live one depth below `model.brand`, so the
 * caller supplies a resolver built from `getBrands` rather than querying deeper.
 */

function imageUrl(m: number | Media | null | undefined): string | null {
  if (!m || typeof m !== 'object') return null
  if (m.mimeType?.startsWith('video/')) return null // videos (mp4) are quick-view only
  return m.sizes?.card?.url ?? m.url ?? null
}

/** Donor pill label: "Ranger 2006–2012" (name + years, no twin/generation). */
function modelShort(model: Model): string {
  const years = modelYears(model)
  return years ? `${model.name} ${years}` : model.name
}

export function toProductCardData(
  p: Product,
  locale: Locale,
  brandLogo: (brandId: number) => string | null,
): ProductCardData {
  const model = p.model && typeof p.model === 'object' ? p.model : null
  const brand = model && model.brand && typeof model.brand === 'object' ? model.brand : null
  const pickup = p.pickupPoint && typeof p.pickupPoint === 'object' ? p.pickupPoint : null
  const prefix = locale === 'uk' ? '' : '/ru'
  const photos = (p.photos ?? []).map(imageUrl).filter((u): u is string => !!u)

  return {
    id: p.sku,
    href: `${prefix}/product/${p.slug ?? p.id}-${p.sku}`,
    name: p.name,
    oem: p.oem?.[0]?.number ?? p.sku,
    price: p.price,
    discountPercent: p.discountPercent ?? null,
    model: model ? modelShort(model) : '',
    modelSlug: model?.slug ?? null,
    brandLogo: brand ? brandLogo(brand.id) : null,
    status: p.status === 'sold' ? 'sold' : 'in_stock',
    featured: !!p.featured,
    popular: false, // top by salesCount — enabled in stage 6 (0 for now)
    fits: false, // "Підходить на ваше авто" — wired when the car cookie exists
    photos: photos.length ? photos : [''],
    city: pickup?.name ?? '',
    specs: (p.specs ?? []).map((s) => ({ k: s.label, v: s.value })),
  }
}
