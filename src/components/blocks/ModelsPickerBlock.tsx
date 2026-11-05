import { getBrands, getModelsByBrand } from '@/lib/data'
import { modelDisplayName, modelYears } from '@/lib/rules'
import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'
import { ModelsPicker, type ModelsBrand } from './ModelsPicker'

/**
 * "Деталі для вашого авто" (DLSBrandIndex-v4). Server wrapper: loads brands and
 * their models (with in-stock counts) from Payload, orders brands by total parts
 * (as the export does), and hands the interactive chip/card picker to the client
 * component. The initially-active chip is the block's default brand, else the
 * first (busiest) one.
 */

// Logo aspect ratios measured from the export (chipLogos), keyed by slug — used
// to give every mark the same optical area inside the chip.
const ASPECT: Record<string, number> = {
  mitsubishi: 1.153,
  ford: 2.582,
  mazda: 1.244,
  nissan: 1.191,
  jeep: 2.413,
  volkswagen: 1,
  kia: 3.995,
  hyundai: 1.912,
  toyota: 1.459,
  'mercedes-benz': 1,
  ssangyong: 6.261,
  volvo: 1,
  bmw: 1,
  peugeot: 0.909,
  fiat: 0.998,
  isuzu: 5.318,
}

function logoUrl(logo: number | Media | null | undefined): string | null {
  return logo && typeof logo === 'object' ? (logo.url ?? null) : null
}

export async function ModelsPickerBlock({
  heading,
  defaultBrand,
  locale,
}: BlockComponentProps<'modelsPicker'>) {
  const brandsRaw = await getBrands()

  const brands: (ModelsBrand & { total: number })[] = await Promise.all(
    brandsRaw.map(async (b) => {
      const slug = b.slug ?? ''
      const models = slug ? await getModelsByBrand(slug, locale) : []
      return {
        slug,
        name: b.name,
        logo: logoUrl(b.logoColor),
        aspect: ASPECT[slug] ?? 1,
        total: models.reduce((s, m) => s + m.partsCount, 0),
        models: models
          .filter((m) => m.slug)
          .map((m) => ({
            slug: m.slug as string,
            name: modelDisplayName(m),
            years: modelYears(m),
            partsCount: m.partsCount,
          })),
      }
    }),
  )

  // Export order: busiest brands first.
  brands.sort((a, b) => b.total - a.total)
  if (!brands.length) return null

  const defSlug =
    defaultBrand && typeof defaultBrand === 'object'
      ? defaultBrand.slug
      : brandsRaw.find((b) => b.id === defaultBrand)?.slug
  const initial = Math.max(
    0,
    brands.findIndex((b) => b.slug === defSlug),
  )

  return (
    <ModelsPicker
      heading={heading ?? 'Деталі для вашого авто'}
      brands={brands}
      initial={initial}
      locale={locale}
    />
  )
}
