import { describe, expect, it } from 'vitest'

import { isLocale } from '@/i18n/config'

import { getBuildSha, getSiteUrl } from './env'

describe('smoke: env helpers', () => {
  it('getBuildSha returns a non-empty string', () => {
    expect(getBuildSha().length).toBeGreaterThan(0)
  })

  it('getSiteUrl returns a parseable URL', () => {
    expect(() => new URL(getSiteUrl())).not.toThrow()
  })
})

describe('smoke: i18n', () => {
  it('recognizes supported locales only', () => {
    expect(isLocale('uk')).toBe(true)
    expect(isLocale('ru')).toBe(true)
    expect(isLocale('en')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})
