'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/**
 * "Показуємо деталі на {авто}" banner on the catalog header (Р-decision 4). The
 * car itself comes from the cookie pre-filter or the Авто filter; this strip adds
 * the owner-requested «Змінити» / «Скинути» controls (not in the DLSCatalog export
 * — flagged in the stage report). «Змінити» opens the Авто filter (event picked up
 * by the filter island); «Скинути» opts this view out of the car (`?car=off`) and
 * drops any explicit Авто filter, leaving the canonical path untouched.
 */
export function CatalogCarBanner({ label, basePath }: { label: string; basePath: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const change = useCallback(() => {
    window.dispatchEvent(new CustomEvent('dls-cat-change-car'))
  }, [])

  const reset = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString())
    p.delete('brand')
    p.delete('model')
    p.delete('shown')
    p.set('car', 'off')
    router.push(`${basePath}?${p.toString()}`, { scroll: false })
  }, [router, basePath, searchParams])

  return (
    <p className="dls-cat-page__carLine">
      <span>
        Показуємо деталі на <strong>{label}</strong>
      </span>
      <button type="button" onClick={change} className="dls-cat-page__carBtn">
        Змінити
      </button>
      <button type="button" onClick={reset} className="dls-cat-page__carBtn">
        Скинути
      </button>
    </p>
  )
}
