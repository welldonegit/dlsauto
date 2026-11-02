import { headers } from 'next/headers'

import { NotFound404 } from '@/components/blocks/NotFound404'
import { Footer } from '@/components/layout/Footer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

/**
 * Real 404 (STAGE_3A §1). Next renders this with an HTTP 404 status for any
 * unmatched route under a locale and for notFound() thrown in locale pages.
 * The locale comes from the x-dls-locale header set by middleware (not-found
 * receives no params), so /ru gets its own text. noindex is emitted via the
 * hoisted <meta> (metadata export is unavailable in not-found).
 */
export default async function NotFoundPage() {
  const header = (await headers()).get('x-dls-locale')
  const locale = isLocale(header) ? header : 'uk'
  const dict = getDictionary(locale)
  const t = dict.notFound

  return (
    <>
      {/* Title comes from the layout's title.default (locale-aware); not-found
          cannot set metadata. noindex is a plain meta Next passes through. */}
      <meta name="robots" content="noindex" />
      <SiteHeader />
      <main style={{ background: 'var(--color-neutral-50)', color: 'var(--color-neutral-900)' }}>
        <NotFound404 text={t} locale={locale} />
      </main>
      <Footer />
    </>
  )
}
