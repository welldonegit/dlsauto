import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrStaff } from '../access'
import { publishedField, slugField } from '../fields'

/**
 * Models = a generation (DEV_CONTEXT §4): brand, name, generation (opt),
 * yearFrom, yearTo (null = present), bodyType (grouping only, hidden in UI),
 * twinName (opt), donorPhoto (opt), order, published. No localized fields.
 * `partsCount` (in-stock products) is computed in the data layer, not stored.
 */
export const Models: CollectionConfig = {
  slug: 'models',
  labels: { singular: 'Модель', plural: 'Моделі' },
  orderable: true,
  access: { read: publishedOrStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'yearFrom', 'yearTo', 'published'],
    group: 'Каталог',
  },
  fields: [
    { name: 'brand', type: 'relationship', relationTo: 'brands', required: true, label: 'Марка' },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Модель',
      admin: { description: 'Напр. «L200».' },
    },
    slugField('name'),
    {
      name: 'generation',
      type: 'text',
      label: 'Покоління',
      admin: { description: 'Напр. «IV», «WK». Необовʼязково.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'yearFrom', type: 'number', label: 'Рік від' },
        {
          name: 'yearTo',
          type: 'number',
          label: 'Рік до',
          admin: { description: 'Порожньо = дотепер.' },
        },
      ],
    },
    {
      name: 'bodyType',
      type: 'select',
      label: 'Тип кузова',
      admin: {
        description:
          'Лише для секцій «на пікапи» / «на позашляховики». В інтерфейсі не показується.',
      },
      options: [
        { label: 'Пікап', value: 'pickup' },
        { label: 'Позашляховик', value: 'suv' },
        { label: 'Легкове', value: 'passenger' },
      ],
    },
    {
      name: 'twinName',
      type: 'text',
      label: 'Назва-близнюк',
      admin: { description: 'Напр. «Pathfinder». Необовʼязково.' },
    },
    {
      name: 'donorPhoto',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото донора',
      admin: { description: 'Поки не показується (увімкнеться, коли буде у всіх).' },
    },
    publishedField,
  ],
}
