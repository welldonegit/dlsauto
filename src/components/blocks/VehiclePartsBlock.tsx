import { getBrands, getVehicleModels } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import { toProductCardData } from '@/lib/productCard'
import { modelYears } from '@/lib/rules'
import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'
import { VehicleCarousel, type VehicleModelTab } from './VehicleCarousel'

/**
 * "Запчастини на пікапи / позашляховики" (DLSPickups / DLSSuvs). Both are the
 * same video-banner + model-tab carousel (VehicleCarousel), differing only by
 * body type, copy and video. Models with in-stock parts come from Payload
 * (DEV_CONTEXT §5); each tab's cards are that model's products.
 */

function logoUrl(m: number | Media | null | undefined): string | null {
  return m && typeof m === 'object' ? (m.url ?? null) : null
}
function videoUrl(m: number | Media | null | undefined): string | null {
  return m && typeof m === 'object' ? (m.url ?? null) : null
}

async function renderVehicle(
  bodyType: 'pickup' | 'suv',
  heading: string,
  subheading: string,
  video: number | Media | null | undefined,
  limit: number,
  locale: Locale,
  copy: { allLabel: string; videoLabel: string; ariaLabel: string; titleId: string },
) {
  const [groups, brands] = await Promise.all([
    getVehicleModels(bodyType, locale, limit),
    getBrands(),
  ])
  if (!groups.length) return null

  const logoByBrand = new Map(brands.map((b) => [b.id, logoUrl(b.logoMono)]))
  const brandLogo = (id: number) => logoByBrand.get(id) ?? null

  const models: VehicleModelTab[] = groups.map(({ model, products }) => {
    const brand = model.brand && typeof model.brand === 'object' ? model.brand : null
    const years = modelYears(model)
    return {
      key: model.slug ?? String(model.id),
      label: years ? `${model.name} ${years}` : model.name,
      logo: brand ? brandLogo(brand.id) : null,
      count: products.length,
      cards: products.map((p) => toProductCardData(p, locale, brandLogo)),
    }
  })

  const prefix = locale === 'uk' ? '' : '/ru'

  return (
    <VehicleCarousel
      title={heading}
      subtitle={subheading}
      allHref={`${prefix}/catalog`}
      allLabel={copy.allLabel}
      videoSrc={videoUrl(video)}
      videoLabel={copy.videoLabel}
      models={models}
      ariaLabel={copy.ariaLabel}
      titleId={copy.titleId}
    />
  )
}

export function PickupsBlock({
  heading,
  subheading,
  video,
  limit,
  locale,
}: BlockComponentProps<'pickupsParts'>) {
  return renderVehicle(
    'pickup',
    heading ?? 'Запчастини на пікапи',
    subheading ?? '',
    video,
    limit ?? 24,
    locale,
    {
      allLabel: 'Усі пікапи',
      videoLabel: 'Пікап на бездоріжжі',
      ariaLabel: 'Модель пікапа',
      titleId: 'pickups-title',
    },
  )
}

export function SuvsBlock({
  heading,
  subheading,
  video,
  limit,
  locale,
}: BlockComponentProps<'suvsParts'>) {
  return renderVehicle(
    'suv',
    heading ?? 'Запчастини на позашляховики',
    subheading ?? '',
    video,
    limit ?? 24,
    locale,
    {
      allLabel: 'Усі позашляховики',
      videoLabel: 'Позашляховик на бездоріжжі',
      ariaLabel: 'Модель позашляховика',
      titleId: 'suvs-title',
    },
  )
}
