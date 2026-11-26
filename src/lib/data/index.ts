import { unstable_cache } from 'next/cache'

import type { Locale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { modelDisplayName, modelYears, partsLabel } from '@/lib/rules'
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

/** All models grouped by brand slug (slug + name only) — for catalog filter options. */
export const getModelsGroupedByBrand = unstable_cache(
  async (locale: Locale = 'uk'): Promise<Record<string, { slug: string; name: string }[]>> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'models',
      locale,
      where: { published: { equals: true } },
      limit: 500,
      depth: 1, // brand → slug
      sort: 'sortOrder',
    })
    const out: Record<string, { slug: string; name: string }[]> = {}
    for (const m of res.docs) {
      const brand = m.brand && typeof m.brand === 'object' ? m.brand : null
      const bslug = brand?.slug
      if (!bslug || !m.slug) continue
      ;(out[bslug] ??= []).push({ slug: m.slug, name: m.name })
    }
    return out
  },
  ['models-grouped'],
  { tags: [TAG.models] },
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
      sort: '_order', // orderable collection → insertion order = client's Р51 site order (seed)
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

/** A single product by SKU (the stable key in /product/<slug>-<sku>), depth 2 for the
 * full page (model→brand, category, partType+relatedTypes, donor→model, photos, pickup).
 * Sold/reserved products still resolve (status 200, Р39); hidden ones do not. */
export const getProductBySku = unstable_cache(
  async (sku: string, locale: Locale = 'uk'): Promise<Product | null> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'products',
      locale,
      where: { and: [{ sku: { equals: sku } }, { status: { not_equals: 'hidden' } }] },
      limit: 1,
      depth: 2,
    })
    return res.docs[0] ?? null
  },
  ['product-by-sku'],
  { tags: [TAG.products] },
)

/** In-stock pool for the on-the-fly recommendations (DEV_CONTEXT §5, Р25). depth 1
 * populates partType (broad), model, category, donor, alsoFits as objects; reserved and
 * sold are excluded (never recommended, Р39). The matching functions run over this pool. */
export const getRecoPool = unstable_cache(
  async (locale: Locale = 'uk'): Promise<Product[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'products',
      locale,
      where: { status: { equals: 'in_stock' } },
      limit: 2000,
      depth: 1,
    })
    return res.docs
  },
  ['reco-pool'],
  { tags: [TAG.products] },
)

/**
 * "Нові надходження" source (DEV_CONTEXT §5, Р9). In-stock only (no sold/reserved).
 * Ordering (owner 25.11): pinned-new first, then parts with a `receivedAt`
 * (newest arrivals first), then the rest backfilled newest-by-`createdAt` — up to
 * `limit`. The category tabs filter this ordered list, so each tab keeps the same
 * ordering within its category.
 */
export const getNewestProducts = unstable_cache(
  async (locale: Locale = 'uk', limit = 15): Promise<Product[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'products',
      locale,
      where: { status: { equals: 'in_stock' } },
      sort: '-createdAt', // base order = newest created (tier 3 keeps this, sort is stable)
      limit: 100, // a pool to rank; sliced to `limit` after ordering
      depth: 2, // model → brand, category, photos, pickup point
    })
    const tier = (p: Product) => (p.pinnedNew ? 0 : p.receivedAt ? 1 : 2)
    const ms = (d: string | null | undefined) => (d ? Date.parse(d) : 0)
    const ordered = [...res.docs].sort((a, b) => {
      const ta = tier(a)
      const tb = tier(b)
      if (ta !== tb) return ta - tb
      if (ta === 2) return 0 // keep the query's -createdAt order
      const ra = ms(a.receivedAt)
      const rb = ms(b.receivedAt)
      if (ra !== rb) return rb - ra // newest arrival first
      return ms(b.createdAt) - ms(a.createdAt)
    })
    return ordered.slice(0, limit)
  },
  ['newest-products'],
  { tags: [TAG.products] },
)

export type VehicleModelGroup = { model: Model; products: Product[] }

/**
 * Models of a body type (pickup / suv) that have in-stock parts, each with its
 * products — the source for the "Запчастини на пікапи / позашляховики" tabs
 * (DEV_CONTEXT §5). Models with no in-stock parts are omitted.
 */
export const getVehicleModels = unstable_cache(
  async (
    bodyType: 'pickup' | 'suv',
    locale: Locale = 'uk',
    perModel = 24,
  ): Promise<VehicleModelGroup[]> => {
    const payload = await getPayloadClient()
    const models = await payload.find({
      collection: 'models',
      locale,
      where: { and: [{ bodyType: { equals: bodyType } }, { published: { equals: true } }] },
      limit: 100,
      depth: 2, // model.brand populated
    })
    const groups = await Promise.all(
      models.docs.map(async (model) => {
        const prods = await payload.find({
          collection: 'products',
          locale,
          where: { and: [{ model: { equals: model.id } }, { status: { equals: 'in_stock' } }] },
          sort: '-createdAt',
          limit: perModel,
          depth: 2,
        })
        return { model, products: prods.docs }
      }),
    )
    return groups.filter((g) => g.products.length > 0)
  },
  ['vehicle-models'],
  { tags: [TAG.models, TAG.products] },
)

