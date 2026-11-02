import { describe, expect, it } from 'vitest'

import { normalizeOem, normalizeOemList } from './oem'

describe('normalizeOem', () => {
  it('lower-cases and strips spaces, hyphens, dots', () => {
    expect(normalizeOem('MR-554 321.A')).toBe('mr554321a')
    expect(normalizeOem('  1K0 199 555  ')).toBe('1k0199555')
  })
})

describe('normalizeOemList', () => {
  it('drops blanks and duplicates, preserves order', () => {
    expect(normalizeOemList(['MR 554321', 'mr-554321', '', '1K0-199'])).toEqual([
      'mr554321',
      '1k0199',
    ])
  })
})
