'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Container } from '@/components/ui/layout'
import type { Locale } from '@/i18n/config'
import { compareClear, compareItems, compareSet, useCompareCount } from '@/lib/compare'
import { COMPARE_ROWS, type CompareColumn, type CompareData } from '@/lib/compareRows'

/**
 * «Порівняння» page (DLSCompare). The compared set is client-side (localStorage
 * SKUs); on mount we fetch the column data for those SKUs via /api/compare (a
 * route handler, like favorites). Table: fixed rows (COMPARE_ROWS) × product
 * columns, sticky label column, horizontal scroll. «Показувати лише відмінності»
 * hides rows whose values are equal across all columns; «Найнижча» marks the
 * cheapest column; removing a column writes the store; «Очистити все» empties it.
 * noindex (route). Cart is stage 5 → buy buttons land later.
 */

const allEqual = (vals: string[]) => new Set(vals).size <= 1

export function Compare({ locale }: { locale: Locale }) {
  const prefix = locale === 'uk' ? '' : '/ru'
  const [ready, setReady] = useState(false)
  const [cols, setCols] = useState<CompareColumn[]>([])
  const [onlyDiff, setOnlyDiff] = useState(false)
  const count = useCompareCount()

  // Load once on mount from the compare SKUs. Removals are managed locally after.
  useEffect(() => {
    let alive = true
    const skus = compareItems()
    const qs = new URLSearchParams({ skus: skus.join(','), locale })
    fetch(`/api/compare?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json() as Promise<CompareData>)
      .then((data) => {
        if (!alive) return
        setCols(data.columns)
        setReady(true)
      })
      .catch(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remove = (id: string) => {
    compareSet(id, false)
    setCols((cs) => cs.filter((c) => c.id !== id))
  }
  const clearAll = () => {
    compareClear()
    setCols([])
  }

  // «Найнижча» only when prices actually vary (all-equal → no badge noise).
  const prices = cols.map((c) => c.price)
  const minPrice =
    cols.length > 1 && Math.max(...prices) > Math.min(...prices) ? Math.min(...prices) : null
  const rows = COMPARE_ROWS.filter((r) => !onlyDiff || !allEqual(cols.map((c) => String(c[r.key]))))

  return (
    <main className="dls-cmp">
      <Container>
        <div className="dls-cmp__head">
          <h1 className="dls-cmp__title">Порівняння</h1>
          {count > 0 ? <span className="dls-cmp__count">{count} деталей</span> : null}
        </div>

        {!ready ? null : cols.length === 0 ? (
          <div className="dls-cmp__empty">
            <p>Ви ще нічого не додали до порівняння</p>
            <Link href={`${prefix}/catalog`} className="dls-cmp__name">
              До каталогу
            </Link>
          </div>
        ) : (
          <>
            <div className="dls-cmp__tools">
              <button
                type="button"
                className="dls-cmp__toggle"
                aria-pressed={onlyDiff}
                onClick={() => setOnlyDiff((v) => !v)}
              >
                <span aria-hidden className="dls-cmp__toggleBox">
                  {onlyDiff ? (
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                Показувати лише відмінності
              </button>
              <button type="button" className="dls-cmp__clear" onClick={clearAll}>
                Очистити все
              </button>
            </div>

            <div className="dls-cmp__scroll">
              <div className="dls-cmp__grid" style={{ ['--cmp-n' as string]: String(cols.length) }}>
                {/* card row: photo / name / price / remove + «додати» */}
                <div className="dls-cmp__row">
                  <div className="dls-cmp__cell dls-cmp__label" />
                  {cols.map((c) => (
                    <div key={c.id} className="dls-cmp__cell">
                      <div className="dls-cmp__card">
                        <div className="dls-cmp__photo" data-sold={c.sold ? 'true' : 'false'}>
                          {c.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element -- compare thumbnail
                            <img src={c.photo} alt={c.name} />
                          ) : null}
                          <button
                            type="button"
                            className="dls-cmp__remove"
                            aria-label={`Прибрати з порівняння: ${c.name}`}
                            onClick={() => remove(c.id)}
                          >
                            <svg viewBox="0 0 24 24">
                              <path
                                d="M18 6 6 18M6 6l12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <Link href={c.href} className="dls-cmp__name">
                          {c.name}
                        </Link>
                        <span className="dls-cmp__price">
                          {c.priceLabel}
                          {minPrice != null && c.price === minPrice ? (
                            <span className="dls-cmp__lowest">Найнижча</span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link href={`${prefix}/catalog`} className="dls-cmp__add">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M12 5v14M5 12h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </svg>
                    Додати деталь
                  </Link>
                </div>

                {/* spec rows */}
                {rows.map((r) => (
                  <div key={r.key} className="dls-cmp__row">
                    <div className="dls-cmp__cell dls-cmp__label">{r.label}</div>
                    {cols.map((c) => (
                      <div key={c.id} className="dls-cmp__cell">
                        {String(c[r.key])}
                      </div>
                    ))}
                    <div className="dls-cmp__cell" aria-hidden />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Container>
    </main>
  )
}
