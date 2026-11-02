import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrStaff } from '../access'
import { pageBlocks } from '../blocks'
import { publishedField, seoFields, slugField } from '../fields'

/**
 * Pages (DEV_CONTEXT §4): block-composed content for the homepage, about,
 * contacts, offer, policy and 404. Each block is optional and drag-and-drop
 * ordered; an empty block is not rendered. Localized: title, block text, seo*.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Сторінка', plural: 'Сторінки' },
  access: { read: publishedOrStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'published'],
    group: 'Контент',
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: 'Назва сторінки' },
    slugField('title'),
    {
      name: 'layout',
      type: 'blocks',
      label: 'Блоки',
      blocks: pageBlocks,
      admin: { description: 'Перетягуванням змінюйте порядок. Порожній блок не показується.' },
    },
    seoFields(),
    publishedField,
  ],
}
