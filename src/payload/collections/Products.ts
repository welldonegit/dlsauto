import type { CollectionConfig } from 'payload'

import { normalizeOemList } from '@/lib/rules'
import { POSITION_OPTIONS, type PositionRule } from '@/lib/rules/position'

import { isAdminOrManager } from '../access'
import { seoFields, slugField } from '../fields'

/**
 * Products (DEV_CONTEXT §4, §5) — the core catalog item. Every part is unique:
 * availability is driven by `quantity` (from the KeyCRM stock webhook, Р19) and
 * `status`; on the transition to sold the `soldAt` timestamp is stamped (sold
 * pages live on, Р39). The `category` is derived from `partType` (Р7) and shown
 * read-only. OEM numbers are stored as entered plus a normalized copy
 * (`oemNormalized`) for search. Localized: name, description, conditionText,
 * completeness, specValues/specs, searchKeywords, seo*.
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
    defaultColumns: ['sku', 'name', 'partType', 'model', 'price', 'status', 'pickupPoint'],
    group: 'Каталог',
    listSearchableFields: ['sku', 'name', 'oemNormalized', 'crossNormalized'],
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data
        // Keep a normalized OEM copy in sync for search.
        const oem = Array.isArray(data.oem)
          ? (data.oem as { number?: string }[]).map((o) => o?.number ?? '').filter(Boolean)
          : []
        data.oemNormalized = normalizeOemList(oem)
        // Same for cross / replacement numbers (Р52) — normalized copy for search
        // and alternatives matching.
        const cross = Array.isArray(data.crossNumbers)
          ? (data.crossNumbers as { number?: string }[]).map((o) => o?.number ?? '').filter(Boolean)
          : []
        data.crossNormalized = normalizeOemList(cross)
        // Stamp soldAt on the first transition into "sold"; keep it afterwards.
        if (data.status === 'sold' && !data.soldAt) data.soldAt = new Date().toISOString()
        // Category is derived from the part type (Р7); position rule is enforced
        // against the type's positionRule.
        const typeRel = data.partType
        const typeId = typeof typeRel === 'object' && typeRel ? typeRel.id : typeRel
        if (typeId != null) {
          const pt = await req.payload.findByID({
            collection: 'part-types',
            id: typeId as number,
            depth: 0,
          })
          if (pt?.category != null) {
            data.category = typeof pt.category === 'object' ? pt.category.id : pt.category
          }
          const rule = pt?.positionRule as PositionRule | undefined
          const pos = data.position as string | undefined
          const sideRequired = rule === 'lr' || rule === 'fb' || rule === 'seat'
          if (sideRequired && (!pos || pos === 'none')) {
            throw new Error(
              `Для типу «${pt?.name ?? ''}» обовʼязкове розташування (правило ${rule}).`,
            )
          }
        }
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
    {
      name: 'crossNumbers',
      type: 'array',
      label: 'Крос-номери / замінники',
      labels: { singular: 'Крос-номер', plural: 'Крос-номери' },
      admin: {
        description:
          'Номери-замінники (Р52). Беруть участь у пошуку та підборі альтернатив нарівні з OEM (у межах типу).',
      },
      fields: [{ name: 'number', type: 'text', required: true, label: 'Номер' }],
    },
    {
      name: 'crossNormalized',
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
          name: 'partType',
          type: 'relationship',
          relationTo: 'part-types',
          required: true,
          label: 'Тип деталі',
          admin: { description: 'Визначає категорію.' },
        },
        {
          name: 'position',
          type: 'select',
          label: 'Розташування',
          options: POSITION_OPTIONS,
          admin: { description: 'Обовʼязкове за правилом типу (ліва/права, передня/задня тощо).' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          label: 'Категорія',
          admin: { readOnly: true, description: 'Визначається типом деталі автоматично.' },
        },
        { name: 'model', type: 'relationship', relationTo: 'models', label: 'Модель (покоління)' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'alsoFits',
          type: 'relationship',
          relationTo: 'models',
          hasMany: true,
          label: 'Також підходить на моделі',
        },
        {
          name: 'donor',
          type: 'relationship',
          relationTo: 'donors',
          label: 'Авто-донор (№ авто)',
        },
      ],
    },
    { name: 'description', type: 'richText', localized: true, label: 'Опис' },
    // ---------------------------------------------------------- condition
    {
      type: 'row',
      fields: [
        {
          name: 'conditionLabel',
          type: 'select',
          required: true,
          defaultValue: 'used',
          label: 'Стан',
          options: [
            { label: 'Б/в, перевірений', value: 'used_checked' },
            { label: 'Б/в', value: 'used' },
            { label: 'Б/в, з дефектами', value: 'used_defects' },
            { label: 'Новий', value: 'new' },
          ],
        },
        {
          name: 'isOriginal',
          type: 'select',
          label: 'Оригінал / аналог',
          options: [
            { label: 'Оригінал', value: 'original' },
            { label: 'Аналог', value: 'analog' },
          ],
        },
      ],
    },
    {
      name: 'conditionText',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Опис стану',
      admin: { description: 'Обовʼязково. Може бути «Без зауважень» (Р34).' },
    },
    {
      name: 'defectPhotos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Фото дефектів',
    },
    { name: 'completeness', type: 'textarea', localized: true, label: 'Комплектність' },
    // ---------------------------------------------------------- specs
    {
      name: 'specValues',
      type: 'array',
      label: 'Характеристики категорії',
      labels: { singular: 'Характеристика', plural: 'Характеристики' },
      admin: { description: 'Значення за шаблоном категорії (specTemplate).' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'key', type: 'text', label: 'Ключ' },
            { name: 'label', type: 'text', required: true, localized: true, label: 'Назва' },
            { name: 'value', type: 'text', required: true, localized: true, label: 'Значення' },
          ],
        },
      ],
    },
    {
      name: 'specs',
      type: 'array',
      label: 'Додатково',
      labels: { singular: 'Характеристика', plural: 'Характеристики' },
      admin: { description: 'Несопоставлені характеристики імпорту Prom (Р6).' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true, label: 'Назва' },
            { name: 'value', type: 'text', required: true, localized: true, label: 'Значення' },
          ],
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
          name: 'warrantyDays',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 14,
          label: 'Гарантія, днів',
          admin: { description: '0 — без гарантії (плашка не показується).' },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 1,
          label: 'Доступно, шт',
          admin: { description: 'Доступне з KeyCRM (in_stock − in_reserve, Р19).' },
        },
      ],
    },
    {
      name: 'inReserve',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: 'У резерві, шт',
      admin: {
        position: 'sidebar',
        description:
          'З KeyCRM (in_reserve). Доступно 0 + резерв > 0 → «Заброньовано»; доступно 0 + резерв 0 → «Продано» (Р39).',
      },
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
      name: 'receivedAt',
      type: 'date',
      label: 'Дата надходження',
      admin: {
        position: 'sidebar',
        description: 'Новинки рахуються від цієї дати (Р9). Порожньо = не новинка.',
      },
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
    // ---------------------------------------------------------- manual picks
    {
      name: 'boughtTogether',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'З цим купують (закріплення)',
      admin: { description: 'Ручне закріплення поверх автопідбору.' },
    },
    {
      name: 'alternatives',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Альтернативи (закріплення)',
      admin: { description: 'Ручне закріплення поверх автопідбору.' },
    },
    // ---------------------------------------------------------- seo + import
    {
      name: 'searchKeywords',
      type: 'textarea',
      localized: true,
      label: 'Пошукові запити (приховано)',
      admin: {
        hidden: true,
        description: 'З Prom «Пошукові_запити». Бере участь у пошуку (етап 4).',
      },
    },
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
