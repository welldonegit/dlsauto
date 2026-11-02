import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { LegalPage } from '@/components/blocks/LegalPage'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPage, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildPageMetadata } from '@/lib/meta'
import type { Page } from '@/payload-types'

/**
 * CMS pages addressed by slug (STAGE_3A). Explicit routes (contacts, ui) take
 * precedence; everything else resolves here. A missing or unpublished page —
 * or a multi-segment path we don't serve yet — triggers the real 404
 * (not-found.tsx). Catalog/brand/product (multi-segment) arrive in later stages.
 *
 * A page whose layout is a single richText block renders as a legal page
 * (sticky ToC + rich text); anything else renders through BlockRenderer.
 */

type Params = { locale: string; slug: string[] }

async function resolvePage(locale: string, slug: string[]) {
  if (!isLocale(locale) || slug.length !== 1) return null
  const page = await getPage(slug[0], locale)
  return page ? { page, locale, slug: slug[0] } : null
}

/** A page is "legal" when its whole layout is one richText block. */
function legalContent(page: Page) {
  const layout = page.layout ?? []
  if (layout.length === 1 && layout[0].blockType === 'richText') {
    return layout[0].content
  }
  return null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params
  const resolved = await resolvePage(locale, slug)
  if (!resolved) return {}
  return buildPageMetadata({
    page: resolved.page,
    locale: resolved.locale,
    path: `/${resolved.slug}`,
  })
}

export default async function CmsPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  const resolved = await resolvePage(locale, slug)
  if (!resolved) notFound()

  const { page, locale: loc } = resolved as { page: Page; locale: Locale; slug: string }
  const dict = getDictionary(loc)
  const legal = legalContent(page)

  const crumbJsonLd = breadcrumbJsonLd([
    { name: dict.common.home, path: loc === 'uk' ? '/' : '/ru' },
    { name: page.title, path: loc === 'uk' ? `/${resolved.slug}` : `/ru/${resolved.slug}` },
  ])

  // Оферта shows the ФОП requisites from settings; Політика does not.
  const requisites = resolved.slug === 'oferta' ? (await getSettings(loc)).fop : undefined

  return (
    <>
      <SiteHeader />
      <main style={{ background: 'var(--color-neutral-50)', color: 'var(--color-neutral-900)' }}>
        {legal ? (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbJsonLd) }}
            />
            <LegalPage
              title={page.title}
              content={legal}
              updatedAt={page.updatedAt}
              locale={loc}
              labels={{
                home: dict.common.home,
                contents: dict.legal.contents,
                updated: dict.legal.updated,
                requisites: dict.legal.requisites,
              }}
              requisites={requisites ?? undefined}
            />
          </>
        ) : (
          <BlockRenderer blocks={page.layout} locale={loc} />
        )}
      </main>
      <Footer />
    </>
  )
}
