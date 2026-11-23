import { describe, expect, it } from 'vitest'

import { availability, isAvailable } from './availability'

describe('availability (Р39)', () => {
  it('in stock when quantity > 0', () => {
    expect(availability({ status: 'in_stock', quantity: 1, inReserve: 0 })).toBe('in_stock')
    expect(availability({ status: 'in_stock', quantity: 3, inReserve: 1 })).toBe('in_stock')
  })
  it('reserved when available 0 and in_reserve > 0', () => {
    expect(availability({ status: 'in_stock', quantity: 0, inReserve: 1 })).toBe('reserved')
  })
  it('sold when available 0 and no reserve', () => {
    expect(availability({ status: 'in_stock', quantity: 0, inReserve: 0 })).toBe('sold')
  })
  it('manual sold / hidden override the numbers', () => {
    expect(availability({ status: 'sold', quantity: 5, inReserve: 0 })).toBe('sold')
    expect(availability({ status: 'hidden', quantity: 5, inReserve: 0 })).toBe('hidden')
  })
  it('isAvailable only for in_stock', () => {
    expect(isAvailable({ status: 'in_stock', quantity: 1 })).toBe(true)
    expect(isAvailable({ status: 'in_stock', quantity: 0, inReserve: 2 })).toBe(false)
    expect(isAvailable({ status: 'sold', quantity: 1 })).toBe(false)
  })
})
