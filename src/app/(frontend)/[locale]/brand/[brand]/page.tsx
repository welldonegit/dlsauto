import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView, type CatalogSearch } from '@/components/catalog/CatalogView'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { getBrands } from '@/lib/data'
import { breadcrumbJsonLd, localeAlternates, metadataBase } from '@/lib/meta'

/**
 * Brand page `/brand/<brand>` (§8). Reuses the DLSCatalog listing scoped to one
 * brand — the export has no dedicated brand page, and its brand/model pickers all
 * route to the catalog filtered by brand. Canonical is the clean brand path.
 */

async function findBrand(slug: string) {
  const brands = await getBrands()
  return brands.find((b) => b.slug === slug) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>
}): Promise<Metadata> {
  const { locale, brand } = await params
  if (!isLocale(locale)) return {}
  const b = await findBrand(brand)
  if (!b || !b.slug) return {}
  return {
    metadataBase: metadataBase(),
    title: `${b.name} — запчастини — DLSAuto`,
    description: `Вживані запчастини ${b.name} з власної розбірки DLSAuto — перевірені деталі з фото реальної деталі. Запоріжжя та Дніпро, відправка в день замовлення.`,
    alternates: localeAlternates(locale, `/brand/${b.slug}`),
  }
}

export default async function BrandRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; brand: string }>
  searchParams: Promise<CatalogSearch>
}) {
  const { locale, brand } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const b = await findBrand(brand)
  if (!b || !b.slug) notFound()
  const search = await searchParams
  const prefix = loc === 'uk' ? '' : '/ru'

  const ld = breadcrumbJsonLd([
    { name: 'Головна', path: `${prefix}/` },
    { name: 'Каталог', path: `${prefix}/catalog` },
    { name: b.name, path: `${prefix}/brand/${b.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader locale={loc} />
      <CatalogView
        locale={loc}
        category={null}
        scope={{ kind: 'brand', brandSlug: b.slug, brandName: b.name }}
        search={search}
      />
      <Footer />
    </>
  )
}
