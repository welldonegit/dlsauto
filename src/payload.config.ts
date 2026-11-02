import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

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

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Brands,
    Models,
    Categories,
    Products,
    PickupPoints,
    Media,
    Pages,
    Banners,
    Reviews,
    Orders,
    Leads,
    Users,
  ],
  globals: [Settings],
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
