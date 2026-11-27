/**
 * Availability status (DEV_CONTEXT §5, Р39). Derived from `status` (manual
 * override: hidden / sold) plus the KeyCRM-driven numbers `quantity` (available
 * = in_stock − in_reserve) and `inReserve`:
 *   available > 0            → in_stock
 *   available 0, reserve > 0 → reserved  («Заброньовано», покупка закрыта)
 *   available 0, reserve 0   → sold       («Продано», страница живёт, альтернативы)
 */
export type Availability = 'in_stock' | 'reserved' | 'sold' | 'hidden'

export type AvailabilityInput = {
  status?: 'in_stock' | 'sold' | 'hidden' | null
  quantity?: number | null
  inReserve?: number | null
}

export function availability(p: AvailabilityInput): Availability {
  if (p.status === 'hidden') return 'hidden'
  if (p.status === 'sold') return 'sold'
  const qty = p.quantity ?? 0
  if (qty > 0) return 'in_stock'
  return (p.inReserve ?? 0) > 0 ? 'reserved' : 'sold'
}

/** Buyable right now — only in-stock counts; reserved/sold/hidden do not. */
export function isAvailable(p: AvailabilityInput): boolean {
  return availability(p) === 'in_stock'
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: 'В наявності',
  reserved: 'Заброньовано',
  sold: 'Продано',
  hidden: 'Прихований',
}

/**
 * Query-level twin of {@link availability} for Payload `find`/`count`
 * (DEV_CONTEXT §5, Р39). A part is listable/buyable only when `status` is
 * `in_stock` AND the available `quantity` (= in_stock − in_reserve, KeyCRM) is
 * > 0. Reserved (quantity 0, inReserve > 0) and quantity-sold (quantity 0) keep
 * `status` `in_stock` in the DB, so a status-only filter leaks them into
 * listings, counters and recommendations — which Р39 forbids. This is the
 * single source for "shown in listings"; spread it into every such
 * where-clause. Surfaces that intentionally show sold/reserved WITH a status
 * (product page, Обране, Порівняння, «Ви дивилися») use `not_equals: hidden`
 * instead and recompute {@link availability} per card.
 */
export const IN_STOCK_WHERE = [
  { status: { equals: 'in_stock' } },
  { quantity: { greater_than: 0 } },
] as const
