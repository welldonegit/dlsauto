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
  // name, logo basename (sortOrder follows export part counts). Every brand has
  // both a monochrome and a colour logo in the export (assets/logos + color/).
  const BRANDS: [string, string][] = [
    ['Mitsubishi', 'mitsubishi'],
    ['Ford', 'ford'],
    ['Mazda', 'mazda'],
    ['Nissan', 'nissan'],
    ['Jeep', 'jeep'],
    ['Volkswagen', 'volkswagen'],
    ['Kia', 'kia'],
    ['Hyundai', 'hyundai'],
    ['Toyota', 'toyota'],
    ['Mercedes-Benz', 'mercedes'],
    ['SsangYong', 'ssangyong'],
    ['Volvo', 'volvo'],
    ['BMW', 'bmw'],
    ['Fiat', 'fiat'],
    ['Isuzu', 'isuzu'],
    ['Peugeot', 'peugeot'],
  ]
  const brandId = new Map<string, number>()
  for (const [name, file] of BRANDS) {
    const slug = file === 'mercedes' ? 'mercedes-benz' : file
    const logoMono = await media(`assets/logos/${file}.svg`, `${name} логотип`, `${file}-mono.svg`)
    const logoColor = await media(
      `assets/logos/color/${file}.svg`,
      `${name} логотип кольоровий`,
      `${file}-color.svg`,
    )
    const id = await upsert(
      'brands',
      { slug: { equals: slug } },
      { name, slug, logoMono, logoColor, published: true },
    )
    brandId.set(name, id)
  }
  log(`brands: ${brandId.size}`)

  // ---------------------------------------------------------------- categories
  // name, slug, photo file (null = placeholder). 9 categories from the export.
  // Photos are the bento cut-out PNGs from the Головна-B export (transparent,
  // object-contain). Categories without a dedicated cut-out reuse the export's
  // own demo filler (part-pickup-hub2) — replace with real cut-outs later.
  const CATEGORIES: [string, string, string | null][] = [
    ['Двигуни', 'dviguny', 'uploads/cat-engine2 1.png'],
    ['КПП та роздатки', 'kpp-ta-rozdatky', 'uploads/2 1.png'],
    ['Підвіска та ходова', 'pidviska-ta-khodova', 'uploads/cat-suspension2 1.png'],
    ['Кузовні деталі', 'kuzovni-detali', 'uploads/part-pickup-hub2 1.png'],
    ['Оптика', 'optyka', 'uploads/part-pickup-hub2 1.png'],
    ['Електрика та електроніка', 'elektryka', 'uploads/cat-electric2 1.png'],
    ['Салон', 'salon', 'uploads/part-pickup-hub2 1.png'],
    ['Гальмівна система', 'halmivna-systema', 'uploads/part-pickup-hub2 1.png'],
    ['Шини та диски', 'shyny-ta-dysky', 'uploads/cat-wheels2 1.png'],
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
      variant: 'b',
      heading: 'Б/в запчастини, які підійдуть з першого разу',
      subheading:
        'Фото реальної запчастини, перевірка перед продажем, відправка в день замовлення.',
      background: await media('uploads/hero2.jpg', 'Фон першого екрана'),
      tiles: [
        { value: '1 200+', caption: 'деталей', icon: 'tread' },
        { value: 'до 60 днів', caption: 'гарантії', icon: 'wrench' },
        { value: '4.8', caption: 'на Prom.ua', icon: 'star' },
        { value: 'Відправка', caption: 'сьогодні', icon: 'speed' },
      ],
    },
    { blockType: 'stats', heading: 'DLSAuto в цифрах', items: statItems },
    {
      blockType: 'modelsPicker',
      heading: 'Деталі для вашого авто',
      defaultBrand: brandId.get('Mitsubishi'),
    },
    {
      blockType: 'categoriesBlock',
      heading: 'Категорії запчастин',
      variant: 'a',
      // Bento order from the Головна-B export (A layout): engine leads, then the
      // rest row by row. The first category is the 2-wide lead card.
      categories: [
        'Двигуни',
        'Кузовні деталі',
        'Підвіска та ходова',
        'Електрика та електроніка',
        'КПП та роздатки',
        'Оптика',
        'Гальмівна система',
        'Салон',
        'Шини та диски',
      ].map((n) => catId.get(n)),
      searchChips: [
        'Фара передня',
        'Бампер передній',
        'Капот',
        'Турбіна',
        'Стартер',
        'Генератор',
        'Радіатор',
        'Дзеркало',
        'Двері передні',
        'КПП',
      ].map((label) => ({ label })),
    },
    { blockType: 'newArrivals', heading: 'Нові надходження', limit: 15 },
    {
      // Same content as the "Про компанію" block (DLSServicesWide). Media is
      // loaded inline; media() dedupes by filename, so no duplicate uploads.
      blockType: 'whatElseWeDo',
      heading: 'Що ще ми робимо',
      text: 'Окрім продажу запчастин, ремонтуємо у власному сервісі — ставимо те, що самі зняли і перевірили. Викуповуємо авто після ДТП і на розбірку. Усе — в одному дворі в Запоріжжі.',
      wideImage: await media(
        'assets/contacts-gate.jpg',
        'Сіра брама з логотипом DLSAuto, вид з дороги',
        'about-gate.jpg',
      ),
      cards: [
        {
          title: 'Ремонт у власному сервісі',
          text: 'Діагностика, ходова, двигуни та агрегати. Ставимо деталі з нашої розборки',
          image: await media(
            'assets/service-sto.jpg',
            'Пікап на підйомнику в боксі',
            'svc-sto.jpg',
          ),
        },
        {
          title: 'Викуповуємо авто на розбірку',
          text: 'Биті, після ДТП, з несправним двигуном — оцінимо за фото за годину, заберемо самі по Запоріжжю та області',
          image: await media(
            'assets/service-razborka.jpg',
            'Биті авто в цеху на розбірці',
            'svc-razborka.jpg',
          ),
        },
      ],
    },
    { blockType: 'pickupsParts', heading: 'Запчастини на пікапи', limit: 12 },
    { blockType: 'suvsParts', heading: 'Запчастини на позашляховики', limit: 12 },
    {
      blockType: 'videoCheck',
      heading: 'Перевіряємо перед продажем',
      text: 'Кожна деталь — на стенді або на авто.',
    },
    { blockType: 'reviewsBlock', heading: 'Відгуки', limit: 8 },
    {
      blockType: 'faq',
      heading: 'Часті питання',
      subheading: 'Відповідаємо на те, що запитують перед замовленням',
      items: [
        {
          question: 'Як зрозуміти, що запчастина підійде на моє авто?',
          answer:
            'Оберіть марку й модель у пошуку — ми покажемо тільки ті деталі, що знято з такого ж авто. Якщо є сумніви, надішліть менеджеру фото вашої деталі та каталожний номер: перевіримо сумісність за TecDoc протягом кількох хвилин. Якщо деталь все ж не підійде — обміняємо або повернемо гроші.',
        },
        {
          question: 'Чи потрібна передплата?',
          answer:
            'Для невеликих деталей можлива оплата при отриманні. Для габаритних і дорогих позицій (двигуни, КПП, кузовні елементи) просимо невелику передплату (орієнтовно 200 ₴) — вони відправляються окремим транспортом, і це наша страховка від невикуплених відправлень. Оплатити можна карткою через monoPay, усі деталі замовлення підтверджуємо письмово до оплати.',
        },
        {
          question: 'Яка гарантія на б/в запчастини?',
          answer:
            'Залежить від категорії: на більшість деталей — 14 днів на перевірку, на двигуни, КПП та агрегати — 30 днів, на відновлені запчастини — до 60 днів. Поверненню не підлягають частини кузова, що ріжуться під замовлення (чверті, частини бамперів тощо) — це вказано в картці такого товару.',
        },
        {
          question: 'У якому стані деталі? Чи побачу я дефекти заздалегідь?',
          answer:
            'Усі запчастини знято з авто, яке ми придбали й розібрали самі. Перед продажем деталь перевіряємо на стенді або на автомобілі, а всі дефекти позначаємо білим маркером, щоб вони були видні на фото. У картці — фото саме цієї деталі, не каталожна картинка. Відео перевірки й пробіг авто-донора надішле менеджер за запитом.',
        },
        {
          question: 'Як швидко відправите замовлення?',
          answer:
            'Замовлення, підтверджені до 15:00, відправляємо того ж дня Новою поштою або Delivery. Габаритні деталі — протягом 1–2 днів. Для СТО по Запоріжжю є доставка власним транспортом.',
        },
        {
          question: 'Чи можна забрати самовивозом і подивитися деталь перед покупкою?',
          answer:
            'Так, більшість клієнтів забирають замовлення самі. Ми за адресою Запоріжжя, Південне шосе, працюємо Пн–Сб 9:00–18:00. Напишіть або зателефонуйте перед приїздом — відкладемо деталь і підготуємо її до огляду.',
        },
      ],
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
  ]

  // About-page media. The six people reuse three export headshots (placeholders
  // — swap for real photos later); the gate, workshop/service and review photos
  // are the export assets.
  const teamWorkshop = await media(
    'assets/about-ceh.jpg',
    'Цех у Запоріжжі, Південне шосе',
    'about-team-ceh.jpg',
  )
  const teamP1 = await media(
    'assets/team-mechanic1.jpg',
    'Майстер біля двигуна на стенді',
    'team-p1.jpg',
  )
  const teamP2 = await media(
    'assets/team-mechanic2.jpg',
    'Майстер зі схрещеними руками в цеху',
    'team-p2.jpg',
  )
  const teamP3 = await media(
    'assets/team-mechanic3.jpg',
    'Майстер з ключем біля пікапа',
    'team-p3.jpg',
  )
  const gatePhoto = await media(
    'assets/contacts-gate.jpg',
    'Сіра брама з логотипом DLSAuto, вид з дороги',
    'about-gate.jpg',
  )
  const svcSto = await media('assets/service-sto.jpg', 'Пікап на підйомнику в боксі', 'svc-sto.jpg')
  const svcRazborka = await media(
    'assets/service-razborka.jpg',
    'Биті авто в цеху на розбірці',
    'svc-razborka.jpg',
  )
  const reviewHub = await media(
    'assets/part-hub.webp',
    'Фото з відгуку: маточина на столі',
    'review-hub.webp',
  )
  const reviewEngine = await media(
    'assets/part-pickup-hub.jpg',
    'Фото з відгуку: двигун на піддоні',
    'review-engine.jpg',
  )
  const reviewBumper = await media(
    'assets/part-hub.webp',
    'Фото з відгуку: бампер в упаковці',
    'review-bumper.webp',
  )

  const about = [
    {
      blockType: 'aboutHero',
      heading: 'Самі купуємо. Самі розбираємо.\nСамі відповідаємо.',
      text: 'DLSAuto — авторозбірка в Запоріжжі. Купуємо авто після ДТП, перевіряємо кожну деталь і фотографуємо її з усіма дефектами.',
    },
    { blockType: 'stats', heading: 'DLSAuto в цифрах', items: statItems },
    {
      blockType: 'partPath',
      heading: 'Від битого авто до вашої посилки',
      steps: [
        {
          title: 'Купуємо авто',
          text: 'Купуємо авто після ДТП цілком. Тому знаємо пробіг, рік і що саме з ним сталося.',
        },
        {
          title: 'Розбираємо',
          text: 'Розбираємо самі. Кожна деталь отримує свій номер і прив’язку до авто-донора.',
        },
        {
          title: 'Перевіряємо',
          text: 'Двигуни і коробки запускаємо на стенді, оптику та електрику перевіряємо на авто. Знімаємо відео.',
        },
        {
          title: 'Позначаємо дефекти',
          text: 'Кожну подряпину обводимо білим маркером перед фото. Ви бачите стан до оплати, а не після.',
        },
        {
          title: 'Публікуємо',
          text: 'Публікуємо з реальними фото, ціною та гарантією. Відео перевірки — в картці.',
        },
        {
          title: 'Відправляємо',
          text: 'Відправляємо в день замовлення Новою поштою або Delivery. По Запоріжжю — самовивіз або доставка в бокс СТО.',
        },
      ],
    },
    {
      blockType: 'whatElseWeDo',
      heading: 'Що ще ми робимо',
      text: 'Окрім продажу запчастин, ремонтуємо у власному сервісі — ставимо те, що самі зняли і перевірили. Викуповуємо авто після ДТП і на розбірку. Усе — в одному дворі в Запоріжжі.',
      wideImage: gatePhoto,
      cards: [
        {
          title: 'Ремонт у власному сервісі',
          text: 'Діагностика, ходова, двигуни та агрегати. Ставимо деталі з нашої розборки',
          image: svcSto,
        },
        {
          title: 'Викуповуємо авто на розбірку',
          text: 'Биті, після ДТП, з несправним двигуном — оцінимо за фото за годину, заберемо самі по Запоріжжю та області',
          image: svcRazborka,
        },
      ],
    },
    {
      blockType: 'team',
      heading: 'Хто розбирає ваше авто',
      lead: teamWorkshop,
      leadCaption: 'Запоріжжя, Південне шосе',
      members: [
        { photo: teamP1, name: 'Дмитро', role: 'Перевірка двигунів і КПП' },
        { photo: teamP2, name: 'Олена', role: 'Менеджер, підбір і сумісність' },
        { photo: teamP3, name: 'Андрій', role: 'Розбирання' },
        { photo: teamP1, name: 'Сергій', role: 'Фото і опис деталей' },
        { photo: teamP3, name: 'Ігор', role: 'Пакування і відправка' },
        { photo: teamP2, name: 'Максим', role: 'Приймання авто' },
      ],
    },
    { blockType: 'reviewsBlock', heading: 'Відгуки покупців', limit: 8 },
    {
      blockType: 'ctaText',
      heading: 'Зв’яжіться з нами',
      text: 'Питання щодо деталей, пропозиції про співпрацю або просто хочете уточнити наявність — напишіть, і ми відповімо протягом робочого дня',
      address: 'Запоріжжя, Південне шосе · Пн–Сб 9:00–18:00',
      buttonLabel: 'Написати нам',
      buttonLink: '/contacts',
      linkLabel: 'або зателефонувати: +380 98 640 13 57',
      linkHref: 'tel:+380986401357',
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
  // [author, rating, text, photo (media id | null), date]. Copy + photos from
  // the Claude Design export; dates drive the newest-first order and the shown
  // date. Three carry a placeholder photo (swap for the real part shots later).
  const REVIEWS: [string, number, string, number | null, string][] = [
    [
      'Олександр',
      5,
      'Замовляв фару на Ranger, переживав через стан — на фото маркером були позначені дві подряпини, у реалі так і є, нічого зайвого. Поставив, працює. Відправили в той же день.',
      reviewHub,
      '2026-09-28',
    ],
    [
      'Віталій, СТО «АвтоМайстер»',
      5,
      'СТО з Дніпра, беремо запчастини для клієнтів регулярно. Привозять самі, якщо деталь не підходить — міняють без питань. Це головне.',
      null,
      '2026-09-21',
    ],
    [
      'Андрій',
      4,
      'Двигун на Навару приїхав з відео запуску і пробігом донора. Один мінус — довго погоджували передплату, але це моя обережність, не їхня.',
      reviewEngine,
      '2026-09-14',
    ],
    [
      'Дмитро',
      5,
      'Шукав дзеркало на Grand Cherokee по всій Україні, тут було в наявності. Менеджер за 5 хвилин перевірив, чи підійде на мій рік.',
      null,
      '2026-09-09',
    ],
    [
      'Сергій',
      5,
      'Забирав самовивозом, показали деталь до оплати, дали оглянути. Нормальні люди, не перший раз вже.',
      null,
      '2026-09-02',
    ],
    [
      'Ігор',
      5,
      'Бампер прийшов у плівці, без нових пошкоджень. Ціна в півтора рази нижча за нову копію, стан кращий.',
      reviewBumper,
      '2026-08-27',
    ],
  ]
  // Reviews are fully owned by this seed — reset to exactly the export set so
  // earlier placeholder authors don't linger and inflate the count.
  await payload.delete({ collection: 'reviews', where: { id: { exists: true } } })
  for (const [author, rating, text, photo, date] of REVIEWS) {
    await upsert(
      'reviews',
      { author: { equals: author } },
      {
        author,
        rating,
        text,
        published: true,
        createdAt: `${date}T10:00:00.000Z`,
        ...(photo ? { photo } : {}),
      },
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
