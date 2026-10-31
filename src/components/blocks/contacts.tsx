import type { ReactNode } from 'react'

import { StatusDot } from '@/components/ui/StatusDot'
import { ClockIcon, MapPinIcon, PhoneIcon, TelegramIcon, ViberIcon } from '@/components/ui/icons'
import type { OpenStatus } from '@/lib/hours'

/**
 * Building blocks for the Контакти page: pickup-point cards, channel cards and
 * the map stub. Two pickup points per the owner decision (31.10.2026); Дніпро
 * data is a placeholder until confirmed (PROJECT_CONTEXT §1).
 */

export type Pickup = {
  city: string
  address: string
  schedule: string
  status: OpenStatus | null // null → schedule not yet confirmed
}

export function PickupCard({ pickup }: { pickup: Pickup }) {
  return (
    <article
      className="flex flex-col"
      style={{
        gap: 'var(--space-16)',
        padding: 'var(--space-24)',
        background: 'var(--color-neutral-white)',
        border: 'var(--border-hairline) solid var(--color-neutral-200)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <h2 className="font-semibold" style={{ margin: 0, fontSize: 'var(--text-18)', color: 'var(--color-neutral-900)' }}>
        {pickup.city}
      </h2>
      <ul className="flex flex-col" style={{ gap: 'var(--space-8)', margin: 0, padding: 0, listStyle: 'none' }}>
        <InfoRow icon={<MapPinIcon size="20" />}>{pickup.address}</InfoRow>
        <InfoRow icon={<ClockIcon size="20" />}>{pickup.schedule}</InfoRow>
      </ul>
      {pickup.status ? (
        <StatusDot open={pickup.status.open}>{pickup.status.label}</StatusDot>
      ) : (
        <span style={{ fontSize: 'var(--text-14)', color: 'var(--color-neutral-500)' }}>
          Графік уточнюється
        </span>
      )}
    </article>
  )
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start" style={{ gap: 'var(--space-12)', fontSize: 'var(--text-16)', lineHeight: 'var(--text-16--line-height)', color: 'var(--color-neutral-600)' }}>
      <span className="shrink-0" style={{ color: 'var(--color-neutral-900)' }}>
        {icon}
      </span>
      {children}
    </li>
  )
}

export type Channel = {
  kind: 'telegram' | 'viber' | 'phone'
  name: string
  text: string
  href: string
  target?: string
}

const CHANNEL_ICON = {
  telegram: TelegramIcon,
  viber: ViberIcon,
  phone: PhoneIcon,
}

export function ChannelCard({ channel }: { channel: Channel }) {
  const Icon = CHANNEL_ICON[channel.kind]
  return (
    <a
      href={channel.href}
      target={channel.target}
      rel={channel.target === '_blank' ? 'noopener' : undefined}
      className="grid items-center no-underline transition-shadow duration-200 hover:shadow-md"
      style={{
        gridTemplateColumns: 'var(--icon-32) minmax(0, 1fr)',
        gap: 'var(--space-16)',
        padding: 'var(--space-24)',
        background: 'var(--color-neutral-white)',
        border: 'var(--border-hairline) solid var(--color-neutral-200)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-neutral-900)',
      }}
    >
      <span className="flex items-center justify-center" style={{ width: 'var(--icon-32)', height: 'var(--icon-32)', color: 'var(--color-neutral-900)' }}>
        <Icon size="24" />
      </span>
      <span className="flex min-w-0 flex-col" style={{ gap: 'var(--space-4)' }}>
        <span className="font-semibold" style={{ fontSize: 'var(--text-18)' }}>
          {channel.name}
        </span>
        <span style={{ fontSize: 'var(--text-14)', lineHeight: 'var(--text-14--line-height)', color: 'var(--color-neutral-600)', textWrap: 'pretty' }}>
          {channel.text}
        </span>
      </span>
    </a>
  )
}

/**
 * Static map placeholder with the export's proportions (fills the column,
 * min-height 520 on desktop / 50vh (≥320) below). Two markers stand in for
 * Запоріжжя + Дніпро; a live map is wired in a later stage via an integration.
 */
export function MapStub({ markers }: { markers: string[] }) {
  return (
    <div
      role="img"
      aria-label={`Карта: ${markers.join(', ')}`}
      className="relative overflow-hidden"
      style={{
        height: '100%',
        minHeight: 'var(--space-320)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-neutral-950)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: 'var(--text-13)', color: 'var(--color-neutral-400)' }}>Карта</span>
      </div>
      <div className="absolute inset-0">
        {markers.map((m, i) => (
          <span
            key={m}
            className="absolute flex items-center justify-center font-semibold"
            style={{
              left: i === 0 ? '38%' : '64%',
              top: i === 0 ? '44%' : '58%',
              transform: 'translate(-50%, -50%)',
              width: 'var(--control-h-48)',
              height: 'var(--control-h-48)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)',
              border: 'var(--border-thick) solid var(--color-neutral-0)',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--color-neutral-0)',
              fontSize: 'var(--text-11)',
              letterSpacing: '-0.02em',
            }}
            title={m}
          >
            DLS
          </span>
        ))}
      </div>
    </div>
  )
}
