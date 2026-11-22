import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPage, getSettings } from '@/lib/data'
import { buildPageMetadata, faqPageJsonLd, organizationJsonLd } from '@/lib/meta'

/**
 * Home page `/` (STAGE_3B). Renders the `home` page's block layout (Головна-B)
 * through BlockRenderer, same as the CMS slug route. Title/description come from
 * the page's seo* fields (Payload, per locale) with canonical + hreflang; the
 * page also emits Organization + FAQPage JSON-LD (DEV_CONTEXT §8).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage('home', locale)
  if (!page) return {}
  const dict = getDictionary(locale)
  return buildPageMetadata({
    page,
    locale,
    path: '/',
    fallbackDescription: dict.meta.homeDescription,
  })
}

type FaqItem = { question?: string | null; answer?: string | null }

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  const [page, settings] = await Promise.all([getPage('home', loc), getSettings(loc)])
  if (!page) notFound()

  // FAQPage from the home FAQ block; Organization from settings.
  const faqBlock = (page.layout ?? []).find((b) => b.blockType === 'faq') as
    { items?: FaqItem[] | null } | undefined
  const faqLd = faqBlock?.items?.length ? faqPageJsonLd(faqBlock.items) : null
  const orgLd = organizationJsonLd({
    phone: settings.phones?.[0]?.number,
    email: settings.email,
    sameAs: [
      settings.messengers?.telegram,
      settings.socials?.telegram,
      settings.socials?.instagram,
      settings.socials?.facebook,
      settings.socials?.tiktok,
    ],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
      <SiteHeader locale={loc} />
      <main style={{ background: 'var(--color-neutral-50)', color: 'var(--color-neutral-900)' }}>
        <BlockRenderer blocks={page.layout} locale={loc} />
      </main>
      <Footer />
    </>
  )
}
