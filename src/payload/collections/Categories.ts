import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrStaff } from '../access'
import { publishedField, seoFields, slugField } from '../fields'

/**
 * Categories (DEV_CONTEXT §4): flat, one level. Localized: name, description,
 * seo*. Slug is shared across languages.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категорія', plural: 'Категорії' },
  orderable: true,
  access: { read: publishedOrStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'published'],
    group: 'Каталог',
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true, label: 'Назва' },
    slugField('name'),
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото',
      admin: { description: 'Обтравлене фото деталі на білому.' },
    },
    { name: 'description', type: 'textarea', localized: true, label: 'Опис' },
    seoFields(),
    publishedField,
  ],
}