// -------------------------------------------------------------- catalog
export type CatalogSort = 'pop' | 'new' | 'cheap' | 'exp'
export type CatalogParams = {
  categories?: string[] // category slugs (path category + checkbox selection)
  brand?: string
  model?: string
  body?: 'pickup' | 'suv' | 'passenger' // vehicle body type (home «на пікапи/позашляховики»)
  priceFrom?: number
  priceTo?: number
  warranty?: number[] // 14 / 30 / 60
  sides?: ('left' | 'right')[]
  conditions?: string[] // conditionLabel values
  promo?: boolean
  video?: boolean // "З відео перевірки" — a video among the product photos
  sort?: CatalogSort
  limit?: number // = shown (page * PAGE)
  locale?: Locale
}
export type CatalogFacet = { slug: string; name: string; count: number }
export type CatalogResult = {
  products: Product[]
  total: number
  categoryFacets: CatalogFacet[]
  /** Any product in the base set has an inspection video → show the «З відео перевірки» facet. */
  hasVideo: boolean
}

const SORT_MAP: Record<CatalogSort, string> = {
  pop: '-createdAt', // no salesCount yet (stage 6/7) → newest as the default order
  new: '-receivedAt',
  cheap: 'price',
  exp: '-price',
}

const SIDE_POSITIONS: Record<'left' | 'right', string[]> = {
  left: ['front-left', 'rear-left', 'left'],
  right: ['front-right', 'rear-right', 'right'],
}

/** True when any photo is a video (mp4) — the "З відео перевірки" signal (no stored field). */
function hasVideoPhoto(
  photos: (number | { mimeType?: string | null } | null)[] | null | undefined,
): boolean {
  return (photos ?? []).some(
    (ph) => ph != null && typeof ph === 'object' && !!ph.mimeType?.startsWith('video/'),
  )
}

/** Build the product `where` (minus the category filter, which is layered on for facets). */
function catalogWhere(p: CatalogParams): Record<string, unknown>[] {
  const and: Record<string, unknown>[] = [{ status: { equals: 'in_stock' } }]
  if (p.model) {
    and.push({
      or: [{ 'model.slug': { equals: p.model } }, { 'alsoFits.slug': { equals: p.model } }],
    })
  } else if (p.brand) {
    and.push({ 'model.brand.slug': { equals: p.brand } })
  }
  if (p.body) and.push({ 'model.bodyType': { equals: p.body } })
  if (p.priceFrom != null) and.push({ price: { greater_than_equal: p.priceFrom } })
  if (p.priceTo != null) and.push({ price: { less_than_equal: p.priceTo } })
  if (p.warranty?.length) and.push({ warrantyDays: { in: p.warranty } })
  if (p.sides?.length) {
    and.push({ position: { in: p.sides.flatMap((s) => SIDE_POSITIONS[s]) } })
  }
  if (p.conditions?.length) and.push({ conditionLabel: { in: p.conditions } })
  if (p.promo) and.push({ discountPercent: { greater_than: 0 } })
  return and
}

