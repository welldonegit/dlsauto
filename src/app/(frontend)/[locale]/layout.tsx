import type { Metadata } from 'next'
import { Golos_Text, JetBrains_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
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

  return (
    <html lang={locale} className={`${golos.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  )
}
