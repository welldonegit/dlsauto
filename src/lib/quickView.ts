'use client'

import type { ProductCardData } from '@/components/ProductCard'

/**
 * Quick-view opener. Any ProductCard's eye button fires `openQuickView(card)`;
 * the QuickViewHost (mounted once in the layout) catches the window event,
 * lazy-loads the modal and shows it. Decoupled via a CustomEvent so cards need
 * no context/provider and the modal code stays out of the first-load bundle.
 */

export const QUICK_VIEW_EVENT = 'dls:quickview'

export function openQuickView(data: ProductCardData): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ProductCardData>(QUICK_VIEW_EVENT, { detail: data }))
}