export const getCatalog = unstable_cache(
  async (p: CatalogParams): Promise<CatalogResult> => {
    const payload = await getPayloadClient()
    const locale = p.locale ?? 'uk'
    const baseAnd = catalogWhere(p)
    const limit = p.limit ?? 20

    // One pass over the base-filtered set (no category filter) gives the category
    // facet counts in memory — far cheaper than a count query per category — and
    // the set of products that carry an inspection video. Video lives as an mp4
    // among `photos` (no queryable field, Р14), so it is detected here from the
    // populated media mimeType rather than in SQL.
    const baseList = await payload.find({
      collection: 'products',
      where: { and: baseAnd } as never,
      depth: 1, // populate photos → media.mimeType for video detection
      limit: 5000,
      select: { category: true, photos: true } as never,
    })
    const facetMap = new Map<number, number>()
    const videoIds: number[] = []
    for (const d of baseList.docs as {
      id: number
      category?: number | { id: number } | null
      photos?: (number | { mimeType?: string | null } | null)[] | null
    }[]) {
      const c = typeof d.category === 'object' ? d.category?.id : d.category
      if (c != null) facetMap.set(c, (facetMap.get(c) ?? 0) + 1)
      if (hasVideoPhoto(d.photos)) videoIds.push(d.id)
    }
    const hasVideo = videoIds.length > 0
    const cats = await payload.find({
      collection: 'categories',
      locale,
      where: { published: { equals: true } },
      depth: 0,
      limit: 100,
      sort: '_order', // orderable collection → insertion order = client's Р51 site order (rail)
    })
    const categoryFacets = cats.docs.map((c) => ({
      slug: c.slug as string,
      name: c.name,
      count: facetMap.get(c.id as number) ?? 0,
    }))

    // The page itself (category + video filters layered on the base), depth 1 for
    // rendering. The video filter restricts to the ids found to carry a video.
    const listAnd: Record<string, unknown>[] = [...baseAnd]
    if (p.categories?.length) listAnd.push({ 'category.slug': { in: p.categories } })
    if (p.video) listAnd.push({ id: { in: videoIds } })
    const res = await payload.find({
      collection: 'products',
      locale,
      where: { and: listAnd } as never,
      sort: SORT_MAP[p.sort ?? 'pop'],
      limit,
      depth: 1, // model/category/photos/pickup/alsoFits as objects; brand id via a map
    })

    return { products: res.docs, total: res.totalDocs, categoryFacets, hasVideo }
  },
  ['catalog'],
  { tags: [TAG.products, TAG.categories] },
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
      depth: 1, // populate photo for the review thumbnails
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

// -------------------------------------------------------------- mega-menu
export type MegaMenuModel = { slug: string; name: string; line: string; href: string }
export type MegaMenuPopular = {
  id: string
  name: string
  donor: string
  price: string
  photo: string | null
  href: string
}
export type MegaMenuBrand = {
  slug: string
  name: string
  logo: string | null
  href: string
  total: number
  models: MegaMenuModel[]
  /** Filled only for brands with fewer than 3 models (the export's "Популярне у" filler). */
  popular: MegaMenuPopular[]
}
export type MegaMenuCategory = { slug: string; name: string; count: number; href: string }
export type MegaMenuData = { brands: MegaMenuBrand[]; categories: MegaMenuCategory[] }

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function cardPhoto(photos: Product['photos']): string | null {
  for (const p of photos ?? []) {
    if (p && typeof p === 'object' && !p.mimeType?.startsWith('video/')) {
      return p.sizes?.card?.url ?? p.url ?? null
    }
  }
  return null
}

/** Donor label for a model ("Ranger 2006–2012"), no twin/generation. */
function modelDonor(model: Model): string {
  const years = modelYears(model)
  return years ? `${model.name} ${years}` : model.name
}

/**
 * Everything the catalog mega-menu (DLSMegaMenu3) needs: all brands with their
 * models (so the panel can switch brand client-side), category rows, and — for
 * brands with fewer than 3 models — a few of that brand's newest in-stock parts
 * to fill the panel's "Популярне у …" slot (the export fills it with demo parts;
 * we use real ones). Hrefs are real §8 URLs; catalog pages land in 3c.
 */
export const getMegaMenu = unstable_cache(
  async (locale: Locale = 'uk'): Promise<MegaMenuData> => {
    const payload = await getPayloadClient()
    const prefix = locale === 'uk' ? '' : '/ru'
    const brandsRaw = await getBrands()

    const brands: MegaMenuBrand[] = await Promise.all(
      brandsRaw.map(async (b) => {
        const slug = b.slug ?? ''
        const modelsFull = slug ? await getModelsByBrand(slug, locale) : []
        const models: MegaMenuModel[] = modelsFull
          .filter((m) => m.slug)
          .map((m) => {
            const years = modelYears(m)
            return {
              slug: m.slug as string,
              name: modelDisplayName(m),
              line: years ? `${years} — ${partsLabel(m.partsCount)}` : partsLabel(m.partsCount),
              href: `${prefix}/brand/${slug}/${m.slug as string}`,
            }
          })
        const total = modelsFull.reduce((s, m) => s + m.partsCount, 0)

        // Fill the "Популярне у {brand}" slot only when the model column is short.
        let popular: MegaMenuPopular[] = []
        if (models.length < 3) {
          const res = await payload.find({
            collection: 'products',
            locale,
            where: {
              and: [{ 'model.brand.slug': { equals: slug } }, { status: { equals: 'in_stock' } }],
            },
            sort: '-createdAt',
            limit: 3,
            depth: 2,
          })
          popular = res.docs.map((p) => {
            const model = p.model && typeof p.model === 'object' ? p.model : null
            return {
              id: p.sku,
              name: p.name,
              donor: model ? modelDonor(model) : '',
              price: `${groupThousands(p.price)} ₴`,
              photo: cardPhoto(p.photos),
              href: `${prefix}/product/${p.slug ?? p.id}-${p.sku}`,
            }
          })
        }

        const logo =
          b.logoColor && typeof b.logoColor === 'object' ? (b.logoColor.url ?? null) : null
        return {
          slug,
          name: b.name,
          logo,
          href: `${prefix}/brand/${slug}`,
          total,
          models,
          popular,
        }
      }),
    )

    // Only brands with catalog content (a brand with no models has nothing to
    // show and would open an empty column); busiest first, as the export orders.
    const withModels = brands.filter((b) => b.models.length > 0)
    withModels.sort((a, b) => b.total - a.total)

    const cats = await getCategoryTree(locale)
    const categories: MegaMenuCategory[] = cats
      .filter((c) => c.slug)
      .map((c) => ({
        slug: c.slug as string,
        name: c.name,
        count: c.partsCount,
        href: `${prefix}/catalog/${c.slug as string}`,
      }))
      // Export shows categories busiest-first.
      .sort((a, b) => b.count - a.count)

    return { brands: withModels, categories }
  },
  ['mega-menu'],
  { tags: [TAG.brands, TAG.models, TAG.categories, TAG.products] },
)

// Re-export tag helpers for callers that need targeted revalidation.
export { TAG, productTag, pageTag }
