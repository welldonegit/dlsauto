import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Cache tags and Payload hooks that invalidate them (DEV_CONTEXT §5). The data
 * layer wraps reads in `unstable_cache` keyed by these tags; a write in the
 * admin fires the matching hook → `revalidateTag`. Hooks run both inside Next
 * (admin) and outside it (seed/CLI), so the call is guarded.
 */
export const TAG = {
  settings: 'settings',
  pickupPoints: 'pickup-points',
  brands: 'brands',
  models: 'models',
  categories: 'categories',
  products: 'products',
  pages: 'pages',
  banners: 'banners',
  reviews: 'reviews',
} as const

export const productTag = (slug: string) => `product:${slug}`
export const pageTag = (slug: string) => `page:${slug}`

function safeRevalidate(tag: string): void {
  try {
    // Next 16: the second arg is a cacheLife profile; "max" purges on-demand.
    revalidateTag(tag, 'max')
  } catch {
    // Called outside a request/render scope (seed, migration, worker) — ignore.
  }
}

type Doc = Record<string, unknown> & { slug?: string }

/** afterChange / afterDelete hook invalidating a fixed tag plus per-doc tags. */
export function afterWriteRevalidate(
  base: string,
  perDoc?: (doc: Doc) => string[],
): { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook } {
  const run = (doc: Doc) => {
    safeRevalidate(base)
    perDoc?.(doc).forEach(safeRevalidate)
  }
  return {
    afterChange: ({ doc }) => {
      run(doc as Doc)
      return doc
    },
    afterDelete: ({ doc }) => {
      run(doc as Doc)
      return doc
    },
  }
}

/** Global (settings) afterChange hook. */
export function globalRevalidate(tag: string): GlobalAfterChangeHook {
  return ({ doc }) => {
    safeRevalidate(tag)
    return doc
  }
}
