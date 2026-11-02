import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminOrManager } from '../access'

/**
 * Leads (DEV_CONTEXT §4): form submissions — callback, ask-about-part, sto.
 * Created publicly by forms; read by staff. UTM captured first-touch.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  access: { create: anyone, read: isAdminOrManager, update: isAdminOrManager, delete: isAdmin },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['type', 'name', 'phone', 'createdAt'],
    group: 'Замовлення',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Тип заявки',
      options: [
        { label: 'Замовити дзвінок', value: 'callback' },
        { label: 'Запитати про деталь', value: 'ask-about-part' },
        { label: 'СТО', value: 'sto' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Імʼя' },
        { name: 'phone', type: 'text', required: true, label: 'Телефон' },
      ],
    },
    { name: 'message', type: 'textarea', label: 'Повідомлення' },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото' },
    { name: 'product', type: 'relationship', relationTo: 'products', label: 'Товар' },
    {
      name: 'utm',
      type: 'group',
      label: 'UTM',
      fields: [
        { name: 'source', type: 'text', label: 'source' },
        { name: 'medium', type: 'text', label: 'medium' },
        { name: 'campaign', type: 'text', label: 'campaign' },
        { name: 'content', type: 'text', label: 'content' },
        { name: 'term', type: 'text', label: 'term' },
      ],
    },
  ],
}
