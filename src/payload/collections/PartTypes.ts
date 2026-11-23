import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'

/**
 * PartTypes (DEV_CONTEXT §4, CATALOG_PLAN §7) — the 107-type reference book.
 * Each type belongs to one category and carries a `positionRule` (which side /
 * axis is mandatory), a `broad` flag (wide catch-all types take alternatives by
 * OEM only, Р35), `relatedTypes[]` with a side condition for "З цим купують"
 * (Р37/Р45) and `aliases[]` (name hints for the Prom importer). The product's
 * `category` is derived from its `partType` (Р7), so the type owns the category.
 * Not localized (internal reference); `name` is uk.
 */
export const PartTypes: CollectionConfig = {
  slug: 'part-types',
  labels: { singular: 'Тип деталі', plural: 'Типи деталей' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'positionRule', 'broad'],
    group: 'Каталог',
    description: 'Довідник типів деталей. Категорія товару визначається типом.',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Тип деталі' },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          label: 'Категорія',
        },
        {
          name: 'positionRule',
          type: 'select',
          required: true,
          defaultValue: 'none',
          label: 'Правило сторони',
          options: [
            { label: 'lr — обовʼязково ліва / права', value: 'lr' },
            { label: 'fb — обовʼязково передня / задня', value: 'fb' },
            { label: 'any — бажано, не обовʼязково', value: 'any' },
            { label: 'seat — водійська / пасажирська', value: 'seat' },
            { label: '— не потрібно', value: 'none' },
          ],
        },
      ],
    },
    {
      name: 'broad',
      type: 'checkbox',
      defaultValue: false,
      label: 'Широкий тип (альтернативи лише за OEM)',
      admin: {
        position: 'sidebar',
        description: 'Р35: катч-олл тип — альтернативи шукаються тільки за OEM того ж типу.',
      },
    },
    {
      name: 'relatedTypes',
      type: 'array',
      label: 'Звʼязки «З цим купують»',
      labels: { singular: 'Звʼязок', plural: 'Звʼязки' },
      admin: {
        description: 'Р37/Р45: тип-кандидат та умова сторони (та сама / протилежна / будь-яка).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'relationship',
              relationTo: 'part-types',
              required: true,
              label: 'Тип',
            },
            {
              name: 'side',
              type: 'select',
              required: true,
              defaultValue: 'any',
              label: 'Сторона',
              options: [
                { label: 'та сама', value: 'same' },
                { label: 'протилежна', value: 'opposite' },
                { label: 'будь-яка', value: 'any' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'aliases',
      type: 'array',
      label: 'Синоніми назви (підказка імпорту)',
      labels: { singular: 'Синонім', plural: 'Синоніми' },
      admin: { description: 'Слова в назві Prom, що підказують цей тип.' },
      fields: [{ name: 'value', type: 'text', required: true, label: 'Слово' }],
    },
  ],
}
