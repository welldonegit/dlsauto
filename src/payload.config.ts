import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users],
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
