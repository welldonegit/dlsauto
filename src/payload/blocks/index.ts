import type { Block, Field } from 'payload'

/**
 * Page blocks (DEV_CONTEXT §3, PROJECT_CONTEXT §4–5). One block type per block
 * of the homepage and "Про компанію". Each has Ukrainian labels and hints for
 * the client; an empty block is simply not rendered (frontend). Auto-filled
 * blocks (new arrivals, pickups, SUVs) expose a limit and a manual-pin list.
 *
 * Stage 2 renders these as a skeleton only (BlockRenderer → placeholder). Real
 * layout lands in stage 3.
 */

// ------------------------------------------------------------------ helpers
const text = (name: string, label: string, localized = true): Field => ({
  name,
  type: 'text',
  localized,
  label,
})
const area = (name: string, label: string): Field => ({
  name,
  type: 'textarea',
  localized: true,
  label,
})
const eyebrow: Field = text('eyebrow', 'Напис зверху (eyebrow)')
const heading: Field = text('heading', 'Заголовок')

const autoFillFields = (relationTo: 'products'): Field[] => [
  heading,
  { name: 'limit', type: 'number', defaultValue: 15, min: 1, max: 40, label: 'Скільки показувати' },
  {
    name: 'pinned',
    type: 'relationship',
    relationTo,
    hasMany: true,
    label: 'Закріпити вручну',
    admin: { description: 'Решта — автоматично, найновіші в наявності.' },
  },
]

// ------------------------------------------------------------------ blocks
export const heroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Перший екран', plural: 'Перші екрани' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'a',
      label: 'Варіант',
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ],
    },
    eyebrow,
    heading,
    area('subheading', 'Підзаголовок'),
    { name: 'background', type: 'upload', relationTo: 'media', label: 'Фонове фото' },
  ],
}

export const statsBlock: Block = {
  slug: 'stats',
  labels: { singular: 'DLSAuto в цифрах', plural: 'DLSAuto в цифрах' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      label: 'Картки',
      maxRows: 4,
      fields: [
        eyebrow,
        text('value', 'Значення (напр. «5 000+»)', false),
        area('text', 'Текст'),
        { name: 'accent', type: 'checkbox', defaultValue: false, label: 'Червона картка' },
      ],
    },
  ],
}

export const categoriesBlock: Block = {
  slug: 'categoriesBlock',
  labels: { singular: 'Категорії запчастин', plural: 'Категорії запчастин' },
  fields: [
    heading,
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'a',
      label: 'Варіант',
      options: [
        { label: 'A — чисті картки', value: 'a' },
        { label: 'B — великі обтравлені фото', value: 'b' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Категорії',
      admin: { description: 'Порожньо — усі опубліковані за порядком.' },
    },
  ],
}

export const modelsPickerBlock: Block = {
  slug: 'modelsPicker',
  labels: { singular: 'Деталі для вашого авто', plural: 'Деталі для вашого авто' },
  fields: [
    heading,
    {
      name: 'defaultBrand',
      type: 'relationship',
      relationTo: 'brands',
      label: 'Марка за замовчуванням',
    },
  ],
}

export const newArrivalsBlock: Block = {
  slug: 'newArrivals',
  labels: { singular: 'Нові надходження', plural: 'Нові надходження' },
  fields: autoFillFields('products'),
}

export const servicesBlock: Block = {
  slug: 'services',
  labels: { singular: 'Послуги', plural: 'Послуги' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      label: 'Послуги',
      fields: [
        text('title', 'Назва'),
        area('text', 'Опис'),
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото' },
        text('link', 'Посилання', false),
      ],
    },
  ],
}

export const pickupsPartsBlock: Block = {
  slug: 'pickupsParts',
  labels: { singular: 'Запчастини на пікапи', plural: 'Запчастини на пікапи' },
  fields: autoFillFields('products'),
}

export const suvsPartsBlock: Block = {
  slug: 'suvsParts',
  labels: { singular: 'Запчастини на позашляховики', plural: 'Запчастини на позашляховики' },
  fields: autoFillFields('products'),
}

export const videoCheckBlock: Block = {
  slug: 'videoCheck',
  labels: { singular: 'Перевіряємо перед продажем', plural: 'Перевіряємо перед продажем' },
  fields: [
    heading,
    area('text', 'Текст'),
    { name: 'video', type: 'upload', relationTo: 'media', label: 'Відео' },
    { name: 'poster', type: 'upload', relationTo: 'media', label: 'Постер' },
  ],
}

