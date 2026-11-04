import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPage } from '@/lib/data'
import { localeAlternates } from '@/lib/meta'

/**
 * Home page `/` (STAGE_3B). Renders the `home` page's block layout (Головна-B)
 * through BlockRenderer, same as the CMS slug route. The layout order and
 * composition come from the Claude Design export.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return {
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    alternates: localeAlternates(locale, '/'),
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  const page = await getPage('home', loc)
  if (!page) notFound()

  return (
    <>
      <SiteHeader />
      <main style={{ background: 'var(--color-neutral-50)', color: 'var(--color-neutral-900)' }}>
        <BlockRenderer blocks={page.layout} locale={loc} />
      </main>
      <Footer />
    </>
  )
}
