export const locales = ['uk', 'ru'] as const

export type Locale = (typeof locales)[number]

/** Ukrainian is the default and has no URL prefix; Russian lives under /ru. */
export const defaultLocale: Locale = 'uk'

/** Cookie that remembers the chosen language (no Accept-Language auto-redirect). */
export const localeCookie = 'NEXT_LOCALE'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'uk' || value === 'ru'
}
