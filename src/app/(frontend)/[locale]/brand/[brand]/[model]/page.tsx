import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView, type CatalogSearch } from '@/components/catalog/CatalogView'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { getBrands, getModelsByBrand } from '@/lib/data'
import { breadcrumbJsonLd, localeAlternates, metadataBase } from '@/lib/meta'
import { modelLabel } from '@/lib/rules'

/**
 * Model page `/brand/<brand>/<model>` (§8). Reuses the DLSCatalog listing scoped
 * to one model (products of the model + its twins via alsoFits). Canonical is the
 * clean model path.
 */

async function resolve(brandSlug: string, modelSlug: string, locale: Locale) {
  const brands = await getBrands()
  const brand = brands.find((b) => b.slug === brandSlug) ?? null
  if (!brand || !brand.slug) return null
  const models = await getModelsByBrand(brand.slug, locale)
  const model = models.find((m) => m.slug === modelSlug) ?? null
  if (!model || !model.slug) return null
  return { brand, model }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; brand: string; model: string }>
}): Promise<Metadata> {
  const { locale, brand, model } = await params
  if (!isLocale(locale)) return {}
  const r = await resolve(brand, model, locale as Locale)
  if (!r) return {}
  const label = modelLabel(r.model)
  return {
    metadataBase: metadataBase(),
    title: `${r.brand.name} ${label} — запчастини — DLSAuto`,
    description: `Вживані запчастини на ${r.brand.name} ${label} з власної розбірки DLSAuto — перевірені деталі з фото реальної деталі. Відправка в день замовлення.`,
    alternates: localeAlternates(locale, `/brand/${r.brand.slug}/${r.model.slug}`),
  }
}

export default async function ModelRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; brand: string; model: string }>
  searchParams: Promise<CatalogSearch>
}) {
  const { locale, brand, model } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const r = await resolve(brand, model, loc)
  if (!r) notFound()
  const search = await searchParams
  const prefix = loc === 'uk' ? '' : '/ru'
  const label = modelLabel(r.model)

  const ld = breadcrumbJsonLd([
    { name: 'Головна', path: `${prefix}/` },
    { name: 'Каталог', path: `${prefix}/catalog` },
    { name: r.brand.name, path: `${prefix}/brand/${r.brand.slug}` },
    { name: label, path: `${prefix}/brand/${r.brand.slug}/${r.model.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader locale={loc} />
      <CatalogView
        locale={loc}
        category={null}
        scope={{
          kind: 'model',
          brandSlug: r.brand.slug as string,
          brandName: r.brand.name,
          modelSlug: r.model.slug as string,
          modelName: label,
        }}
        search={search}
      />
      <Footer />
    </>
  )
}
