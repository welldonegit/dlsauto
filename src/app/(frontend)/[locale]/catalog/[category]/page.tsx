import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView, type CatalogSearch } from '@/components/catalog/CatalogView'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { getCategoryTree } from '@/lib/data'
import { breadcrumbJsonLd, localeAlternates, metadataBase } from '@/lib/meta'

/**
 * Category listing `/catalog/<category>` (DLSCatalog scoped to one category).
 * Further filters are query params; canonical is the clean category path (§8).
 */

async function findCategory(slug: string, locale: Locale) {
  const tree = await getCategoryTree(locale)
  return tree.find((c) => c.slug === slug) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  if (!isLocale(locale)) return {}
  const cat = await findCategory(category, locale)
  if (!cat) return {}
  const title = cat.seoTitle?.trim() || `${cat.name} — запчастини — DLSAuto`
  const description =
    cat.seoDescription?.trim() ||
    `Вживані деталі категорії «${cat.name}» з власної розбірки DLSAuto — перевірені, з фото реальної деталі. Запоріжжя та Дніпро.`
  return {
    metadataBase: metadataBase(),
    title,
    description,
    alternates: localeAlternates(locale, `/catalog/${cat.slug}`),
  }
}

export default async function CategoryRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>
  searchParams: Promise<CatalogSearch>
}) {
  const { locale, category } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const cat = await findCategory(category, loc)
  if (!cat || !cat.slug) notFound()
  const search = await searchParams
  const prefix = loc === 'uk' ? '' : '/ru'

  const ld = breadcrumbJsonLd([
    { name: 'Головна', path: `${prefix}/` },
    { name: 'Каталог', path: `${prefix}/catalog` },
    { name: cat.name, path: `${prefix}/catalog/${cat.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader locale={loc} />
      <CatalogView locale={loc} category={{ slug: cat.slug, name: cat.name }} search={search} />
      <Footer />
    </>
  )
}
