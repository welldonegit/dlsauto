import { beforeEach, describe, expect, it, vi } from 'vitest'

// unstable_cache(fn) → fn (passthrough), so the cached reader runs directly.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidateTag: vi.fn(),
}))

const find = vi.fn()
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find }) }))

import { getModelsGroupedByBrand } from './index'

/**
 * Order regression (ADR 007). `sortOrder` was removed from the model; brands and
 * models order comes from the `orderable` collection's `_order` (= seed order,
 * which encodes the client's documents). `getModelsGroupedByBrand` used to sort
 * by the non-existent `sortOrder`, which Payload silently ignored → arbitrary
 * order on the home picker and mega-menu. These lock in `_order` + stable
 * grouping.
 */
describe('getModelsGroupedByBrand — order (ADR 007)', () => {
  beforeEach(() => find.mockReset())

  it('queries models by collection _order, never the dropped sortOrder', async () => {
    find.mockResolvedValue({ docs: [] })
    await getModelsGroupedByBrand('uk')
    expect(find).toHaveBeenCalledTimes(1)
    const args = find.mock.calls[0][0]
    expect(args.collection).toBe('models')
    expect(args.sort).toBe('_order')
    expect(args.sort).not.toBe('sortOrder')
  })

  it('groups by brand preserving the queried order', async () => {
    // Order as the DB returns it (by _order) — must survive into the grouping.
    find.mockResolvedValue({
      docs: [
        { slug: 'l200', name: 'L200', brand: { slug: 'mitsubishi' } },
        { slug: 'pajero-sport', name: 'Pajero Sport', brand: { slug: 'mitsubishi' } },
        { slug: 'navara', name: 'Navara', brand: { slug: 'nissan' } },
        { slug: 'ranger', name: 'Ranger', brand: { slug: 'ford' } },
      ],
    })
    const out = await getModelsGroupedByBrand('uk')
    // Brand keys appear in first-seen (= _order) order.
    expect(Object.keys(out)).toEqual(['mitsubishi', 'nissan', 'ford'])
    // Models within a brand keep their _order.
    expect(out.mitsubishi.map((m) => m.slug)).toEqual(['l200', 'pajero-sport'])
    expect(out.nissan.map((m) => m.slug)).toEqual(['navara'])
    expect(out.ford.map((m) => m.slug)).toEqual(['ranger'])
  })

  it('skips docs without a brand slug or model slug', async () => {
    find.mockResolvedValue({
      docs: [
        { slug: 'l200', name: 'L200', brand: { slug: 'mitsubishi' } },
        { slug: 'no-brand', name: 'Orphan', brand: null },
        { slug: null, name: 'No slug', brand: { slug: 'nissan' } },
      ],
    })
    const out = await getModelsGroupedByBrand('uk')
    expect(Object.keys(out)).toEqual(['mitsubishi'])
  })
})
