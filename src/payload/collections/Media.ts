import path from 'path'

import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrManager } from '../access'

/**
 * Media (DEV_CONTEXT §4): sharp variants thumb 400 / card 800 / gallery 1600 as
 * WebP, plus the original. Focal point enabled; alt is required and localized.
 * Accepts images and mp4 (product video). Files live under /data/media on the
 * server (compose volume), ./data/media locally — both gitignored.
 */
const staticDir = process.env.MEDIA_DIR || path.resolve(process.cwd(), 'data/media')

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медіафайл', plural: 'Медіа' },
  access: {
    read: anyone,
    create: isAdminOrManager,
    update: isAdminOrManager,
    delete: isAdminOrManager,
  },
  admin: { group: 'Система' },
  upload: {
    staticDir,
    mimeTypes: ['image/*', 'video/mp4'],
    focalPoint: true,
    // Thumbnail is square for list previews; card/gallery keep aspect ratio.
    imageSizes: [
      {
        name: 'thumb',
        width: 400,
        height: 400,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 78 } },
      },
      {
        name: 'card',
        width: 800,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'gallery',
        width: 1600,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      label: 'Alt-текст',
      admin: { description: 'Опис зображення для доступності та SEO. Обовʼязково.' },
    },
  ],
}
