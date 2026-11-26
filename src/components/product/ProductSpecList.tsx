import type { ReactNode } from 'react'

/**
 * «Характеристики» list on the product page — the same two-column list the
 * quick-view uses (DLSQuickView export): hairline-separated rows, muted label
 * left, value right. Owner decision 25.11: the product-page layout has no
 * characteristics table in the export, so this list (the quick-view component)
 * is reused to host Стан / характеристики категорії / Пробіг / Сумісність /
 * Крос-номери / Авто-донор. Rows with an empty value are dropped.
 */
export type SpecRow = { k: string; v: ReactNode }

export function ProductSpecList({ rows }: { rows: SpecRow[] }) {
  const shown = rows.filter((r) => r.v != null && r.v !== '')
  if (!shown.length) return null
  return (
    <section aria-labelledby="pd-specs" className="dls-pd__specs">
      <h2 id="pd-specs" className="dls-pd__h2">
        Характеристики
      </h2>
      <dl className="dls-pd__specList">
        {shown.map((r, i) => (
          <div key={i} className="dls-pd__specRow">
            <dt>{r.k}</dt>
            <dd>{r.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
