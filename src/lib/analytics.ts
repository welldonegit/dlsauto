'use client'

import type { ProductCardData } from '@/components/ProductCard'

/**
 * GA4-style ecommerce events pushed to `window.dataLayer` (DEV_CONTEXT §8). We
 * only emit the events — GTM / GA itself is wired in a later stage. No-ops on
 * the server and when nothing consumes the layer, so it is safe to call from any
 * client component.
 */

type DataLayerEvent = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

function push(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
}

/** One product → a GA4 `items[]` entry. */
function toItem(p: ProductCardData, index?: number) {
  return {
    item_id: p.id,
    item_name: p.name,
    price: p.price,
    ...(p.model ? { item_variant: p.model } : {}),
    ...(index !== undefined ? { index } : {}),
  }
}

/** A product rail/list came into view. */
export function trackViewItemList(
  listId: string,
  listName: string,
  items: ProductCardData[],
): void {
  push({
    event: 'view_item_list',
    item_list_id: listId,
    item_list_name: listName,
    items: items.map((p, i) => toItem(p, i)),
  })
}

/** A product card was clicked through to its page. */
export function trackSelectItem(listId: string, listName: string, item: ProductCardData): void {
  push({
    event: 'select_item',
    item_list_id: listId,
    item_list_name: listName,
    items: [toItem(item)],
  })
}

/** A product was added to the wishlist (heart). */
export function trackAddToWishlist(item: ProductCardData): void {
  push({ event: 'add_to_wishlist', items: [toItem(item)] })
}
