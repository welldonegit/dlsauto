/**
 * «Доставка» + «Приймаємо» on the product page (DLSProduct export). Both are
 * white cards. Editorial texts (carrier conditions, tariff note) come from
 * settings (admin-editable); carrier/payment logos are static export assets in
 * /public/logos; the pickup row is built from the product's pickup point. The
 * «Приймаємо» card shows the payment-logo row (monoPay / Apple Pay / Google Pay
 * / Visa / Mastercard) and four term pills — the last two (Гарантія N днів from
 * the product's warrantyDays, Р14; Обмін або повернення) split off by a divider,
 * exactly as the export. Server component — no interactivity.
 */

export type DeliveryCopy = {
  novaPoshtaNote?: string | null
  deliveryNote?: string | null
  tariffNote?: string | null
  pickupNote?: string | null
  paymentNote?: string | null
} | null

// Payment logos — exact export composition (DLSProduct «Приймаємо»). Apple Pay is
// the apple mark + the «Pay» wordmark (both black); Google Pay is the coloured G
// + a «Pay» text; the rest are single marks. «kind» drives the markup.
const PAY: Array<
  { kind: 'img'; alt: string; src: string; h: string } | { kind: 'apple' } | { kind: 'google' }
> = [
  { kind: 'img', alt: 'monoPay', src: '/logos/monopay-brand.svg', h: '1.5rem' },
  { kind: 'apple' },
  { kind: 'google' },
  { kind: 'img', alt: 'Visa', src: '/logos/visa.svg', h: '1rem' },
  { kind: 'img', alt: 'Mastercard', src: '/logos/mastercard.svg', h: '1.5rem' },
]

function PayIconCash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__payPillIco">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
function PayIconBank() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__payPillIco">
      <path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7" />
      <path d="M12 2l8 5H4z" />
    </svg>
  )
}
function PayIconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__payPillIco">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}
function PayIconReturn() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="dls-pd__payPillIco">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

export function ProductDelivery({
  delivery,
  pickup,
  warrantyDays,
}: {
  delivery: DeliveryCopy
  pickup: { name?: string | null; address?: string | null; hours?: string | null } | null
  warrantyDays: number
}) {
  const d = delivery ?? {}
  const tariff = d.tariffNote?.trim() || 'за тарифом перевізника'
  const pickupText = pickup
    ? `Самовивіз — ${[pickup.name, pickup.address, pickup.hours]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(', ')}`
    : d.pickupNote?.trim() || 'Самовивіз'

  const rows = [
    {
      key: 'np',
      logo: '/logos/novaposhta-color.svg',
      logoH: '0.9375rem',
      alt: 'Нова пошта',
      cond: d.novaPoshtaNote?.trim() || '',
      right: tariff,
      free: false,
    },
    {
      key: 'delivery',
      logo: '/logos/delivery-color.svg',
      logoH: '1.5rem',
      alt: 'Delivery',
      cond: d.deliveryNote?.trim() || '',
      right: tariff,
      free: false,
    },
    {
      key: 'pickup',
      logo: null,
      logoH: '',
      alt: 'Самовивіз',
      cond: pickupText,
      right: 'безкоштовно',
      free: true,
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
            <div key={r.key} className="dls-pd__delivRow">
              <span className="dls-pd__delivLogo">
                {r.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- carrier logo (static)
                  <img src={r.logo} alt={r.alt} style={{ height: r.logoH }} />
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
              <span className="dls-pd__delivCond">{r.cond}</span>
              {r.free ? (
                <span className="dls-pd__delivFree">{r.right}</span>
              ) : (
                <span className="dls-pd__delivTariff">{r.right}</span>
              )}
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
            <li key={p.kind === 'img' ? p.alt : p.kind} className="dls-pd__payChip">
              {p.kind === 'img' ? (
                // eslint-disable-next-line @next/next/no-img-element -- payment logo (static)
                <img src={p.src} alt={p.alt} style={{ height: p.h }} />
              ) : p.kind === 'apple' ? (
                <span role="img" aria-label="Apple Pay" className="dls-pd__payApple">
                  {/* eslint-disable-next-line @next/next/no-img-element -- apple mark */}
                  <img src="/logos/apple.png" alt="" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- Pay wordmark */}
                  <img src="/logos/applepay.png" alt="" />
                </span>
              ) : (
                <span role="img" aria-label="Google Pay" className="dls-pd__payGoogle">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Google G mark */}
                  <img src="/logos/google-g.svg" alt="" />
                  <span>Pay</span>
                </span>
              )}
            </li>
          ))}
        </ul>
        <ul className="dls-pd__payPills">
          <li className="dls-pd__payPill">
            <PayIconCash />
            <span>Готівкою при самовивозі</span>
          </li>
          <li className="dls-pd__payPill">
            <PayIconBank />
            <span>Безготівковий розрахунок для СТО</span>
          </li>
        </ul>
        <div aria-hidden className="dls-pd__payRule" />
        <ul className="dls-pd__payPills">
          {warrantyDays > 0 ? (
            <li className="dls-pd__payPill">
              <PayIconShield />
              <span>
                Гарантія <strong>{warrantyDays} днів</strong>
              </span>
            </li>
          ) : null}
          <li className="dls-pd__payPill">
            <PayIconReturn />
            <span>
              <strong>Обмін або повернення</strong>, якщо не підійшла
            </span>
          </li>
        </ul>
      </section>
    </>
  )
}
