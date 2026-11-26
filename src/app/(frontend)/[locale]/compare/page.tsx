import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Compare } from '@/components/compare/Compare'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { breadcrumbJsonLd, metadataBase } from '@/lib/meta'

/**
 * «Порівняння» `/compare` (manifest «Развилки URL», noindex — a personal list).
 * The compared set is client-side (localStorage); this route is the shell.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return {
    metadataBase: metadataBase(),
    title: 'Порівняння — DLSAuto',
    robots: { index: false, follow: true },
  }
}

export default async function CompareRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const prefix = loc === 'uk' ? '' : '/ru'

  const ld = breadcrumbJsonLd([
    { name: 'Головна', path: `${prefix}/` },
    { name: 'Порівняння', path: `${prefix}/compare` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader locale={loc} />
      <Compare locale={loc} />
      <Footer />
    </>
  )
}
