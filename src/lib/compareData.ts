import type { Locale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { availability, positionLabel } from '@/lib/rules'
import type { Brand, Category, Media, Model, Product } from '@/payload-types'

import type { CompareColumn, CompareData } from './compareRows'

/**
 * Data for the «Порівняння» page (DLSCompare). Compare lives in the browser
 * (localStorage SKUs), so the page fetches exactly those products here (server
 * only, via the /api/compare route handler — a fetch, not a server action). Each
 * product becomes a column; the table rows are the fixed `COMPARE_ROWS`. Sold /
 * reserved parts are kept so their state shows. Mirrors `favorites.ts`.
 * Client-safe shapes (COMPARE_ROWS, types) live in `compareRows.ts`.
 */

const EMDASH = '—'
const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const img = (m: number | Media | null | undefined): string | null =>
  m && typeof m === 'object' && !m.mimeType?.startsWith('video/')
    ? (m.sizes?.card?.url ?? m.url ?? null)
    : null

function firstPhoto(photos: Product['photos']): string | null {
  for (const m of photos ?? []) {
    const u = img(m)
    if (u) return u
  }
  return null
}
function hasVideo(photos: Product['photos']): boolean {
  return (photos ?? []).some((m) => m && typeof m === 'object' && m.mimeType?.startsWith('video/'))
}

export async function compareData(skus: string[], locale: Locale = 'uk'): Promise<CompareData> {
  if (!skus.length) return { columns: [] }
  const prefix = locale === 'uk' ? '' : '/ru'
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    locale,
    where: { and: [{ sku: { in: skus } }, { status: { not_equals: 'hidden' } }] },
    limit: 200,
    depth: 2,
  })
  const bySku = new Map(res.docs.map((p) => [p.sku, p]))

  const columns = skus
    .map((sku) => bySku.get(sku))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p): CompareColumn => {
      const model = p.model && typeof p.model === 'object' ? (p.model as Model) : null
      const brand = model && typeof model.brand === 'object' ? (model.brand as Brand) : null
      const cat = p.category && typeof p.category === 'object' ? (p.category as Category) : null
      const pickup = p.pickupPoint && typeof p.pickupPoint === 'object' ? p.pickupPoint : null
      const donorLabel = model ? `${brand ? brand.name + ' ' : ''}${model.name}`.trim() : ''
      const avail = availability({
        status: p.status,
        quantity: p.quantity,
        inReserve: p.inReserve ?? 0,
      })
      const stock =
        avail === 'in_stock'
          ? `В наявності${pickup?.name ? `, ${pickup.name}` : ''}`
          : avail === 'reserved'
            ? 'Заброньовано'
            : 'Продано'
      return {
        id: p.sku,
        href: `${prefix}/product/${p.slug ?? p.id}-${p.sku}`,
        name: p.name,
        photo: firstPhoto(p.photos),
        price: p.price,
        priceLabel: `${group(p.price)} ₴`,
        sold: avail === 'sold',
        donor: p.donor ? donorLabel || EMDASH : EMDASH,
        oem: p.oem?.[0]?.number ?? EMDASH,
        side: p.position && p.position !== 'none' ? positionLabel(p.position) : EMDASH,
        cond: p.conditionText?.trim() || EMDASH,
        km: EMDASH, // donor mileage not populated yet
        warranty: p.warrantyDays && p.warrantyDays > 0 ? `${p.warrantyDays} днів` : EMDASH,
        check: EMDASH, // check method dropped (Р14) — no field
        video: hasVideo(p.photos) ? 'Є відео' : EMDASH,
        stock,
        cat: cat?.name ?? EMDASH,
      }
    })

  return { columns }
}