export const faqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'Часті питання', plural: 'Часті питання' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      label: 'Питання',
      fields: [text('question', 'Питання'), area('answer', 'Відповідь')],
    },
  ],
}

export const reviewsBlock: Block = {
  slug: 'reviewsBlock',
  labels: { singular: 'Відгуки', plural: 'Відгуки' },
  fields: [
    heading,
    {
      name: 'limit',
      type: 'number',
      defaultValue: 8,
      min: 1,
      max: 24,
      label: 'Скільки показувати',
    },
  ],
}

export const benefitsBlock: Block = {
  slug: 'benefits',
  labels: { singular: 'Переваги (над футером)', plural: 'Переваги' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Картки',
      maxRows: 3,
      fields: [
        text('title', 'Назва (напр. «Відправка»)'),
        text('value', 'Велике значення', false),
        area('text', 'Текст'),
      ],
    },
  ],
}

export const whatElseWeDoBlock: Block = {
  slug: 'whatElseWeDo',
  labels: { singular: 'Що ще ми робимо', plural: 'Що ще ми робимо' },
  fields: [
    heading,
    area('text', 'Текст справа'),
    {
      name: 'cards',
      type: 'array',
      label: 'Картки-послуги',
      fields: [
        text('title', 'Назва'),
        area('text', 'Опис'),
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото' },
      ],
    },
    { name: 'video', type: 'upload', relationTo: 'media', label: 'Відео' },
    { name: 'videoPoster', type: 'upload', relationTo: 'media', label: 'Постер відео' },
  ],
}

export const aboutHeroBlock: Block = {
  slug: 'aboutHero',
  labels: { singular: 'Перший екран «Про компанію»', plural: 'Перші екрани «Про компанію»' },
  fields: [eyebrow, heading, area('text', 'Текст')],
}

export const whyDisassemblyBlock: Block = {
  slug: 'whyDisassembly',
  labels: { singular: 'Чому розбірка, а не магазин', plural: 'Чому розбірка' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      label: 'Кроки',
      fields: [
        text('step', 'Номер (напр. «01»)', false),
        text('title', 'Заголовок'),
        area('text', 'Текст'),
      ],
    },
  ],
}

export const partPathBlock: Block = {
  slug: 'partPath',
  labels: { singular: 'Шлях деталі', plural: 'Шлях деталі' },
  fields: [
    heading,
    {
      name: 'steps',
      type: 'array',
      label: 'Кроки',
      fields: [
        text('title', 'Заголовок'),
        area('text', 'Текст'),
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото' },
      ],
    },
  ],
}

export const teamBlock: Block = {
  slug: 'team',
  labels: { singular: 'Команда і цех', plural: 'Команда і цех' },
  fields: [
    heading,
    area('text', 'Текст'),
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, label: 'Фото' },
  ],
}

export const ctaTextBlock: Block = {
  slug: 'ctaText',
  labels: { singular: 'Текстовий заклик (CTA)', plural: 'Текстові заклики' },
  fields: [
    heading,
    area('text', 'Текст'),
    text('buttonLabel', 'Напис на кнопці'),
    text('buttonLink', 'Посилання кнопки', false),
  ],
}

export const richTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Текстовий блок', plural: 'Текстові блоки' },
  fields: [{ name: 'content', type: 'richText', localized: true, label: 'Вміст' }],
}

export const contactsBlock: Block = {
  slug: 'contactsBlock',
  labels: { singular: 'Контакти', plural: 'Контакти' },
  fields: [
    heading,
    area('intro', 'Вступний текст'),
    {
      name: 'showForm',
      type: 'checkbox',
      defaultValue: true,
      label: 'Показувати форму «Запитати про деталь»',
    },
  ],
}

/** All block types available to the pages layout builder. */
export const pageBlocks: Block[] = [
  heroBlock,
  statsBlock,
  categoriesBlock,
  modelsPickerBlock,
  newArrivalsBlock,
  servicesBlock,
  pickupsPartsBlock,
  suvsPartsBlock,
  videoCheckBlock,
  faqBlock,
  reviewsBlock,
  benefitsBlock,
  whatElseWeDoBlock,
  aboutHeroBlock,
  whyDisassemblyBlock,
  partPathBlock,
  teamBlock,
  ctaTextBlock,
  richTextBlock,
  contactsBlock,
]
