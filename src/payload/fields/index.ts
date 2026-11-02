import type { Field } from 'payload'

import { slugify } from '@/lib/rules'

/**
 * Shared field factories. Slugs are common to both languages (DEV_CONTEXT §4),
 * so the slug field is NOT localized; it is generated from a source field with
 * uk→latin transliteration and may be overridden by hand.
 */
export const slugField = (from = 'name'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'URL-адреса. Генерується з назви, можна змінити вручну.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data, originalDoc }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = (data?.[from] ?? originalDoc?.[from]) as string | undefined
        return source ? slugify(source) : value
      },
    ],
  },
})

/** Localized SEO fields (seoTitle / seoDescription) in a collapsible block. */
export const seoFields = (): Field => ({
  type: 'collapsible',
  label: 'SEO',
  admin: { initCollapsed: true },
  fields: [
    {
      name: 'seoTitle',
      type: 'text',
      localized: true,
      label: 'SEO-заголовок (title)',
      admin: { description: 'Якщо порожньо — підставиться назва за шаблоном.' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      localized: true,
      label: 'SEO-опис (meta description)',
    },
  ],
})

/** Publish toggle shown in the sidebar. */
export const publishedField: Field = {
  name: 'published',
  type: 'checkbox',
  defaultValue: false,
  label: 'Опубліковано',
  admin: { position: 'sidebar', description: 'Показувати на сайті.' },
}
