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

export function HotOffersBlock({ heading, items, locale }: BlockComponentProps<'hotOffers'>) {
  const prefix = locale === 'uk' ? '' : '/ru'
  // Internal links (admin enters "/catalog…") get the locale prefix so /ru cards
  // stay on /ru; external (http) and in-page (#) links pass through unchanged.
  const withPrefix = (link: string): string =>
    prefix && link.startsWith('/') && !link.startsWith(`${prefix}/`) ? `${prefix}${link}` : link
  const cards: HotOfferCard[] = (items ?? []).map((it) => {
    const link = it.link?.trim() || null
    return {
      src: imageUrl(it.image),
      title: it.title ?? '',
      subtitle: it.subtitle ?? '',
      href: link ? withPrefix(link) : null,
    }
  })
  if (!cards.length) return null
  return <HotOffers heading={heading ?? 'Гарячі пропозиції'} items={cards} />
}
