import { NextResponse } from 'next/server'

import { isLocale } from '@/i18n/config'
import { favoritesData } from '@/lib/favorites'

/**
 * Favorites data endpoint (DLSFavorites). The wishlist lives in the browser, so
 * the «Обране» page fetches the card data for its SKUs here (a plain route handler
 * — reliable in dev + prod, unlike a server action which StrictMode can tear the
 * stream out from under). Query: `?skus=a,b,c&car=<modelSlug>&locale=uk`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const skus = (url.searchParams.get('skus') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200)
  const car = url.searchParams.get('car') || null
  const localeParam = url.searchParams.get('locale') ?? 'uk'
  const locale = isLocale(localeParam) ? localeParam : 'uk'

  const data = await favoritesData(skus, car, locale)
  // Personal + cheap to recompute — never cache at the edge/browser.
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } })
}
