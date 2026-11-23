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
    {
      name: 'specTemplate',
      type: 'array',
      label: 'Шаблон характеристик',
      labels: { singular: 'Характеристика', plural: 'Характеристики' },
      admin: {
        description:
          'Характеристики категорії (DEV_CONTEXT §4, Р6). Значення заповнюються у товарі (specValues).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              type: 'text',
              required: true,
              label: 'Ключ',
              admin: { description: 'Стабільний ідентифікатор (латиницею), напр. engineCode.' },
            },
            { name: 'name', type: 'text', required: true, localized: true, label: 'Назва' },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              defaultValue: 'text',
              label: 'Формат',
              options: [
                { label: 'текст', value: 'text' },
                { label: 'число', value: 'number' },
                { label: 'список', value: 'select' },
              ],
            },
            {
              name: 'unit',
              type: 'text',
              label: 'Одиниця',
              admin: { description: 'Напр. «л», «мм».' },
            },
            {
              name: 'required',
              type: 'checkbox',
              defaultValue: false,
              label: 'Обовʼязкова',
            },
          ],
        },
        {
          name: 'options',
          type: 'array',
          label: 'Варіанти (для списку)',
          labels: { singular: 'Варіант', plural: 'Варіанти' },
          admin: { condition: (_, s) => s?.type === 'select' },
          fields: [
            { name: 'value', type: 'text', required: true, localized: true, label: 'Значення' },
          ],
        },
        {
          name: 'requiredForTypes',
          type: 'relationship',
          relationTo: 'part-types',
          hasMany: true,
          label: 'Обовʼязкова для типів',
          admin: { description: 'Якщо порожньо — правило «Обовʼязкова» діє на всю категорію.' },
        },
      ],
    },
    seoFields(),
    publishedField,
  ],
}
