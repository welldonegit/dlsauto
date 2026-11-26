'use client'

import { useState } from 'react'

/**
 * «Сумісність» on the product page (Р53): every model the part fits (its own
 * model + all `alsoFits`, no cap). No dedicated slot in the export → default
 * placement is a labelled block in the product panel (open question for the
 * owner). Long lists collapse to the first 3 with a «ще N» toggle.
 */
export function ProductCompat({ models }: { models: string[] }) {
  const [open, setOpen] = useState(false)
  if (!models.length) return null
  const COLLAPSED = 3
  const collapsible = models.length > COLLAPSED
  const shown = open || !collapsible ? models : models.slice(0, COLLAPSED)
  const rest = models.length - COLLAPSED

  return (
    <section aria-labelledby="pd-compat" className="dls-pd__compat">
      <h2 id="pd-compat" className="dls-pd__h2">
        Сумісність
      </h2>
      <ul className="dls-pd__compatList">
        {shown.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
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
    </section>
  )
}
