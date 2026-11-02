import { describe, expect, it } from 'vitest'

import { isNew } from './isNew'

const now = new Date('2026-02-01T12:00:00Z')

describe('isNew', () => {
  it('true within 30 days', () => {
    expect(isNew(new Date('2026-01-20T00:00:00Z'), now)).toBe(true)
  })
  it('false past 30 days', () => {
    expect(isNew(new Date('2025-12-01T00:00:00Z'), now)).toBe(false)
  })
  it('pinned overrides age', () => {
    expect(isNew(new Date('2024-01-01T00:00:00Z'), now, true)).toBe(true)
  })
  it('accepts ISO strings', () => {
    expect(isNew('2026-01-28T00:00:00Z', now)).toBe(true)
  })
})
