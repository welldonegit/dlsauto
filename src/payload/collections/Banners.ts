import type { CollectionConfig } from 'payload'

import { isAdminOrManager, publishedOrStaff } from '../access'
import { publishedField } from '../fields'

/**
 * Banners (DEV_CONTEXT §4): the strip above the header. text (localized), link,
 * variant (from the system set), season, date range, dismissible. The first
 * banner matching the active season and dates is shown; dismissal is remembered
 * in localStorage by banner id (frontend, later stage).
 */
export const Banners: CollectionConfig = {
  slug: 'banners',
  labels: { singular: 'Банер', plural: 'Банери' },
  orderable: true,
  access: {
    read: publishedOrStaff,
    create: isAdminOrManager,
    update: isAdminOrManager,
    delete: isAdminOrManager,
  },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'variant', 'season', 'published'],
    group: 'Контент',
  },
  fields: [
    { name: 'text', type: 'text', required: true, localized: true, label: 'Текст' },
    { name: 'link', type: 'text', label: 'Посилання (необовʼязково)' },
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'dark',
      label: 'Вигляд',
      options: [
        { label: 'Темний', value: 'dark' },
        { label: 'Світлий', value: 'light' },
        { label: 'Primary-відтінок', value: 'primary-tint' },
      ],
    },
    {
      name: 'season',
      type: 'select',
      defaultValue: 'any',
      label: 'Сезон',
      options: [
        { label: 'Будь-який', value: 'any' },
        { label: 'Геловін', value: 'halloween' },
        { label: 'Новий рік', value: 'new_year' },
        { label: 'Великдень', value: 'easter' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'dateFrom', type: 'date', label: 'Показувати з' },
        { name: 'dateTo', type: 'date', label: 'Показувати до' },
      ],
    },
    { name: 'dismissible', type: 'checkbox', defaultValue: true, label: 'Можна закрити' },
    publishedField,
  ],
}
