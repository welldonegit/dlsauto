import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale } from '@/i18n/config'
import { getPage } from '@/lib/data'
import { buildPageMetadata } from '@/lib/meta'

/**
 * CMS pages addressed by slug (STAGE_3A). Explicit routes (contacts, ui) take
 * precedence; everything else resolves here. A missing or unpublished page —
 * or a multi-segment path we don't serve yet — triggers the real 404
 * (not-found.tsx). Catalog/brand/product (multi-segment) arrive in later stages.
 */

type Params = { locale: string; slug: string[] }

async function resolvePage(locale: string, slug: string[]) {
  if (!isLocale(locale) || slug.length !== 1) return null
  const page = await getPage(slug[0], locale)
  return page ? { page, locale } : null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params
  const resolved = await resolvePage(locale, slug)
  if (!resolved) return {}
  return buildPageMetadata({
    page: resolved.page,
    locale: resolved.locale,
    path: `/${slug[0]}`,
  })
}

export default async function CmsPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  const resolved = await resolvePage(locale, slug)
  if (!resolved) notFound()

  return (
    <>
      <SiteHeader />
      <main style={{ background: 'var(--color-neutral-50)', color: 'var(--color-neutral-900)' }}>
        <BlockRenderer blocks={resolved.page.layout} locale={resolved.locale} />
      </main>
      <Footer />
    </>
  )
}
