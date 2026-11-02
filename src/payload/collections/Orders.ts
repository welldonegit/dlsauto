import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrManager } from '../access'

/**
 * Orders (DEV_CONTEXT §4, §6): a mirror of KeyCRM. In the admin they are
 * read-only with a link out to KeyCRM (built from settings.keycrmBaseUrl +
 * keycrmId). Created by the checkout server action in stage 5; here the shape
 * is modeled and locked to read-only for staff.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Замовлення', plural: 'Замовлення' },
  access: { read: isAdminOrManager, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'number',
    defaultColumns: ['number', 'status', 'syncStatus', 'createdAt'],
    group: 'Замовлення',
    // Everything is a mirror — managers read, no one edits by hand.
    description: 'Дзеркало KeyCRM. Редагується у KeyCRM, тут — лише перегляд.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', type: 'text', required: true, label: 'Номер' },
        { name: 'keycrmId', type: 'text', label: 'KeyCRM ID' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'text',
          label: 'Статус (дзеркало KeyCRM)',
        },
        {
          name: 'syncStatus',
          type: 'select',
          defaultValue: 'pending',
          label: 'Синхронізація',
          options: [
            { label: 'Очікує', value: 'pending' },
            { label: 'Синхронізовано', value: 'synced' },
            { label: 'Помилка', value: 'failed' },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Позиції',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Товар' },
        { name: 'price', type: 'number', label: 'Ціна на момент замовлення' },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      label: 'Покупець',
      fields: [
        { name: 'name', type: 'text', label: 'Імʼя' },
        { name: 'phone', type: 'text', label: 'Телефон' },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    {
      name: 'delivery',
      type: 'group',
      label: 'Доставка',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Спосіб',
          options: [
            { label: 'Нова Пошта', value: 'np' },
            { label: 'Delivery', value: 'delivery' },
            { label: 'Самовивіз', value: 'pickup' },
          ],
        },
        { name: 'warehouse', type: 'text', label: 'Відділення' },
        {
          name: 'point',
          type: 'relationship',
          relationTo: 'pickup-points',
          label: 'Пункт самовивозу',
        },
        { name: 'address', type: 'text', label: 'Адреса' },
      ],
    },
    {
      name: 'payment',
      type: 'group',
      label: 'Оплата',
      fields: [
        { name: 'type', type: 'text', label: 'Тип' },
        { name: 'prepaymentAmount', type: 'number', label: 'Сума передоплати, ₴' },
        { name: 'monopayInvoiceId', type: 'text', label: 'monoPay invoice ID' },
        { name: 'paid', type: 'checkbox', defaultValue: false, label: 'Оплачено' },
      ],
    },
    {
      name: 'totals',
      type: 'group',
      label: 'Суми',
      fields: [
        { name: 'subtotal', type: 'number', label: 'Сума товарів, ₴' },
        { name: 'total', type: 'number', label: 'Разом, ₴' },
      ],
    },
    {
      name: 'utm',
      type: 'group',
      label: 'UTM',
      admin: { description: 'Джерело переходу (first-touch).' },
      fields: [
        { name: 'source', type: 'text', label: 'source' },
        { name: 'medium', type: 'text', label: 'medium' },
        { name: 'campaign', type: 'text', label: 'campaign' },
        { name: 'content', type: 'text', label: 'content' },
        { name: 'term', type: 'text', label: 'term' },
      ],
    },
    { name: 'comment', type: 'textarea', label: 'Коментар' },
  ],
}
