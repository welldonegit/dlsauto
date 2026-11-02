import type { Metadata } from 'next'

import type { Locale } from '@/i18n/config'
import { getSiteUrl } from '@/lib/env'
import type { Page } from '@/payload-types'

/**
 * Shared page metadata (DEV_CONTEXT §8, STAGE_3A §4). Title/description come
 * from the page's seo* fields with a fallback template; metadataBase from
 * DOMAIN; canonical + hreflang (uk / ru / x-default) are derived from one
 * locale-less path. uk lives at the bare path, ru under /ru.
 */

const SITE = 'DLSAuto'

/** uk path → ru path. "/" stays "/ru"; "/about" → "/ru/about". */
function ruPath(path: string): string {
  return path === '/' ? '/ru' : `/ru${path}`
}

/**
 * hreflang alternates for a locale-less path. x-default points at uk, per
 * DEV_CONTEXT §8.
 */
function languageAlternates(path: string): Record<string, string> {
  return { uk: path, ru: ruPath(path), 'x-default': path }
}

/** Absolute canonical + hreflang for the given locale and locale-less path. */
export function localeAlternates(
  locale: Locale,
  path: string,
): NonNullable<Metadata['alternates']> {
  return {
    canonical: locale === 'uk' ? path : ruPath(path),
    languages: languageAlternates(path),
  }
}

/** The one metadataBase, from DOMAIN. */
export function metadataBase(): URL {
  return new URL(getSiteUrl())
}

/**
 * Build Metadata for a CMS page. `path` is the locale-less canonical path
 * (e.g. "/about"). Falls back to "{title} — DLSAuto" and a generic description
 * when the page omits seo fields.
 */
export function buildPageMetadata({
  page,
  locale,
  path,
  fallbackDescription,
}: {
  page: Pick<Page, 'title' | 'seoTitle' | 'seoDescription'>
  locale: Locale
  path: string
  fallbackDescription?: string
}): Metadata {
  const title = page.seoTitle?.trim() || `${page.title} — ${SITE}`
  const description =
    page.seoDescription?.trim() ||
    fallbackDescription ||
    'Вживані автозапчастини з власної розбірки DLSAuto — Запоріжжя та Дніпро.'
  return {
    metadataBase: metadataBase(),
    title,
    description,
    alternates: localeAlternates(locale, path),
  }
}

/** schema.org BreadcrumbList for an internal page (DEV_CONTEXT §8). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  const origin = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  }
}
