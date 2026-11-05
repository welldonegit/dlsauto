import { getBrands, getNewestProducts } from '@/lib/data'
import { toProductCardData } from '@/lib/productCard'
import type { Category, Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'
import { NewArrivals, type ArrivalCard } from './NewArrivals'

/**
 * "Нові надходження" server wrapper. Loads the newest in-stock products
 * (DEV_CONTEXT §5) and the brand-logo map, maps them to card data, and derives
 * the category tabs from the products actually shown. Hands the carousel to the
 * client component.
 */

function logoUrl(m: number | Media | null | undefined): string | null {
  return m && typeof m === 'object' ? (m.url ?? null) : null
}

export async function NewArrivalsBlock({
  heading,
  limit,
  locale,
}: BlockComponentProps<'newArrivals'>) {
  const [products, brands] = await Promise.all([
    getNewestProducts(locale, limit ?? 15),
    getBrands(),
  ])
  if (!products.length) return null

  const logoByBrand = new Map(brands.map((b) => [b.id, logoUrl(b.logoMono)]))
  const brandLogo = (id: number) => logoByBrand.get(id) ?? null

  const cards: ArrivalCard[] = products.map((p) => {
    const cat = p.category && typeof p.category === 'object' ? (p.category as Category) : null
    return { ...toProductCardData(p, locale, brandLogo), cat: cat?.name ?? '' }
  })

  // Tabs: "Усі" + each category present, in first-seen order.
  const seen = new Set<string>()
  const tabs = [{ key: 'all', label: 'Усі' }]
  for (const c of cards) {
    if (c.cat && !seen.has(c.cat)) {
      seen.add(c.cat)
      tabs.push({ key: c.cat, label: c.cat })
    }
  }

  const prefix = locale === 'uk' ? '' : '/ru'

  return (
    <NewArrivals
      title={heading ?? 'Нові надходження'}
      allHref={`${prefix}/catalog`}
      tabs={tabs}
      cards={cards}
    />
  )
}
