/**
 * «Доставка» + «Приймаємо» on the product page (DLSProduct export). Editorial
 * texts come from settings (admin-editable, owner 26.11); carrier/payment logos
 * are static export assets in /public/logos. Delivery lists Нова пошта / Delivery
 * / Самовивіз (the pickup row uses the product's pickup point); «Приймаємо» shows
 * the payment logo chips + a note. Server component — no interactivity.
 */

export type DeliveryCopy = {
  novaPoshtaNote?: string | null
  deliveryNote?: string | null
  tariffNote?: string | null
  pickupNote?: string | null
  paymentNote?: string | null
} | null

const PAY = [
  { src: '/logos/monopay-brand.svg', alt: 'monoPay', h: '1.5rem' },
  { src: '/logos/apple.png', alt: 'Apple Pay', h: '1.375rem' },
  { src: '/logos/gpay.svg', alt: 'Google Pay', h: '1.375rem' },
  { src: '/logos/visa.svg', alt: 'Visa', h: '1rem' },
  { src: '/logos/mastercard.svg', alt: 'Mastercard', h: '1.5rem' },
]

export function ProductDelivery({
  delivery,
  pickup,
}: {
  delivery: DeliveryCopy
  pickup: { name?: string | null; address?: string | null } | null
}) {
  const d = delivery ?? {}
  const tariff = d.tariffNote?.trim() || ''
  const withTariff = (note?: string | null) => [note?.trim(), tariff].filter(Boolean).join(' · ')
  const rows = [
    { logo: '/logos/novaposhta.svg', name: 'Нова пошта', note: withTariff(d.novaPoshtaNote) },
    { logo: '/logos/delivery.svg', name: 'Delivery', note: withTariff(d.deliveryNote) },
    {
      logo: null,
      name: pickup?.name ? `Самовивіз, ${pickup.name}` : 'Самовивіз',
      note: pickup?.address?.trim() || d.pickupNote?.trim() || '',
    },
  ]

  return (
    <>
      <section aria-labelledby="pd-deliv" className="dls-pd__deliv">
        <h2 id="pd-deliv" className="dls-pd__h2">
          Доставка
        </h2>
        <div className="dls-pd__delivList">
          {rows.map((r) => (
            <div key={r.name} className="dls-pd__delivRow">
              <span className="dls-pd__delivLogo">
                {r.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- carrier logo (static)
                  <img src={r.logo} alt={r.name} />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="dls-pd__delivInfo">
                <b>{r.name}</b>
                {r.note ? <span>{r.note}</span> : null}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="pd-pay" className="dls-pd__pay">
        <h2 id="pd-pay" className="dls-pd__h2">
          Приймаємо
        </h2>
        <ul aria-label="Способи оплати" className="dls-pd__payChips">
          {PAY.map((p) => (
            <li key={p.alt} className="dls-pd__payChip">
              {/* eslint-disable-next-line @next/next/no-img-element -- payment logo (static) */}
              <img src={p.src} alt={p.alt} style={{ height: p.h }} />
            </li>
          ))}
        </ul>
        {d.paymentNote?.trim() ? <p className="dls-pd__payNote">{d.paymentNote}</p> : null}
      </section>
    </>
  )
}
