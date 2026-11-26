import { NextResponse } from 'next/server'

import { isLocale } from '@/i18n/config'
import { compareData } from '@/lib/compareData'

/**
 * Compare data endpoint (DLSCompare). Compare lives in the browser, so the
 * «Порівняння» page fetches the column data for its SKUs here (a plain route
 * handler — reliable in dev + prod, unlike a server action under StrictMode).
 * Query: `?skus=a,b,c&locale=uk`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const skus = (url.searchParams.get('skus') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50)
  const localeParam = url.searchParams.get('locale') ?? 'uk'
  const locale = isLocale(localeParam) ? localeParam : 'uk'

  const data = await compareData(skus, locale)
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } })
}
