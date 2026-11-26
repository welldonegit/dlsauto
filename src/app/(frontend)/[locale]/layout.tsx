import type { Metadata } from 'next'
import { Golos_Text, JetBrains_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { QuickViewHost } from '@/components/QuickViewHost'
import { ToastHost } from '@/components/ui/ToastHost'
import { isLocale, locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSettings } from '@/lib/data'
import { getSiteUrl } from '@/lib/env'

import '../../globals.css'

// Design font. Weights 400/500/600 per the audit; exposed as --font-golos
// and consumed by --font-sans in globals.css.
const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-golos',
})

// Monospace for SKU / part-number tags (404 art, "Шлях деталі"); --font-mono.
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// Render the whole frontend per request. This layout and its pages read live
// inventory/CMS data from Postgres (getSettings here; home, catalog, product,
// brand/model below). The production build — CI quality `Build` and the Docker
// `builder` stage — runs with no reachable DB by design (Dockerfile: "no DB
// access needed"), so nothing may prerender against the DB at build time.
// Queries stay cached via unstable_cache + tag revalidation, so this is
// request-time rendering, not a per-request DB hit.
export const dynamic = 'force-dynamic'

// Layout sets metadataBase and a title default. Concrete
// title/description/canonical/hreflang live on each page (home, catch-all CMS
// pages), which set an absolute title that overrides the default. not-found.tsx
// has no metadata hook and cannot hoist its own <title> (Next owns it), so the
// default here is the 404 title — only ever shown when no page title is set.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : 'uk')
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: dict.notFound.title, template: '%s' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  // Quick-view service list — site-wide, from settings. (Warranty now comes from
  // product.warrantyDays per product, Р14 — settings.quickView.warranty is unused.)
  const settings = await getSettings(locale as Locale)
  const qvServices = settings.quickView?.services
    ? settings.quickView.services
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return (
    <html lang={locale} className={`${golos.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <ToastHost />
        <QuickViewHost services={qvServices} />
      </body>
    </html>
  )
}
