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
import { Header } from '@/components/layout/Header'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusDot } from '@/components/ui/StatusDot'
import { Container, Section } from '@/components/ui/layout'
import { isLocale } from '@/i18n/config'
import { DEFAULT_SCHEDULE, pickupStatus } from '@/lib/hours'

// Live open/closed status depends on the current time → render per request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Контакти — DLSAuto',
  description:
    'Два пункти видачі — Запоріжжя та Дніпро. Телефон, Telegram, Viber, графік роботи та форма запиту про деталь.',
}

const CHANNELS: Channel[] = [
  {
    kind: 'telegram',
    name: 'Telegram',
    text: 'Найшвидше. Надішліть фото деталі та номер — відповімо за 5–10 хвилин у робочий час',
    href: 'https://t.me/',
    target: '_blank',
  },
  {
    kind: 'viber',
    name: 'Viber',
    text: 'Те саме, якщо зручніше у Viber',
    href: 'viber://chat?number=%2B380986401357',
  },
  {
    kind: 'phone',
    name: '+380 98 640 13 57',
    text: 'Якщо треба обговорити голосом. Пн–Сб 9:00–18:00',
    href: 'tel:+380986401357',
  },
]

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const now = new Date()
  // Main-point status shown as the page status line (Запоріжжя); the cards carry
  // address + schedule only, so the status is not duplicated.
  const zpStatus = pickupStatus(now, DEFAULT_SCHEDULE)
  const pickups: Pickup[] = [
    {
      city: 'Запоріжжя',
      address: 'Південне шосе, [номер]',
      schedule: 'Пн–Сб 9:00–18:00',
      status: null,
    },
    {
      // Дніпро — address and schedule pending client confirmation (PROJECT_CONTEXT §1).
      city: 'Дніпро',
      address: 'вул. [адреса]',
      schedule: 'графік уточнюється',
      status: null,
    },
  ]

  return (
    <>
      <Header />
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
                  <p style={{ margin: 0, fontSize: 'var(--text-16)', lineHeight: 'var(--text-16--line-height)' }}>
                    <StatusDot open={zpStatus.open}>{zpStatus.label}</StatusDot>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-12)' }}>
                  {pickups.map((p) => (
                    <PickupCard key={p.city} pickup={p} />
                  ))}
                </div>
                <div className="flex flex-col" style={{ gap: 'var(--space-12)' }}>
                  {CHANNELS.map((c) => (
                    <ChannelCard key={c.name} channel={c} />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <MapStub markers={['Запоріжжя', 'Дніпро']} />
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
                style={{ aspectRatio: '4 / 3', borderRadius: 'var(--radius-lg)', background: 'var(--color-neutral-200)' }}
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
                  style={{ margin: 'var(--space-24) 0 0', color: 'var(--color-neutral-900)', textWrap: 'pretty' }}
                >
                  Заїзд з вулиці [X], сіра брама з логотипом. Паркування біля воріт. Якщо заблукали —
                  зателефонуйте, зустрінемо.
                </p>
                <ul
                  className="flex flex-col"
                  style={{ margin: 'var(--space-32) 0 0', padding: 0, listStyle: 'none', gap: 'var(--space-12)' }}
                >
                  {[
                    'Самовивіз — покажемо деталь і авто-донора до оплати',
                    'Відкладемо деталь на 3 дні після замовлення',
                    'Для СТО — доставка в бокс по Запоріжжю',
                  ].map((t) => (
                    <li key={t} className="flex items-baseline" style={{ gap: 'var(--space-12)', fontSize: 'var(--text-16)', lineHeight: 'var(--text-16--line-height)' }}>
                      <span aria-hidden="true" className="relative shrink-0" style={{ top: 'var(--space-8)', width: 'var(--space-8)', height: 'var(--space-8)', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)' }} />
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
                  style={{ margin: 'var(--space-24) 0 0', color: 'var(--color-neutral-600)', textWrap: 'pretty' }}
                >
                  Найшвидший спосіб дізнатись, чи підійде деталь: надішліть фото або номер — перевіримо
                  сумісність і відповімо протягом 15 хвилин у робочий час
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
