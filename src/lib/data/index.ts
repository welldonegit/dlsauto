import { unstable_cache } from 'next/cache'

import type { Locale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import type {
  Brand,
  Category,
  Model,
  Page,
  PickupPoint,
  Product,
  Review,
  Setting,
} from '@/payload-types'

import { pageTag, productTag, TAG } from './revalidate'

/**
 * Typed data layer over the Payload Local API (DEV_CONTEXT §5). Reads are cached
 * with `unstable_cache` keyed by collection tags; writes invalidate them through
 * the revalidation hooks in payload.config. Components never call Payload
 * directly — only these functions.
 */

// -------------------------------------------------------------- settings
export const getSettings = unstable_cache(
  async (locale: Locale = 'uk'): Promise<Setting> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'settings', locale, depth: 1 })
  },
  ['settings'],
  { tags: [TAG.settings] },
)

// -------------------------------------------------------------- pickup points
export const getPickupPoints = unstable_cache(
  async (locale: Locale = 'uk'): Promise<PickupPoint[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'pickup-points',
      locale,
      limit: 100,
      sort: 'createdAt',
      depth: 0,
    })
    return res.docs
  },
  ['pickup-points'],
  { tags: [TAG.pickupPoints] },
)

// -------------------------------------------------------------- brands
export const getBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'brands',
      where: { published: { equals: true } },
      limit: 100,
      depth: 1,
    })
    return res.docs
  },
  ['brands'],
  { tags: [TAG.brands] },
)

/** Count of in-stock products, used for the "N деталей" labels. */
async function countInStock(field: 'model' | 'category', id: number): Promise<number> {
  const payload = await getPayloadClient()
  const res = await payload.count({
    collection: 'products',
    where: { and: [{ [field]: { equals: id } }, { status: { equals: 'in_stock' } }] },
  })
  return res.totalDocs
}

export type ModelWithCount = Model & { partsCount: number }

export const getModelsByBrand = unstable_cache(
  async (brandSlug: string, locale: Locale = 'uk'): Promise<ModelWithCount[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'models',
      locale,
      where: { and: [{ 'brand.slug': { equals: brandSlug } }, { published: { equals: true } }] },
      limit: 100,
      depth: 1,
    })
    return Promise.all(
      res.docs.map(async (m) => ({ ...m, partsCount: await countInStock('model', m.id) })),
    )
  },
  ['models-by-brand'],
  { tags: [TAG.models, TAG.products] },
)

// -------------------------------------------------------------- categories
export type CategoryWithCount = Category & { partsCount: number }

export const getCategoryTree = unstable_cache(
  async (locale: Locale = 'uk'): Promise<CategoryWithCount[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'categories',
      locale,
      where: { published: { equals: true } },
      limit: 100,
      depth: 1,
    })
    return Promise.all(
      res.docs.map(async (c) => ({ ...c, partsCount: await countInStock('category', c.id) })),
    )
  },
  ['categories'],
  { tags: [TAG.categories, TAG.products] },
)

// -------------------------------------------------------------- products
export const getProduct = unstable_cache(
  async (slug: string, locale: Locale = 'uk'): Promise<Product | null> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'products',
      locale,
      where: { and: [{ slug: { equals: slug } }, { status: { not_equals: 'hidden' } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ?? null
  },
  ['product'],
  { tags: [TAG.products] },
)

export const getProductsByModel = unstable_cache(
  async (modelSlug: string, locale: Locale = 'uk', limit = 24): Promise<Product[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'products',
      locale,
      where: {
        and: [{ 'model.slug': { equals: modelSlug } }, { status: { equals: 'in_stock' } }],
      },
      limit,
      depth: 1,
    })
    return res.docs
  },
  ['products-by-model'],
  { tags: [TAG.products] },
)

// -------------------------------------------------------------- pages
export const getPage = unstable_cache(
  async (slug: string, locale: Locale = 'uk'): Promise<Page | null> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'pages',
      locale,
      where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ?? null
  },
  ['page'],
  { tags: [TAG.pages] },
)

// -------------------------------------------------------------- reviews
export type ReviewsResult = { reviews: Review[]; average: number; count: number }

/** Published reviews (newest first) plus the average rating over all published. */
export const getReviews = unstable_cache(
  async (limit = 8): Promise<ReviewsResult> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'reviews',
      where: { published: { equals: true } },
      sort: '-createdAt',
      limit,
      depth: 0,
    })
    // Average over all published reviews, not just the shown page.
    const all =
      res.totalDocs <= res.docs.length
        ? res.docs
        : (
            await payload.find({
              collection: 'reviews',
              where: { published: { equals: true } },
              limit: 1000,
              depth: 0,
            })
          ).docs
    const count = all.length
    const average = count ? all.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0
    return { reviews: res.docs, average, count }
  },
  ['reviews'],
  { tags: [TAG.reviews] },
)

// Re-export tag helpers for callers that need targeted revalidation.
export { TAG, productTag, pageTag }
