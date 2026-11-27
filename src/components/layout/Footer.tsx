import Image from 'next/image'
import Link from 'next/link'

import { Accordion } from '@/components/ui/Accordion'
import { Container } from '@/components/ui/layout'
import { ArrowRightIcon, TelegramIcon, TikTokIcon, ViberIcon } from '@/components/ui/icons'
import { getBrands, getCategoryTree, getPickupPoints, getSettings } from '@/lib/data'
import { formatScheduleLabel } from '@/lib/schedule'

import { FooterCallback } from './FooterCallback'

/**
 * Site footer, identical on every page. Nav columns (desktop) / accordion
 * (mobile), the shared call-back card, the СТО strip, legal row, and the two
 * pickup addresses (Запоріжжя + Дніпро — placeholders until the client confirms
 * them, PROJECT_CONTEXT §1).
 */

type Column = { title: string; items: { label: string; href: string }[] }

// The «Каталог» and «Марки» columns are built from collections at render time
// (see Footer) so they always reflect the real data — never a hard-coded list.
// «Покупцям» and «Компанія» keep the export's item set and order; each item
// points to its page where one exists, and stays a `#` placeholder where the
// page arrives in a later stage. Layout is unchanged — only hrefs.
const STATIC_COLS: Column[] = [
  {
    title: 'Покупцям',
    items: [
      // No dedicated pages yet — these land in later stages (FAQ/reviews are
      // home blocks today; delivery/warranty/СТО have no standalone page).
      'Як підібрати запчастину',
      'Оплата і доставка',
      'Гарантія та повернення',
      'Часті питання',
      'Відгуки',
      'Умови для СТО',
    ].map((label) => ({ label, href: '#' })),
  },
  {
    title: 'Компанія',
    items: [
      { label: 'Про компанію', href: '/about' },
      { label: 'Вакансії', href: '#' }, // no page yet
      { label: 'Контакти', href: '/contacts' },
      { label: 'Prom.ua', href: '#' }, // external link — awaits settings.marketplaces URL
      { label: 'OLX', href: '#' }, // external link — awaits settings.marketplaces URL
    ],
  },
]

// Export's «Марки» column: the same five labels + «Усі марки», resolved to real
// brand pages from the brands collection. A label with no matching published
// brand stays `#`; «Усі марки» stays `#` until a brands index page exists.
const FOOTER_BRANDS = ['Mitsubishi', 'Ford', 'Nissan', 'Mazda', 'Jeep']

type Address = { city: string; line: string; hours: string }
type SocialLink = { label: string; href: string; Icon: typeof TelegramIcon }

function ColumnLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="no-underline"
      style={{
        fontSize: 'var(--text-16)',
        lineHeight: 'var(--text-16--line-height)',
        color: 'var(--color-neutral-600)',
      }}
    >
      <span className="dls-underline">{label}</span>
    </Link>
  )
}

function Socials({ links }: { links: SocialLink[] }) {
  return (
    <div
      className="flex"
      style={{ gap: 'var(--space-8)', marginLeft: 'calc(-1 * var(--space-8) - var(--space-2))' }}
    >
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="flex items-center justify-center"
          style={{
            width: 'var(--control-h-44)',
            height: 'var(--control-h-44)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-neutral-900)',
          }}
        >
          <Icon size="24" />
        </a>
      ))}
    </div>
  )
}

