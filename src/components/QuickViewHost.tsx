'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'

import type { ProductCardData } from '@/components/ProductCard'
import { QUICK_VIEW_EVENT } from '@/lib/quickView'

/**
 * Global quick-view outlet. Mounted once in the layout; it listens for the
 * `openQuickView` window event, lazy-loads the modal (so its code stays out of
 * the first-load bundle) and shows it. The modal stays mounted after the first
 * open so its close animation can play; reopening just swaps the product.
 */

const QuickView = dynamic(() => import('./QuickView').then((m) => m.QuickView), { ssr: false })

export function QuickViewHost() {
  const [data, setData] = useState<ProductCardData | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = (e: Event) => {
      setData((e as CustomEvent<ProductCardData>).detail)
      setOpen(true)
    }
    window.addEventListener(QUICK_VIEW_EVENT, onOpen)
    return () => window.removeEventListener(QUICK_VIEW_EVENT, onOpen)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  if (!data) return null
  // Key by product id so each new product opens a fresh gallery (idx reset).
  return <QuickView key={data.id} data={data} open={open} onClose={close} />
}
