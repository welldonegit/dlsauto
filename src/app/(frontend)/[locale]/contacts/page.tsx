import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { ContactForm } from '@/components/blocks/ContactForm'
import {
  ChannelCard,
  MapStub,
  PickupCard,
  type Channel,
  type Pickup,
} from '@/components/blocks/contacts'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusDot } from '@/components/ui/StatusDot'
import { Container, Section } from '@/components/ui/layout'
import { isLocale } from '@/i18n/config'
import { getPickupPoints, getSettings } from '@/lib/data'
import { formatScheduleLabel, pickupOpenStatus } from '@/lib/schedule'

// Live open/closed status depends on the current time → render per request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Контакти — DLSAuto',
  description:
    'Два пункти видачі — Запоріжжя та Дніпро. Телефон, Telegram, Viber, графік роботи та форма запиту про деталь.',
}

// Default copy per channel; overridden by settings.channelNotes when set.
const CHANNEL_TEXT: Record<Channel['kind'], string> = {
  telegram: 'Найшвидше. Надішліть фото деталі та номер — відповімо за 5–10 хвилин у робочий час',
  viber: 'Те саме, якщо зручніше у Viber',
  phone: 'Якщо треба обговорити голосом. Пн–Сб 9:00–18:00',
}

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [settings, points] = await Promise.all([getSettings(locale), getPickupPoints(locale)])
  const now = new Date()
  const defaultPoint = points.find((p) => p.isDefault) ?? points[0]
  // Main-point status shown as the page status line (Запоріжжя); the cards carry
  // address + schedule only, so the status is not duplicated.
  const zpStatus = defaultPoint ? pickupOpenStatus(defaultPoint.schedule, now) : null
  const pickups: Pickup[] = points.map((p) => ({
    city: p.name,
    address: p.address,
    schedule: formatScheduleLabel(p.schedule),
    status: null,
  }))

  const phone = settings.phones?.[0]?.number
  const notes = settings.channelNotes ?? {}
  const channels: Channel[] = [
    settings.messengers?.telegram && {
      kind: 'telegram' as const,
      name: 'Telegram',
      text: notes.telegram || CHANNEL_TEXT.telegram,
      href: settings.messengers.telegram,
      target: '_blank',
    },
    settings.messengers?.viber && {
      kind: 'viber' as const,
      name: 'Viber',
      text: notes.viber || CHANNEL_TEXT.viber,
      href: settings.messengers.viber,
    },
    phone && {
      kind: 'phone' as const,
      name: phone,
      text: notes.phone || CHANNEL_TEXT.phone,
      href: `tel:${phone.replace(/[^+\d]/g, '')}`,
    },
  ].filter(Boolean) as Channel[]

  return (
    <>
      <SiteHeader />
      <main style={{ background: 'var(--color-neutral-0)', color: 'var(--color-neutral-900)' }}>
        {/* ----------------------------------- pickup points + channels + map */}
        <Section padTop="header" aria-label="Контакти — пункти видачі та канали">
          <Container>
            <div className="grid grid-cols-1 items-stretch gap-[var(--space-32)] lg:grid-cols-2 wide:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] wide:gap-[var(--space-48)]">
              <div className="flex min-w-0 flex-col" style={{ gap: 'var(--space-32)' }}>
                <div className="flex flex-col" style={{ gap: 'var(--space-16)' }}>
                  <h1
                    className="font-semibold text-28 md:text-32 lg:text-40"
                    style={{ margin: 0, letterSpacing: '-0.02em' }}
                  >
                    Контакти
                  </h1>
                  {zpStatus ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-16)',
                        lineHeight: 'var(--text-16--line-height)',
                      }}
                    >
                      <StatusDot open={zpStatus.open}>{zpStatus.label}</StatusDot>
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-12)' }}>
                  {pickups.map((p) => (
                    <PickupCard key={p.city} pickup={p} />
                  ))}
                </div>
                <div className="flex flex-col" style={{ gap: 'var(--space-12)' }}>
                  {channels.map((c) => (
                    <ChannelCard key={c.name} channel={c} />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <MapStub markers={points.map((p) => p.name)} />
              </div>
            </div>
          </Container>
        </Section>

        {/* -------------------------------------------------- як нас знайти */}
        <Section band aria-label="Контакти — як нас знайти">
          <Container>
            <div className="grid grid-cols-1 items-center gap-[var(--space-32)] lg:grid-cols-2 wide:gap-[var(--space-48)]">
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-neutral-200)',
                }}
              >
                <Image
                  src="/images/contacts-gate.jpg"
                  alt="Сіра брама з логотипом DLSAuto, вид з дороги"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <SectionHeading>Як нас знайти</SectionHeading>
                <p
                  className="text-14 md:text-16 wide:text-18"
                  style={{
                    margin: 'var(--space-24) 0 0',
                    color: 'var(--color-neutral-900)',
                    textWrap: 'pretty',
                  }}
                >
                  Заїзд з вулиці [X], сіра брама з логотипом. Паркування біля воріт. Якщо заблукали
                  — зателефонуйте, зустрінемо.
                </p>
                <ul
                  className="flex flex-col"
                  style={{
                    margin: 'var(--space-32) 0 0',
                    padding: 0,
                    listStyle: 'none',
                    gap: 'var(--space-12)',
                  }}
                >
                  {[
                    'Самовивіз — покажемо деталь і авто-донора до оплати',
                    'Відкладемо деталь на 3 дні після замовлення',
                    'Для СТО — доставка в бокс по Запоріжжю',
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex items-baseline"
                      style={{
                        gap: 'var(--space-12)',
                        fontSize: 'var(--text-16)',
                        lineHeight: 'var(--text-16--line-height)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="relative shrink-0"
                        style={{
                          top: 'var(--space-8)',
                          width: 'var(--space-8)',
                          height: 'var(--space-8)',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-primary)',
                        }}
                      />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>

        {/* -------------------------------------------------- запитати про деталь */}
        <Section aria-label="Контакти — запитати про деталь">
          <Container>
            <div className="grid grid-cols-1 items-start gap-[var(--space-32)] lg:grid-cols-2 wide:grid-cols-[minmax(0,40fr)_minmax(0,55fr)] wide:gap-[var(--space-96)]">
              <div className="min-w-0">
                <SectionHeading>Запитати про деталь</SectionHeading>
                <p
                  className="text-14 md:text-16 wide:text-18"
                  style={{
                    margin: 'var(--space-24) 0 0',
                    color: 'var(--color-neutral-600)',
                    textWrap: 'pretty',
                  }}
                >
                  Найшвидший спосіб дізнатись, чи підійде деталь: надішліть фото або номер —
                  перевіримо сумісність і відповімо протягом 15 хвилин у робочий час
                </p>
              </div>
              <div className="min-w-0">
                <ContactForm />
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  )
}
