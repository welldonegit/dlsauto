import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'
import { HotOffers, type HotOfferCard } from './HotOffers'

/**
 * «Гарячі пропозиції» server wrapper (Р55). Resolves each banner's image URL and
 * hands the cards to the client slider. Images are 1040×480 → the gallery (1600)
 * variant; cards without an image render the placeholder. Empty block → nothing.
 */
function imageUrl(m: number | Media | null | undefined): string | null {
  if (!m || typeof m !== 'object') return null
  return m.sizes?.gallery?.url ?? m.sizes?.card?.url ?? m.url ?? null
}

export function HotOffersBlock({ heading, items }: BlockComponentProps<'hotOffers'>) {
  const cards: HotOfferCard[] = (items ?? []).map((it) => ({
    src: imageUrl(it.image),
    title: it.title ?? '',
    subtitle: it.subtitle ?? '',
    href: it.link?.trim() || null,
  }))
  if (!cards.length) return null
  return <HotOffers heading={heading ?? 'Гарячі пропозиції'} items={cards} />
}
