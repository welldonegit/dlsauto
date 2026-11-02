import './load-env'

import { readFileSync } from 'fs'
import path from 'path'

import { XMLParser } from 'fast-xml-parser'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { slugify } from '../src/lib/rules/slug'

/**
 * Prom.ua YML import (DEV_CONTEXT §6). Reads a standard yml_catalog export,
 * maps Prom categories to site categories via scripts/prom-category-map.json,
 * and upserts products as `hidden` drafts flagged `needsTranslation` (Prom text
 * is Russian; the uk value is a placeholder until translated). Pictures are
 * downloaded into media. Idempotent by `promId` — re-running updates, never
 * duplicates.
 *
 * Usage: `pnpm tsx scripts/import-prom.ts [path/to/export.yml]`
 * Default file: scripts/fixtures/prom-sample.yml
 */

type Offer = {
  '@_id': string
  '@_available'?: string
  name?: string
  vendorCode?: string
  categoryId?: string | number
  price?: string | number
  vendor?: string
  description?: string
  picture?: string[]
  param?: { '@_name'?: string; '#text'?: string }[]
}

const EXPORT = path.resolve('docs/design-export')
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

const richText = (t: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: t, version: 1 },
        ],
      },
    ],
  },
})

async function run(): Promise<void> {
  const ymlPath = path.resolve(process.argv[2] ?? 'scripts/fixtures/prom-sample.yml')
  const mapPath = path.resolve('scripts/prom-category-map.json')
  const categoryMap = JSON.parse(readFileSync(mapPath, 'utf8')) as Record<string, string>

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['offer', 'picture', 'param', 'category'].includes(name),
  })
  const doc = parser.parse(readFileSync(ymlPath, 'utf8'))
  const offers: Offer[] = doc?.yml_catalog?.shop?.offers?.offer ?? []

  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[import-prom] ${m}`)

  // Resolve a site category id by slug (cached).
  const catIdBySlug = new Map<string, number>()
  async function categoryId(slug: string): Promise<number | null> {
    if (catIdBySlug.has(slug)) return catIdBySlug.get(slug)!
    const res = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const id = (res.docs[0]?.id as number) ?? null
    if (id) catIdBySlug.set(slug, id)
    return id
  }

  const mediaCache = new Map<string, number>()
  async function uploadPicture(src: string): Promise<number | null> {
    const isRemote = /^https?:/i.test(src)
    const name = path.basename(isRemote ? new URL(src).pathname : src)
    if (mediaCache.has(name)) return mediaCache.get(name)!
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: name } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      mediaCache.set(name, existing.docs[0].id as number)
      return existing.docs[0].id as number
    }
    let buf: Buffer
    try {
      if (isRemote) {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        buf = Buffer.from(await res.arrayBuffer())
      } else {
        buf = readFileSync(path.resolve(EXPORT, src))
      }
    } catch (e) {
      log(`WARN picture failed (${src}): ${(e as Error).message}`)
      return null
    }
    const ext = path.extname(name).toLowerCase()
    const created = await payload.create({
      collection: 'media',
      data: { alt: `Імпорт Prom: ${name}` },
      file: {
        data: buf,
        mimetype: MIME[ext] ?? 'application/octet-stream',
        name,
        size: buf.length,
      },
    })
    mediaCache.set(name, created.id as number)
    return created.id as number
  }

  let imported = 0
  let skipped = 0
  for (const offer of offers) {
    const promId = String(offer['@_id'])
    const slug = categoryMap[String(offer.categoryId)]
    if (!slug || slug.startsWith('_')) {
      log(`WARN skip ${promId}: category ${offer.categoryId} not mapped`)
      skipped += 1
      continue
    }
    const category = await categoryId(slug)
    if (!category) {
      log(`WARN skip ${promId}: category "${slug}" not found in site`)
      skipped += 1
      continue
    }

    const sku = offer.vendorCode ? String(offer.vendorCode) : `PROM-${promId}`
    const name = String(offer.name ?? sku)
    const oem = (offer.param ?? [])
      .filter((p) => (p['@_name'] ?? '').toUpperCase() === 'OEM' && p['#text'])
      .map((p) => ({ number: String(p['#text']) }))
    const photos: number[] = []
    for (const pic of offer.picture ?? []) {
      const id = await uploadPicture(pic)
      if (id) photos.push(id)
    }

    const data: Record<string, unknown> = {
      sku,
      promId,
      // Prom text is Russian → placed in the default (uk) field as a placeholder
      // and flagged for translation (DEV_CONTEXT §6).
      name,
      slug: slugify(`${name}-${sku}`),
      category,
      price: Number(offer.price) || 1,
      description: offer.description ? richText(String(offer.description)) : undefined,
      ...(oem.length ? { oem } : {}),
      ...(photos.length ? { photos } : {}),
      status: 'hidden',
      needsTranslation: true,
    }

    const existing = await payload.find({
      collection: 'products',
      where: { promId: { equals: promId } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      await payload.update({
        collection: 'products',
        id: existing.docs[0].id as number,
        data: data as never,
      })
    } else {
      await payload.create({ collection: 'products', data: data as never })
    }
    imported += 1
  }

  log(`done — imported/updated ${imported}, skipped ${skipped}`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
