import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView, type CatalogSearch } from '@/components/catalog/CatalogView'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { breadcrumbJsonLd, localeAlternates, metadataBase } from '@/lib/meta'

/**
 * Catalog root `/catalog` — the full in-stock listing (DLSCatalog). Filters are
 * query params; the canonical is the clean path (§8). Category index lives on
 * the home `categoriesBlock`; the mega-menu "Усі категорії" points here.
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
    title: 'Каталог запчастин — DLSAuto',
    description:
      'Каталог вживаних автозапчастин з власної розбірки DLSAuto — фільтри за авто, категорією та ціною. Перевірені деталі з фото, відправка в день замовлення.',
    alternates: localeAlternates(locale, '/catalog'),
  }
}

export default async function CatalogRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<CatalogSearch>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const search = await searchParams
  const prefix = loc === 'uk' ? '' : '/ru'

  const ld = breadcrumbJsonLd([
    { name: 'Головна', path: `${prefix}/` },
    { name: 'Каталог', path: `${prefix}/catalog` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader locale={loc} />
      <CatalogView locale={loc} category={null} search={search} />
      <Footer />
    </>
  )
}
