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