function Brand({ addresses, socials }: { addresses: Address[]; socials: SocialLink[] }) {
  return (
    <div className="flex flex-col items-start" style={{ gap: 'var(--space-24)' }}>
      <Link
        href="/"
        aria-label="DLSAuto — на головну"
        className="font-semibold no-underline"
        style={{
          fontSize: 'var(--space-48)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: 'var(--color-neutral-900)',
        }}
      >
        DLSAuto
      </Link>
      <Socials links={socials} />
      <ul
        className="flex flex-col"
        style={{ gap: 'var(--space-16)', margin: 0, padding: 0, listStyle: 'none' }}
      >
        {addresses.map((a) => (
          <li
            key={a.city}
            style={{
              fontSize: 'var(--text-14)',
              lineHeight: 'var(--text-14--line-height)',
              color: 'var(--color-neutral-600)',
            }}
          >
            <span className="font-semibold" style={{ color: 'var(--color-neutral-900)' }}>
              {a.city}
            </span>{' '}
            — {a.line}, {a.hours}
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function Footer() {
  const [settings, points, categories, brands] = await Promise.all([
    getSettings(),
    getPickupPoints(),
    getCategoryTree(),
    getBrands(),
  ])
  // «Каталог» column = the real categories (order _order) + «Усі категорії»,
  // matching the export's item count (9 + 1). No hard-coded «Оптика».
  const catalogCol: Column = {
    title: 'Каталог',
    items: [
      ...categories
        .filter((c) => c.slug)
        .map((c) => ({ label: c.name, href: `/catalog/${c.slug as string}` })),
      { label: 'Усі категорії', href: '/catalog' },
    ],
  }
  // «Марки» column = export's labels resolved to real brand pages.
  const brandSlug = new Map(brands.map((b) => [b.name, b.slug]))
  const marksCol: Column = {
    title: 'Марки',
    items: [
      ...FOOTER_BRANDS.map((name) => {
        const slug = brandSlug.get(name)
        return { label: name, href: slug ? `/brand/${slug}` : '#' }
      }),
      { label: 'Усі марки', href: '#' },
    ],
  }
  const COLS: Column[] = [catalogCol, marksCol, ...STATIC_COLS]
  const addresses: Address[] = points.map((p) => ({
    city: p.name,
    line: p.address,
    hours: formatScheduleLabel(p.schedule),
  }))
  const s = settings.socials ?? {}
  const socials: SocialLink[] = [
    { label: 'Telegram', href: s.telegram || '#', Icon: TelegramIcon },
    { label: 'Viber', href: s.viber || '#', Icon: ViberIcon },
    { label: 'TikTok', href: s.tiktok || '#', Icon: TikTokIcon },
  ]

  return (
    <footer className="font-sans" style={{ color: 'var(--color-neutral-900)' }}>
      {/* top band */}
      <div style={{ background: 'var(--color-neutral-0)' }}>
        <Container className="pt-[var(--space-48)] pb-[var(--space-32)] md:pt-[var(--space-64)] md:pb-[var(--space-48)] wide:pt-[var(--space-96)] wide:pb-[var(--space-64)]">
          <div
            className="grid grid-cols-1 wide:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
            style={{ gap: 'var(--space-48) var(--space-24)' }}
          >
            <Brand addresses={addresses} socials={socials} />
            {/* desktop/tablet columns */}
            <div
              className="hidden grid-cols-2 md:grid wide:grid-cols-4"
              style={{ gap: 'var(--space-48) var(--space-24)' }}
            >
              {COLS.map((c) => (
                <nav
                  key={c.title}
                  aria-label={c.title}
                  className="flex flex-col"
                  style={{ gap: 'var(--space-24)' }}
                >
                  <p
                    className="font-semibold"
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-16)',
                      color: 'var(--color-neutral-900)',
                    }}
                  >
                    {c.title}
                  </p>
                  <div className="flex flex-col" style={{ gap: 'var(--space-12)' }}>
                    {c.items.map((it) => (
                      <ColumnLink key={it.label} href={it.href} label={it.label} />
                    ))}
                  </div>
                </nav>
              ))}
            </div>
            {/* mobile accordion */}
            <div className="md:hidden" style={{ marginTop: 'var(--space-32)' }}>
              <Accordion
                items={COLS.map((c) => ({
                  id: c.title,
                  title: c.title,
                  content: (
                    <div className="flex flex-col">
                      {c.items.map((it) => (
                        <Link
                          key={it.label}
                          href={it.href}
                          className="flex items-center no-underline"
                          style={{
                            minHeight: 'var(--control-h-44)',
                            fontSize: 'var(--text-16)',
                            color: 'var(--color-neutral-600)',
                          }}
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        </Container>
      </div>

      {/* lower band */}
      <div style={{ background: 'var(--color-neutral-100)' }}>
        <Container className="pt-[var(--space-32)] pb-[var(--space-24)] md:pt-[var(--space-48)] md:pb-[var(--space-32)] wide:pt-[var(--space-64)]">
          {/* call-back card */}
          <div
            className="grid grid-cols-1 items-center p-[var(--space-24)] md:p-[var(--space-32)] wide:grid-cols-2 wide:p-[var(--space-48)]"
            style={{
              gap: 'var(--space-24) var(--space-48)',
              background: 'var(--color-neutral-0)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div>
              <h3
                className="font-semibold"
                style={{ margin: 0, fontSize: 'var(--text-18)', color: 'var(--color-neutral-900)' }}
              >
                Потрібна консультація?
              </h3>
              <p
                style={{
                  margin: 'var(--space-8) 0 0',
                  maxWidth: '60ch',
                  fontSize: 'var(--text-16)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                Залиште номер — передзвонимо протягом 15 хвилин у робочий час, допоможемо перевірити
                сумісність і підкажемо наявність
              </p>
            </div>
            <FooterCallback />
          </div>

          {/* СТО strip */}
          <div
            className="flex flex-wrap items-baseline"
            style={{
              marginTop: 'var(--space-32)',
              padding: 'var(--space-24) 0',
              gap: 'var(--space-8) var(--space-24)',
              borderTop: 'var(--border-hairline) solid var(--color-neutral-300)',
              borderBottom: 'var(--border-hairline) solid var(--color-neutral-300)',
            }}
          >
            <a
              href="#"
              className="group flex items-center no-underline"
              style={{
                gap: 'var(--space-16)',
                fontSize: 'var(--text-18)',
                color: 'var(--color-neutral-600)',
              }}
            >
              <span>
                Ремонтуєте авто клієнтів? Зв&apos;яжіться з нами — для СТО є окремі умови на
                доставку та ціни
              </span>
              <span
                aria-hidden="true"
                className="flex shrink-0 items-center justify-center transition-colors"
                style={{
                  width: 'var(--control-h-48)',
                  height: 'var(--control-h-48)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-neutral-0)',
                  color: 'var(--color-neutral-900)',
                }}
              >
                <ArrowRightIcon size="20" />
              </span>
            </a>
          </div>

          {/* legal row — stacked under © on mobile, split row from md up */}
          <div
            className="flex flex-col md:flex-row md:flex-wrap md:justify-between"
            style={{
              padding: 'var(--space-24) 0 0',
              gap: 'var(--space-12) var(--space-24)',
              fontSize: 'var(--text-14)',
              color: 'var(--color-neutral-600)',
            }}
          >
            <span>© 2026 DLSAuto</span>
            <div
              className="flex flex-col flex-wrap items-start md:flex-row"
              style={{ gap: 'var(--space-12) var(--space-24)' }}
            >
              <Link
                href="/policy"
                className="no-underline"
                style={{ color: 'var(--color-neutral-600)' }}
              >
                <span className="dls-underline">Політика конфіденційності</span>
              </Link>
              <Link
                href="/oferta"
                className="no-underline"
                style={{ color: 'var(--color-neutral-600)' }}
              >
                <span className="dls-underline">Публічна оферта</span>
              </Link>
              {/* no «Умови повернення» page yet — stays a placeholder */}
              <a href="#" className="no-underline" style={{ color: 'var(--color-neutral-600)' }}>
                <span className="dls-underline">Умови повернення</span>
              </a>
              <a
                href="https://well-done.com.ua/"
                target="_blank"
                rel="noopener"
                aria-label="Створено з душею — welldone"
                className="flex items-center no-underline"
                style={{ gap: 'var(--space-8)', color: 'var(--color-neutral-600)' }}
              >
                Створено з душею
                <Image src="/images/welldone-logo.svg" alt="welldone" width={97} height={16} />
              </a>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  )
}
