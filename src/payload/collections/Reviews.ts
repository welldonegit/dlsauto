import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminOrManager } from '../access'

/**
 * Reviews (DEV_CONTEXT §4): author, rating 1–5, text, photo (opt), product
 * (opt), published (moderation). The average is computed over published reviews
 * in the data layer. Submitted publicly; moderated by staff.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Відгук', plural: 'Відгуки' },
  access: {
    create: anyone,
    read: ({ req: { user } }) => (user ? true : { published: { equals: true } }),
    update: isAdminOrManager,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'rating', 'product', 'published', 'createdAt'],
    group: 'Контент',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'author', type: 'text', required: true, label: 'Автор' },
        {
          name: 'rating',
          type: 'number',
          required: true,
          min: 1,
          max: 5,
          label: 'Оцінка (1–5)',
        },
      ],
    },
    { name: 'text', type: 'textarea', required: true, label: 'Текст' },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото (необовʼязково)',
      admin: {
        description: 'Знімок деталі з відгуку. Показується мініатюрою, збільшується по кліку.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Товар (необовʼязково)',
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      label: 'Опубліковано (пройшов модерацію)',
      admin: { position: 'sidebar' },
    },
  ],
}
