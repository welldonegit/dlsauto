import { getPayloadClient } from '@/lib/payload'
import { IN_STOCK_WHERE } from '@/lib/rules'

/**
 * Admin dashboard counters (STAGE_2_PROMPT §7): a stub ahead of the stage-7
 * analytics — in stock, sold in the last 30 days, leads. Server component.
 * "В наявності" uses the same availability filter as the storefront (Р39) so
 * reserved/quantity-sold parts are not counted as available.
 */
export default async function BeforeDashboard() {
  const payload = await getPayloadClient()
  // Server component computing a per-request 30-day window — not a render-pure value.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [inStock, sold, leads] = await Promise.all([
    payload.count({ collection: 'products', where: { and: [...IN_STOCK_WHERE] } }),
    payload.count({
      collection: 'products',
      where: { and: [{ status: { equals: 'sold' } }, { soldAt: { greater_than_equal: since } }] },
    }),
    payload.count({ collection: 'leads' }),
  ])

  const tiles = [
    { label: 'В наявності', value: inStock.totalDocs },
    { label: 'Продано за 30 днів', value: sold.totalDocs },
    { label: 'Заявки', value: leads.totalDocs },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        margin: '0 0 2rem',
      }}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '.5rem',
            background: 'var(--theme-elevation-50)',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>{t.value}</div>
          <div style={{ marginTop: '.25rem', color: 'var(--theme-elevation-600)' }}>{t.label}</div>
        </div>
      ))}
    </div>
  )
}
