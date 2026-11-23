import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrManager } from '../access'

/**
 * Donors (DEV_CONTEXT §4, CATALOG_PLAN §10) — the physical car parts were taken
 * from. Key is model + `label` ("№ авто"), unique across the whole yard (Р41).
 * Year and mileage are optional (kept once per car). Created automatically on
 * product import / creation; in admin an operator can rename, merge, split,
 * add a photo. `partsInStock` is computed in the data layer, not stored.
 * Not localized. Publicly readable — the "Ще з цього авто" donor card is public.
 */
export const Donors: CollectionConfig = {
  slug: 'donors',
  labels: { singular: 'Донор (авто)', plural: 'Донори (авто)' },
  access: {
    read: anyone,
    create: isAdminOrManager,
    update: isAdminOrManager,
    delete: isAdminOrManager,
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'model', 'year', 'mileage'],
    group: 'Каталог',
    description: 'Машина-донор. Мітка «№ авто» унікальна по всій розборці.',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '№ авто',
      admin: { description: 'Мітка, якою розрізняють машини. Унікальна по всій розборці.' },
    },
    { name: 'model', type: 'relationship', relationTo: 'models', required: true, label: 'Модель' },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', label: 'Рік' },
        { name: 'mileage', type: 'number', label: 'Пробіг, км' },
      ],
    },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото авто' },
    { name: 'notes', type: 'textarea', label: 'Примітки' },
  ],
}
