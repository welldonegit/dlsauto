'use client'

import { useMemo, useState } from 'react'

import { setSelectedCar, useSelectedCar } from '@/lib/selectedCar'

/**
 * Product car-fit row (DLSProduct). The brand/donor chip always shows; when a car
 * is selected ("моє авто", cookie) a fit pill reports «Підходить» / «Не підходить
 * на {car}» and a «Змінити авто» button opens a Марка→Модель picker that writes
 * the car cookie — exactly the export's behaviour (no car → chip only).
 */

export type BrandOpt = { slug: string; name: string }

export function ProductCarFit({
  brandLogo,
  donorLabel,
  fitSlugs,
  brands,
  modelsByBrand,
}: {
  brandLogo: string | null
  donorLabel: string
  fitSlugs: string[]
  brands: BrandOpt[]
  modelsByBrand: Record<string, BrandOpt[]>
}) {
  const car = useSelectedCar()
  const [open, setOpen] = useState(false)
  const [pBrand, setPBrand] = useState('')

  const fits = !!car && fitSlugs.includes(car.slug)
  const models = useMemo(
    () => (pBrand ? (modelsByBrand[pBrand] ?? []) : []),
    [pBrand, modelsByBrand],
  )

  const pickModel = (slug: string) => {
    if (!slug) return
    const b = brands.find((x) => x.slug === pBrand)
    const m = models.find((x) => x.slug === slug)
    if (!b || !m) return
    setSelectedCar({ slug, label: `${b.name} ${m.name}` })
    setOpen(false)
    setPBrand('')
  }

  return (
    <div className="dls-pd-fit">
      <span className="dls-pd-fit__chip">
        {brandLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brandLogo} alt="" className="dls-pd-fit__logo" />
        ) : null}
        <span className="dls-pd-fit__donor">{donorLabel}</span>
      </span>

      {car ? (
        fits ? (
          <span className="dls-pd-fit__pill dls-pd-fit__pill--ok">
            <svg viewBox="0 0 24 24" aria-hidden className="dls-pd-fit__ico">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Підходить на ваше авто
          </span>
        ) : (
          <span className="dls-pd-fit__pill dls-pd-fit__pill--no">Не підходить на {car.label}</span>
        )
      ) : null}

      {car ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="dls-pd-fit__change">
          Змінити авто
        </button>
      ) : null}

      {open ? (
        <div className="dls-pd-fit__picker">
          <p className="dls-pd-fit__pickerTitle">Ваше авто</p>
          <label className="dls-pd-fit__field">
            <select
              aria-label="Марка"
              value={pBrand}
              onChange={(e) => setPBrand(e.target.value)}
              className="dls-pd-fit__select"
            >
              <option value="">Марка</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <Chevron />
          </label>
          <label className="dls-pd-fit__field">
            <select
              aria-label="Модель"
              value=""
              disabled={!pBrand}
              onChange={(e) => pickModel(e.target.value)}
              className="dls-pd-fit__select"
            >
              <option value="">Модель</option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
            <Chevron />
          </label>
        </div>
      ) : null}
    </div>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="dls-pd-fit__chevron">
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
