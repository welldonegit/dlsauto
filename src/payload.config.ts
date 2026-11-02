import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, type CollectionConfig } from 'payload'
import sharp from 'sharp'

import {
  afterWriteRevalidate,
  globalRevalidate,
  pageTag,
  productTag,
  TAG,
} from './lib/data/revalidate'

import { Banners } from './payload/collections/Banners'
import { Brands } from './payload/collections/Brands'
import { Categories } from './payload/collections/Categories'
import { Leads } from './payload/collections/Leads'
import { Media } from './payload/collections/Media'
import { Models } from './payload/collections/Models'
import { Orders } from './payload/collections/Orders'
import { Pages } from './payload/collections/Pages'
import { PickupPoints } from './payload/collections/PickupPoints'
import { Products } from './payload/collections/Products'
import { Reviews } from './payload/collections/Reviews'
import { Users } from './payload/collections/Users'
import { Settings } from './payload/globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Append cache-revalidation hooks without clobbering a collection's own hooks. */
function withRevalidate(
  col: CollectionConfig,
  base: string,
  perDoc?: (doc: Record<string, unknown> & { slug?: string }) => string[],
): CollectionConfig {
  const { afterChange, afterDelete } = afterWriteRevalidate(base, perDoc)
  return {
    ...col,
    hooks: {
      ...col.hooks,
      afterChange: [...(col.hooks?.afterChange ?? []), afterChange],
      afterDelete: [...(col.hooks?.afterDelete ?? []), afterDelete],
    },
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ['/payload/components/BeforeDashboard#default'],
    },
  },
  collections: [
    withRevalidate(Brands, TAG.brands),
    withRevalidate(Models, TAG.models),
    withRevalidate(Categories, TAG.categories),
    withRevalidate(Products, TAG.products, (doc) => (doc.slug ? [productTag(doc.slug)] : [])),
    withRevalidate(PickupPoints, TAG.pickupPoints),
    Media,
    withRevalidate(Pages, TAG.pages, (doc) => (doc.slug ? [pageTag(doc.slug)] : [])),
    withRevalidate(Banners, TAG.banners),
    withRevalidate(Reviews, TAG.reviews),
    Orders,
    Leads,
    Users,
  ],
  globals: [
    {
      ...Settings,
      hooks: {
        ...Settings.hooks,
        afterChange: [...(Settings.hooks?.afterChange ?? []), globalRevalidate(TAG.settings)],
      },
    },
  ],
  // Content localization — fields are localized starting in stage 2.
  localization: {
    locales: [
      { label: 'Українська', code: 'uk' },
      { label: 'Русский', code: 'ru' },
    ],
    defaultLocale: 'uk',
    fallback: true,
  },
  // Admin UI language — Ukrainian, per DEV_CONTEXT §5.
  i18n: {
    fallbackLanguage: 'uk',
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Create the first admin from env on an empty database. Idempotent: only
  // runs when no users exist yet, so repeated boots are safe.
  onInit: async (payload) => {
    const email = process.env.PAYLOAD_ADMIN_EMAIL
    const password = process.env.PAYLOAD_ADMIN_PASSWORD
    if (!email || !password) return

    const existing = await payload.find({ collection: 'users', limit: 1, depth: 0 })
    if (existing.totalDocs > 0) return

    await payload.create({
      collection: 'users',
      data: { email, password, role: 'admin', name: 'Administrator' },
    })
    payload.logger.info(`Created first admin user from env: ${email}`)
  },
  plugins: [],
})
