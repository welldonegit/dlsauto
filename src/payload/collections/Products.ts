import type { CollectionConfig } from 'payload'

import { normalizeOemList } from '@/lib/rules'

import { isAdminOrManager } from '../access'
import { seoFields, slugField } from '../fields'

/**
 * Products (DEV_CONTEXT §4, §5) — the core catalog item. Every part is unique:
 * no quantity, only status in_stock | sold | hidden. On the transition to sold
 * the `soldAt` timestamp is stamped (sold pages live on). OEM numbers are stored
 * as entered plus a normalized copy (`oemNormalized`) for search. Localized:
 * name, description, condition.text, seo*.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Товар', plural: 'Товари' },
  orderable: true,
  access: {
    // Guests never see hidden products; staff see everything.
    read: ({ req: { user } }) => (user ? true : { status: { not_equals: 'hidden' } }),
    create: isAdminOrManager,
    update: isAdminOrManager,
    delete: isAdminOrManager,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['sku', 'name', 'category', 'model', 'price', 'status', 'pickupPoint'],
    group: 'Каталог',
    listSearchableFields: ['sku', 'name', 'oemNormalized'],
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        // Keep a normalized OEM copy in sync for search.
        const oem = Array.isArray(data.oem)
          ? (data.oem as { number?: string }[]).map((o) => o?.number ?? '').filter(Boolean)
          : []
        data.oemNormalized = normalizeOemList(oem)
        // Stamp soldAt on the first transition into "sold"; keep it afterwards.
        if (data.status === 'sold' && !data.soldAt) data.soldAt = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    // ---------------------------------------------------------- identifiers
    {
      type: 'row',
      fields: [
        {
          name: 'sku',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: 'Артикул (SKU)',
          admin: { description: 'Унікальний артикул KeyCRM. Обовʼязковий для синхронізації.' },
        },
        {
          name: 'promId',
          type: 'text',
          label: 'Prom ID',
          admin: { description: 'Необовʼязково.' },
        },
      ],
    },
    {
      name: 'oem',
      type: 'array',
      label: 'OEM-номери',
      labels: { singular: 'OEM-номер', plural: 'OEM-номери' },
      fields: [{ name: 'number', type: 'text', required: true, label: 'Номер' }],
    },
    {
      name: 'oemNormalized',
      type: 'text',
      hasMany: true,
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    // ---------------------------------------------------------- content
    { name: 'name', type: 'text', required: true, localized: true, label: 'Назва' },
    slugField('name'),
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
        { name: 'model', type: 'relationship', relationTo: 'models', label: 'Модель (донор)' },
      ],
    },
    { name: 'description', type: 'richText', localized: true, label: 'Опис' },
    {
      name: 'condition',
      type: 'group',
      label: 'Стан деталі',
      fields: [
        { name: 'text', type: 'textarea', localized: true, label: 'Опис стану' },
        {
          name: 'defects',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          label: 'Фото дефектів',
        },
      ],
    },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Фото та відео',
      admin: {
        description: 'Порядок перетягуванням, перше — головне, відео (mp4) — останнім.',
      },
    },
    // ---------------------------------------------------------- commerce
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 1,
          label: 'Ціна, ₴',
          validate: (value: unknown) =>
            typeof value === 'number' && value > 0 ? true : 'Ціна має бути більшою за 0.',
        },
        { name: 'discountPercent', type: 'number', min: 1, max: 99, label: 'Знижка, %' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'in_stock',
          label: 'Статус',
          options: [
            { label: 'В наявності', value: 'in_stock' },
            { label: 'Продано', value: 'sold' },
            { label: 'Прихований', value: 'hidden' },
          ],
        },
        {
          name: 'pickupPoint',
          type: 'relationship',
          relationTo: 'pickup-points',
          label: 'Пункт видачі (де лежить)',
        },
      ],
    },
    {
      name: 'soldAt',
      type: 'date',
      label: 'Продано (дата)',
      admin: { readOnly: true, position: 'sidebar', description: 'Проставляється автоматично.' },
    },
    // ---------------------------------------------------------- flags
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Акційна (бігуча рамка)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'pinnedNew',
      type: 'checkbox',
      defaultValue: false,
      label: 'Закріпити як новинку',
      admin: { position: 'sidebar' },
    },
    {
      name: 'seasonalDecor',
      type: 'checkbox',
      defaultValue: false,
      label: 'Святкова наклейка',
      admin: { position: 'sidebar' },
    },
    // ---------------------------------------------------------- relations
    {
      name: 'alsoFits',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      label: 'Також підходить на моделі',
    },
    {
      name: 'boughtTogether',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'З цим купують',
    },
    {
      name: 'alternatives',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Альтернативи',
    },
    // ---------------------------------------------------------- seo + import
    seoFields(),
    {
      name: 'needsTranslation',
      type: 'checkbox',
      defaultValue: false,
      label: 'Потребує перекладу (імпорт)',
      admin: {
        position: 'sidebar',
        description: 'Проставляється імпортом з Prom, коли є лише російський текст.',
      },
    },
  ],
}
