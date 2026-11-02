import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrStaff } from '../access'
import { slugField } from '../fields'

/**
 * Brands (DEV_CONTEXT §4): name, slug, logo (mono + colour), order, published.
 * No localized fields — brand names are the same in both languages. Logos are
 * monochrome everywhere except the colour tiles in "Деталі для вашого авто"
 * (PROJECT_CONTEXT §2), hence the two separate uploads.
 */
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Марка', plural: 'Марки' },
  orderable: true,
  access: { read: publishedOrStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'published'],
    group: 'Каталог',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Назва' },
    slugField('name'),
    {
      name: 'logoMono',
      type: 'upload',
      relationTo: 'media',
      label: 'Логотип (монохром)',
      admin: { description: 'Для міток карток, чипів, мега-меню.' },
    },
    {
      name: 'logoColor',
      type: 'upload',
      relationTo: 'media',
      label: 'Логотип (кольоровий)',
      admin: { description: 'Для плиток у блоці «Деталі для вашого авто».' },
    },
  ],
}
