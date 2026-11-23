import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Favorites } from '@/components/favorites/Favorites'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { breadcrumbJsonLd, metadataBase } from '@/lib/meta'

/**
 * «Обране» `/favorites` (§8, noindex — a personal list). The list itself is
 * client-side (localStorage); this route is just the shell + header/footer.
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
    title: 'Обране — DLSAuto',
    robots: { index: false, follow: true },
  }
}

export default async function FavoritesRoutePage({
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
    { name: 'Обране', path: `${prefix}/favorites` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader locale={loc} />
      <Favorites locale={loc} />
      <Footer />
    </>
  )
}
