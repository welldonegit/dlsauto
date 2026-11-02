import './load-env'

import { readFileSync } from 'fs'
import path from 'path'

import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'

/**
 * Database seed (DEV_CONTEXT §6). Realistic data drawn from the Claude Design
 * export and PROJECT_CONTEXT: 16 brands with logos, representative models with
 * years and twins, the 9 categories, two pickup points, settings, the main
 * pages composed of blocks, and ~40 products with placeholder photos from the
 * export. Idempotent — re-running upserts by natural key, never duplicates.
 *
 * Run: `pnpm db:seed` (needs DATABASE_URL + PAYLOAD_SECRET).
 */

const EXPORT = path.resolve('docs/design-export')

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
}

async function run(): Promise<void> {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[seed] ${m}`)

  // ---------------------------------------------------------------- helpers
  // Seed writes span many collections with data assembled dynamically, so the
  // payload calls are intentionally untyped here (casts localized to this helper).
  type Coll = Parameters<Payload['find']>[0]['collection']

  async function upsert(
    collection: Coll,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<number> {
    const existing = await payload.find({ collection, where: where as never, limit: 1, depth: 0 })
    if (existing.docs[0]) {
      const updated = await payload.update({
        collection,
        id: existing.docs[0].id as number,
        data: data as never,
      })
      return updated.id as number
    }
    const created = await payload.create({ collection, data: data as never })
    return created.id as number
  }

  const mediaCache = new Map<string, number>()
  async function media(relPath: string, alt: string, name?: string): Promise<number> {
    const key = name ?? path.basename(relPath)
    if (mediaCache.has(key)) return mediaCache.get(key)!
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: key } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      mediaCache.set(key, existing.docs[0].id as number)
      return existing.docs[0].id as number
    }
    const abs = path.resolve(EXPORT, relPath)
    const buf = readFileSync(abs)
    const ext = path.extname(key).toLowerCase()
    const created = await payload.create({
      collection: 'media',
      data: { alt },
      file: {
        data: buf,
        mimetype: MIME[ext] ?? 'application/octet-stream',
        name: key,
        size: buf.length,
      },
    })
    mediaCache.set(key, created.id as number)
    return created.id as number
  }

  // ---------------------------------------------------------------- brands
  // name, logo basename, has colour logo, sortOrder (by export part counts).
  const BRANDS: [string, string, boolean][] = [
    ['Mitsubishi', 'mitsubishi', true],
    ['Ford', 'ford', true],
    ['Mazda', 'mazda', true],
    ['Nissan', 'nissan', false],
    ['Jeep', 'jeep', true],
    ['Volkswagen', 'volkswagen', false],
    ['Kia', 'kia', true],
    ['Hyundai', 'hyundai', true],
    ['Toyota', 'toyota', false],
    ['Mercedes-Benz', 'mercedes', true],
    ['SsangYong', 'ssangyong', false],
    ['Volvo', 'volvo', false],
    ['BMW', 'bmw', true],
    ['Fiat', 'fiat', true],
    ['Isuzu', 'isuzu', true],
    ['Peugeot', 'peugeot', false],
  ]
  const brandId = new Map<string, number>()
  for (const [name, file, hasColor] of BRANDS) {
    const slug = file === 'mercedes' ? 'mercedes-benz' : file
    const logoMono = await media(`assets/logos/${file}.svg`, `${name} логотип`, `${file}-mono.svg`)
    const logoColor = hasColor
      ? await media(
          `assets/logos/color/${file}.svg`,
          `${name} логотип кольоровий`,
          `${file}-color.svg`,
        )
      : undefined
    const id = await upsert(
      'brands',
      { slug: { equals: slug } },
      { name, slug, logoMono, ...(logoColor ? { logoColor } : {}), published: true },
    )
    brandId.set(name, id)
  }
  log(`brands: ${brandId.size}`)

  // ---------------------------------------------------------------- categories
  // name, slug, photo file (null = placeholder). 9 categories from the export.
  const CATEGORIES: [string, string, string | null][] = [
    ['Двигуни', 'dviguny', 'assets/cat-engine.jpg'],
    ['КПП та роздатки', 'kpp-ta-rozdatky', 'assets/cat-gearbox.jpg'],
    ['Підвіска та ходова', 'pidviska-ta-khodova', 'assets/cat-suspension.jpg'],
    ['Кузовні деталі', 'kuzovni-detali', 'assets/cat-body.jpg'],
    ['Оптика', 'optyka', null],
    ['Електрика та електроніка', 'elektryka', 'assets/cat-electric.jpg'],
    ['Салон', 'salon', null],
    ['Гальмівна система', 'halmivna-systema', null],
    ['Шини та диски', 'shyny-ta-dysky', 'assets/cat-wheels.jpg'],
  ]
  const catId = new Map<string, number>()
  for (let i = 0; i < CATEGORIES.length; i += 1) {
    const [name, slug, photoFile] = CATEGORIES[i]
    const photo = photoFile ? await media(photoFile, `${name} — фото категорії`) : undefined
    const id = await upsert(
      'categories',
      { slug: { equals: slug } },
      { name, slug, ...(photo ? { photo } : {}), published: true },
    )
    catId.set(name, id)
  }
  log(`categories: ${catId.size}`)

  // ---------------------------------------------------------------- models
  // brand, name, generation, yearFrom, yearTo, bodyType, twinName
  type M = {
    brand: string
    name: string
    gen?: string
    from?: number
    to?: number
    body: 'pickup' | 'suv' | 'passenger'
    twin?: string
  }
  const MODELS: M[] = [
    { brand: 'Mitsubishi', name: 'L200', from: 2005, to: 2015, body: 'pickup' },
    { brand: 'Mitsubishi', name: 'L200', from: 1996, to: 2005, body: 'pickup' },
    { brand: 'Mitsubishi', name: 'Pajero Sport', gen: 'I', from: 1996, to: 2008, body: 'suv' },
    { brand: 'Mitsubishi', name: 'Pajero Wagon', body: 'suv' },
    { brand: 'Ford', name: 'Ranger', from: 2006, to: 2012, body: 'pickup', twin: 'BT-50' },
    { brand: 'Ford', name: 'Ranger', from: 1998, to: 2006, body: 'pickup', twin: 'B2500' },
    { brand: 'Ford', name: 'Ranger', gen: 'T6', from: 2015, to: 2022, body: 'pickup' },
    { brand: 'Mazda', name: 'BT-50', from: 2006, to: 2012, body: 'pickup', twin: 'Ranger' },
    { brand: 'Mazda', name: 'B2500', from: 1998, to: 2006, body: 'pickup', twin: 'Ranger' },
    {
      brand: 'Nissan',
      name: 'Navara',
      gen: 'R51',
      from: 2005,
      to: 2015,
      body: 'pickup',
      twin: 'Pathfinder',
    },
    { brand: 'Nissan', name: 'X-Trail', gen: 'T30–T31', from: 2000, to: 2014, body: 'suv' },
    { brand: 'Toyota', name: 'Hilux', from: 2005, to: 2015, body: 'pickup' },
    { brand: 'Isuzu', name: 'D-Max', body: 'pickup' },
    { brand: 'Hyundai', name: 'Terracan', body: 'suv' },
    { brand: 'Jeep', name: 'Grand Cherokee', from: 2004, to: 2007, body: 'suv' },
    { brand: 'Kia', name: 'Sorento', from: 2002, to: 2014, body: 'suv' },
  ]
  const modelIds: number[] = []
  for (const m of MODELS) {
    const slug = [m.name, m.gen, m.from]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const id = await upsert(
      'models',
      { slug: { equals: slug } },
      {
        brand: brandId.get(m.brand),
        name: m.name,
        slug,
        ...(m.gen ? { generation: m.gen } : {}),
        ...(m.from ? { yearFrom: m.from } : {}),
        ...(m.to ? { yearTo: m.to } : {}),
        bodyType: m.body,
        ...(m.twin ? { twinName: m.twin } : {}),
        published: true,
      },
    )
    modelIds.push(id)
  }
  log(`models: ${modelIds.length}`)

  // ---------------------------------------------------------------- pickup points
  const zp = await upsert(
    'pickup-points',
    { name: { equals: 'Запоріжжя' } },
    {
      name: 'Запоріжжя',
      address: 'Південне шосе, [номер]',
      phone: '+380 98 640 13 57',
      schedule: { dayFrom: '1', dayTo: '6', openHour: 9, closeHour: 18 },
      mapCoords: { lat: 47.8388, lng: 35.1396 },
      isDefault: true,
    },
  )
  await upsert(
    'pickup-points',
    { name: { equals: 'Дніпро' } },
    {
      name: 'Дніпро',
      address: 'вул. [адреса]',
      // Hours unconfirmed (PROJECT_CONTEXT §1) → "графік уточнюється", no status.
      schedule: { dayFrom: '1', dayTo: '6', openHour: null, closeHour: null },
      mapCoords: { lat: 48.4647, lng: 35.0462 },
      isDefault: false,
    },
  )
  log('pickup points: 2')

  // ---------------------------------------------------------------- products
  const PART_IMAGES = [
    'assets/part-pickup-hub.jpg',
    'assets/cat-suspension.jpg',
    'assets/cat-body.jpg',
    'assets/cat-engine.jpg',
    'assets/cat-electric.jpg',
    'assets/cat-wheels.jpg',
    'uploads/detail 1.jpg',
    'uploads/dvigun 1.jpg',
    'uploads/electric 1.jpg',
    'uploads/bort 1.jpg',
  ]
  const partImageIds: number[] = []
  for (const p of PART_IMAGES)
    partImageIds.push(await media(p, 'Фото деталі (заглушка з експорту)'))

  // category → part names (from the export; generic where the export was silent)
  const CATEGORY_PARTS: [string, number[], string[]][] = [
    [
      'Двигуни',
      [35000, 118000],
      ['Двигун у зборі', 'Головка блоку циліндрів', 'Турбіна', 'Паливна рампа', 'Піддон картера'],
    ],
    [
      'КПП та роздатки',
      [12000, 48000],
      ['КПП механічна', 'Роздаткова коробка', 'Карданний вал', 'Зчеплення (комплект)'],
    ],
    [
      'Підвіска та ходова',
      [600, 4500],
      [
        'Амортизатор задній',
        'Важіль передній нижній',
        'Ступиця передня',
        'Ресора задня',
        'Стабілізатор',
      ],
    ],
    [
      'Кузовні деталі',
      [1500, 9000],
      ['Бампер передній', 'Капот', 'Крило переднє', 'Двері передні', 'Кришка багажника'],
    ],
    [
      'Оптика',
      [700, 7000],
      ['Фара ліва', 'Фара права', 'Ліхтар задній лівий', 'Протитуманна фара'],
    ],
    [
      'Електрика та електроніка',
      [700, 9000],
      ['Генератор', 'Стартер', 'Блок запобіжників', 'Щиток приладів'],
    ],
    [
      'Салон',
      [800, 7000],
      [
        'Сидіння водія',
        'Панель приладів',
        'Кермо з подушкою',
        'Оббивка дверей',
        'Консоль центральна',
      ],
    ],
    [
      'Гальмівна система',
      [600, 6000],
      ['Супорт передній', 'Гальмівний диск', 'Блок ABS', 'Головний гальмівний циліндр'],
    ],
    ['Шини та диски', [1200, 14000], ['Диск литий R16', 'Комплект дисків R17', 'Запасне колесо']],
  ]

  // ------------------------------------------------------------- lexical builders
  type LexNode = Record<string, unknown>
  const txt = (t: string): LexNode => ({
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: t,
    version: 1,
  })
  const para = (t: string): LexNode => ({
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [txt(t)],
  })
  const h2 = (t: string): LexNode => ({
    type: 'heading',
    tag: 'h2',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [txt(t)],
  })
  const ul = (items: string[]): LexNode => ({
    type: 'list',
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: items.map((t, i) => ({
      type: 'listitem',
      value: i + 1,
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [txt(t)],
    })),
  })
  const doc = (children: LexNode[]) => ({
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  })
  const richText = (t: string) => doc([para(t)])

  let n = 0
  for (const [catName, [lo, hi], parts] of CATEGORY_PARTS) {
    for (const part of parts) {
      const i = n
      const modelDocId = modelIds[i % modelIds.length]
      const price = lo + ((i * 737) % (hi - lo))
      const sku = `DLS-${String(i + 1).padStart(4, '0')}`
      const slug = `${part}-${sku}`
        .toLowerCase()
        .replace(/[^a-z0-9a-яіїєґ]+/giu, '-')
        .replace(/^-+|-+$/g, '')
      const status = i % 7 === 6 ? 'sold' : 'in_stock'
      const discount = i % 5 === 0 ? (i % 2 ? 20 : 15) : undefined
      const data: Record<string, unknown> = {
        sku,
        name: part,
        slug,
        category: catId.get(catName),
        model: modelDocId,
        oem: [{ number: `${sku.replace('-', '')}-${1000 + i}` }, { number: `OEM${2000 + i * 3}` }],
        description: richText(`${part}. Знято з авто-донора, перевірено на стенді або на авто.`),
        condition: {
          text: 'Робочий стан. Дрібні потертості від експлуатації; дефекти обведені на фото.',
        },
        photos: [
          partImageIds[i % partImageIds.length],
          partImageIds[(i + 3) % partImageIds.length],
        ],
        price,
        ...(discount ? { discountPercent: discount } : {}),
        status,
        pickupPoint: zp,
        featured: i % 6 === 0,
        pinnedNew: i < 3,
        seasonalDecor: i % 9 === 0,
      }
      await upsert('products', { sku: { equals: sku } }, data)
      n += 1
    }
  }
  log(`products: ${n}`)

  // ---------------------------------------------------------------- settings
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      phones: [{ number: '+380 98 640 13 57' }],
      email: 'info@dlsauto.com.ua',
      messengers: {
        telegram: 'https://t.me/dlsauto',
        viber: 'viber://chat?number=%2B380986401357',
      },
      channelNotes: {
        telegram:
          'Найшвидше. Надішліть фото деталі та номер — відповімо за 5–10 хвилин у робочий час',
        viber: 'Те саме, якщо зручніше у Viber',
        phone: 'Якщо треба обговорити голосом. Пн–Сб 9:00–18:00',
      },
      socials: {
        telegram: 'https://t.me/dlsauto',
        viber: '#',
        tiktok: '#',
        instagram: '#',
        facebook: '#',
      },
      promRating: 4.8,
      promReviewsCount: 48,
      marketplaces: { prom: '#', avtopro: '#', olx: '#' },
      minOrder: 500,
      dispatchCutoffHour: 15,
      prepaymentConditions:
        'Карткою онлайн або готівкою при самовивозі. Для габаритних — передплата після підтвердження.',
      acceptBlock:
        'Приймаємо: готівка при самовивозі, карта онлайн (monoPay — Visa/Mastercard, Apple/Google Pay).',
      fop: { name: 'ФОП [ПІБ]', edrpou: '[ЄДРПОУ]', address: '[адреса]' },
      keycrmBaseUrl: '',
      season: { current: 'none', manualOverride: false },
    },
  })
  log('settings updated')

  // ---------------------------------------------------------------- pages
  const statItems = [
    {
      eyebrow: 'ДОСВІД',
      value: '4+',
      text: 'Роки на ринку: самі купуємо, розбираємо і продаємо',
      accent: false,
    },
    {
      eyebrow: 'ЗАМОВЛЕННЯ',
      value: '5 000+',
      text: 'Відправлених деталей за рік по всій Україні',
      accent: true,
    },
    {
      eyebrow: 'МАРКИ',
      value: '16',
      text: 'Марок, основа — пікапи та позашляховики',
      accent: false,
    },
    {
      eyebrow: 'ПЕРЕВІРКА',
      value: '100 %',
      text: 'Кожна деталь перевірена на стенді або на авто, дефекти обведені',
      accent: true,
    },
  ]

  const home = [
    {
      blockType: 'hero',
      variant: 'a',
      eyebrow: 'DLSAuto',
      heading: 'Вживані автозапчастини з власної розбірки',
      subheading: 'Пікапи, позашляховики та легкові. Кожна деталь перевірена.',
    },
    { blockType: 'stats', heading: 'DLSAuto в цифрах', items: statItems },
    { blockType: 'categoriesBlock', heading: 'Категорії запчастин', variant: 'a' },
    {
      blockType: 'modelsPicker',
      heading: 'Деталі для вашого авто',
      defaultBrand: brandId.get('Mitsubishi'),
    },
    { blockType: 'newArrivals', heading: 'Нові надходження', limit: 15 },
    { blockType: 'pickupsParts', heading: 'Запчастини на пікапи', limit: 12 },
    { blockType: 'suvsParts', heading: 'Запчастини на позашляховики', limit: 12 },
    {
      blockType: 'videoCheck',
      heading: 'Перевіряємо перед продажем',
      text: 'Кожна деталь — на стенді або на авто.',
    },
    {
      blockType: 'benefits',
      items: [
        {
          title: 'Відправка',
          value: 'Сьогодні',
          text: 'Замовлення до 15:00 — відправка в день замовлення.',
        },
        { title: 'Оплата', value: 'Онлайн', text: 'Картка онлайн або готівка при самовивозі.' },
        {
          title: 'Гарантія',
          value: 'до 60 днів',
          text: '14 / 30 для агрегатів, до 60 — на відновлені.',
        },
      ],
    },
    {
      blockType: 'faq',
      heading: 'Часті питання',
      items: [
        {
          question: 'Чи підійде деталь на моє авто?',
          answer: 'Напишіть нам номер або фото — перевіримо сумісність.',
        },
        {
          question: 'Як відбувається оплата?',
          answer: 'Картка онлайн або готівка при самовивозі; для габаритних — передплата.',
        },
        {
          question: 'Скільки діє гарантія?',
          answer: '14 днів, 30 на агрегати, до 60 на відновлені.',
        },
      ],
    },
    { blockType: 'reviewsBlock', heading: 'Відгуки', limit: 8 },
  ]

  const about = [
    {
      blockType: 'aboutHero',
      eyebrow: 'Про компанію',
      heading: 'Авторозбірка у Запоріжжі',
      text: 'Самі купуємо авто, розбираємо і продаємо перевірені деталі.',
    },
    { blockType: 'stats', heading: 'DLSAuto в цифрах', items: statItems },
    {
      blockType: 'whyDisassembly',
      heading: 'Чому розбірка, а не магазин',
      items: [
        { step: '01', title: 'Оригінал', text: 'Заводська деталь, а не аналог.' },
        { step: '02', title: 'Перевірка', text: 'На стенді або на авто.' },
        { step: '03', title: 'Ціна', text: 'Дешевше за нову.' },
      ],
    },
    {
      blockType: 'partPath',
      heading: 'Шлях деталі',
      steps: [
        { title: 'Приймання авто', text: 'Купуємо авто на розбір.' },
        { title: 'Демонтаж', text: 'Знімаємо та маркуємо.' },
        { title: 'Перевірка', text: 'Тестуємо та фотографуємо.' },
      ],
    },
    { blockType: 'team', heading: 'Команда і цех', text: 'Усе в одному дворі у Запоріжжі.' },
    { blockType: 'reviewsBlock', heading: 'Відгуки', limit: 8 },
    {
      blockType: 'ctaText',
      heading: 'Не знайшли деталь?',
      text: 'Напишіть нам — знайдемо або запропонуємо аналог.',
      buttonLabel: 'Написати',
      buttonLink: '/contacts',
    },
  ]

  // Політика конфіденційності — real copy from the Claude Design export.
  const policyDoc = doc([
    h2('Загальні положення'),
    para(
      'Ця Політика визначає, як ФОП [ПІБ] (далі — «DLSAuto», «ми») збирає, зберігає та використовує персональні дані користувачів сайту [домен]. Користуючись сайтом, ви погоджуєтесь із цією Політикою. Ми обробляємо дані відповідно до Закону України «Про захист персональних даних».',
    ),
    h2('Які дані ми збираємо'),
    para('При оформленні замовлення або заявки:'),
    ul([
      "ім'я;",
      'номер телефону;',
      'email;',
      'адреса доставки або відділення перевізника;',
      'VIN або дані авто, якщо ви їх вказали.',
    ]),
    para('Автоматично:'),
    ul(['IP-адреса;', 'тип пристрою і браузера;', 'сторінки, які ви відвідали;', 'дані cookie.']),
    para(
      'Обране, порівняння та історія переглядів зберігаються у cookie вашого браузера і не передаються нам, поки ви не оформите замовлення.',
    ),
    h2('Для чого ми використовуємо дані'),
    ul([
      'Обробка і доставка замовлень;',
      "зв'язок для підтвердження замовлення та перевірки сумісності деталі;",
      "відповіді на запити з форм зворотного зв'язку;",
      'покращення роботи сайту;',
      'аналітика відвідуваності.',
    ]),
    para('Ми не надсилаємо рекламні розсилки без вашої згоди.'),
    h2('Кому ми передаємо дані'),
    ul([
      'Службам доставки («Нова пошта», Delivery) — для відправлення замовлення.',
      'Платіжним сервісам (monoPay) — для проведення оплати; дані картки ми не отримуємо і не зберігаємо.',
      'Сервісам аналітики (Google Analytics) — в знеособленому вигляді.',
    ]),
    para('Ми не продаємо персональні дані третім особам.'),
    h2('Cookie'),
    para(
      'Сайт використовує cookie для роботи кошика, обраного, порівняння, збереження обраного авто та для аналітики. Ви можете вимкнути cookie в налаштуваннях браузера, але частина функцій сайту перестане працювати.',
    ),
    h2('Зберігання та захист'),
    para(
      "Дані замовлень зберігаються протягом строку, необхідного для виконання замовлення і гарантійних зобов'язань, та відповідно до вимог законодавства. Доступ до даних мають лише співробітники, яким це потрібно для роботи. Сайт працює через захищене з'єднання HTTPS.",
    ),
    h2('Ваші права'),
    para(
      'Ви маєте право знати, які ваші дані ми зберігаємо, вимагати їх виправлення або видалення, відкликати згоду на обробку.',
    ),
    para(
      'Для цього напишіть на [email] або зателефонуйте [телефон]. Відповідаємо протягом 30 днів.',
    ),
    h2('Зміни до Політики'),
    para(
      'Ми можемо оновлювати цю Політику. Актуальна версія завжди на цій сторінці, дата оновлення вказана вгорі.',
    ),
    h2('Контакти'),
    para('ФОП [ПІБ], [адреса], Запоріжжя.'),
    para('Email: [email]. Телефон: [телефон].'),
  ])

  // Публічна оферта — structure in place; legal wording is a draft placeholder
  // pending owner/lawyer review (PROJECT_CONTEXT §1 open questions). Specifics in
  // [brackets]. Requisites are rendered from settings.fop on the page itself.
  const ofertaDoc = doc([
    h2('Загальні положення'),
    para(
      'Ця публічна оферта (далі — «Оферта») визначає умови продажу товарів на сайті [домен], власником якого є ФОП [ПІБ]. Оформлення замовлення означає повну та безумовну згоду покупця з умовами цієї Оферти. Текст Оферти — чернетка, що узгоджується.',
    ),
    h2('Предмет оферти'),
    para(
      'Продавець продає вживані автозапчастини з власної розбірки. Кожна деталь — в одному екземплярі; наявність і стан вказані в картці товару з реальними фото та позначеними дефектами.',
    ),
    h2('Ціна та оплата'),
    para(
      'Ціни вказані на сайті в гривнях. Оплата — карткою онлайн (monoPay) або готівкою при самовивозі. Для габаритних деталей можлива передплата після підтвердження замовлення. Мінімальна сума замовлення — 500 ₴.',
    ),
    h2('Доставка'),
    para(
      'Відправлення «Новою поштою» або Delivery в день замовлення при підтвердженні до 15:00 (Пн–Сб). Самовивіз — з пунктів у Запоріжжі та Дніпрі. Умови доставки габаритних деталей уточнюються менеджером.',
    ),
    h2('Повернення та обмін'),
    para(
      'Повернення та обмін — відповідно до законодавства України про захист прав споживачів. Не підлягають поверненню деталі, що були в експлуатації після продажу, та частини кузова, які різались. Умови — чернетка, уточнюються.',
    ),
    h2('Гарантія'),
    para(
      'Гарантія 14 днів на деталі, 30 днів на двигуни, КПП та агрегати, до 60 днів на відновлені. Гарантія діє за умови правильного встановлення на СТО.',
    ),
    h2('Відповідальність сторін'),
    para(
      'Продавець не несе відповідальності за неправильне встановлення деталі. Покупець відповідає за достовірність наданих даних авто для перевірки сумісності.',
    ),
    h2('Контакти та реквізити'),
    para('З питань замовлень: [телефон], [email].'),
  ])

  const PAGES: [string, string, unknown[]][] = [
    ['Головна', 'home', home],
    ['Про компанію', 'about', about],
    [
      'Контакти',
      'contacts',
      [
        {
          blockType: 'contactsBlock',
          heading: 'Контакти',
          intro: 'Два пункти видачі — Запоріжжя та Дніпро.',
          showForm: true,
        },
      ],
    ],
    ['Публічна оферта', 'oferta', [{ blockType: 'richText', content: ofertaDoc }]],
    ['Політика конфіденційності', 'policy', [{ blockType: 'richText', content: policyDoc }]],
    [
      'Сторінку не знайдено',
      '404',
      [
        {
          blockType: 'ctaText',
          heading: '404',
          text: 'Такої сторінки немає.',
          buttonLabel: 'На головну',
          buttonLink: '/',
        },
      ],
    ],
  ]
  for (const [title, slug, layout] of PAGES) {
    await upsert('pages', { slug: { equals: slug } }, { title, slug, layout, published: true })
  }
  log(`pages: ${PAGES.length}`)

  // ---------------------------------------------------------------- reviews
  const REVIEWS: [string, number, string][] = [
    ['Олександр', 5, 'Швидко знайшли деталь на L200, відправили того ж дня.'],
    ['Ірина', 5, 'Допомогли підібрати фару, все підійшло.'],
    ['СТО «Драйв»', 4, 'Беремо регулярно, зручні умови для СТО.'],
  ]
  for (const [author, rating, text] of REVIEWS) {
    await upsert(
      'reviews',
      { author: { equals: author } },
      { author, rating, text, published: true },
    )
  }
  log(`reviews: ${REVIEWS.length}`)

  log('done')
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
