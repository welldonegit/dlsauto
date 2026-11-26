'use client'

import { useState } from 'react'

/**
 * «Сумісність» value for the product-page «Характеристики» list (Р53): every
 * model the part fits (own model + all `alsoFits`, no cap). Collapses to the
 * first 3 with a «ще N» toggle (owner default). Rendered as the value of a spec
 * row, so it keeps the row's right alignment.
 */
export function CompatValue({ models }: { models: string[] }) {
  const [open, setOpen] = useState(false)
  if (!models.length) return null
  const COLLAPSED = 3
  const collapsible = models.length > COLLAPSED
  const shown = open || !collapsible ? models : models.slice(0, COLLAPSED)
  const rest = models.length - COLLAPSED

  return (
    <span className="dls-pd__compatVal">
      {shown.join(', ')}
      {collapsible ? (
        <button
          type="button"
          className="dls-pd__compatMore"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Згорнути' : `ще ${rest}`}
        </button>
      ) : null}
    </span>
  )
}
