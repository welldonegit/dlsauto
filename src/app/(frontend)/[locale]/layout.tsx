import type { Metadata } from 'next'
import { Golos_Text } from 'next/font/google'
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const dict = getDictionary(locale)
  return {
    metadataBase: new URL(getSiteUrl()),
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    alternates: {
      canonical: locale === 'uk' ? '/' : '/ru',
      languages: {
        uk: '/',
        ru: '/ru',
        'x-default': '/',
      },
    },
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
    <html lang={locale} className={golos.variable}>
      <body>{children}</body>
    </html>
  )
}
