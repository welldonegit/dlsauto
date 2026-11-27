import { describe, expect, it } from 'vitest'

import { availability, IN_STOCK_WHERE, isAvailable } from './availability'

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

describe('IN_STOCK_WHERE — listing filter (Р39 regression)', () => {
  // Regression for "reserved shown as buyable in listings": a reserved part keeps
  // status `in_stock` in the DB (quantity 0, inReserve > 0), so filtering on
  // status alone leaks it into catalog/counters/recommends. The listing filter
  // must ALSO require quantity > 0, matching `availability()` which calls such a
  // part `reserved` (not in_stock).
  it('constrains both status and quantity', () => {
    expect(IN_STOCK_WHERE).toContainEqual({ status: { equals: 'in_stock' } })
    expect(IN_STOCK_WHERE).toContainEqual({ quantity: { greater_than: 0 } })
  })
  it('would exclude a reserved part (quantity 0) that status-only keeps', () => {
    const reserved = { status: 'in_stock' as const, quantity: 0, inReserve: 1 }
    // The runtime twin agrees it is not buyable…
    expect(isAvailable(reserved)).toBe(false)
    expect(availability(reserved)).toBe('reserved')
    // …and the query filter encodes the same quantity > 0 gate (so the two stay
    // in sync — the single source of "shown in listings").
    const qtyGate = IN_STOCK_WHERE.find((c) => 'quantity' in c) as
      { quantity: { greater_than: number } } | undefined
    expect(qtyGate?.quantity.greater_than).toBe(0)
  })
})
