import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, localeCookie } from '@/i18n/config'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isRu = pathname === '/ru' || pathname.startsWith('/ru/')
  const locale = isRu ? 'ru' : defaultLocale

  let response: NextResponse
  if (locale === defaultLocale) {
    // uk has no URL prefix → rewrite onto the internal /[locale] segment.
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
    response = NextResponse.rewrite(url)
  } else {
    // /ru/... already maps onto the [locale] segment.
    response = NextResponse.next()
  }

  // Remember the current language. No automatic redirect by Accept-Language.
  response.cookies.set(localeCookie, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return response
}

export const config = {
  // Page routes only — skip API, admin, Next internals and files with extensions.
  matcher: [
    '/((?!api|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
