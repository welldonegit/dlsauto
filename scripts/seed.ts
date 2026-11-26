import './load-env'

import { readFileSync } from 'fs'
import path from 'path'

import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'

import { CATEGORIES, PART_TYPES, MODELS, type SpecTemplateEntry } from './seed/catalog-reference'

/**
 * Database seed (DEV_CONTEXT §4–6, CATALOG_PLAN). Reference data comes strictly
 * from docs/products: the 9 categories with their characteristic templates, the
 * 107 part types (with side rule, broad flag and "з цим купують" links), the 37
 * models (twins as separate records, compatibility via alsoFits). Products are
 * ~26 real in-stock items from the Prom export, curated to exercise the matching
 * rules; they live in scripts/seed/fixtures/prom-sample.json (+ photos/), built
 * once offline. Idempotent — re-running upserts by natural key, never duplicates.
 *
 * Run: `pnpm db:seed` (needs DATABASE_URL + PAYLOAD_SECRET).
 */

const EXPORT = path.resolve('docs/design-export')
const FIX = path.resolve('scripts/seed/fixtures')

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
}

type FixtureProduct = {
  sku: string
  promId: string
  name: { uk: string; ru: string }
  partType: string
  position: string
  model: string | null
  alsoFits: string[]
  donor: string | null
  oem: string[]
  crossNumbers?: string[]
  price: number
  conditionLabel: string
  conditionText: { uk: string; ru: string }
  warrantyDays: number
  quantity: number
  status: string
  inReserve?: number
  photos: string[]
  searchKeywords: { uk: string; ru: string }
  specValues: { key: string; label: string; value: string }[]
  featured?: boolean
  discountPercent?: number
  pinnedNew?: boolean
  receivedAt?: string
  _demo_defectFromPhoto?: boolean
}

async function run(): Promise<void> {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(`[seed] ${m}`)

  // ---------------------------------------------------------------- helpers
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
  async function mediaFrom(
    baseDir: string,
    relPath: string,
    alt: string,
    name?: string,
  ): Promise<number> {
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
    const buf = readFileSync(path.resolve(baseDir, relPath))
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
  const media = (relPath: string, alt: string, name?: string) =>
    mediaFrom(EXPORT, relPath, alt, name)
  const fixturePhoto = (fn: string, alt: string) => mediaFrom(path.join(FIX, 'photos'), fn, alt)

  // ---------------------------------------------------------------- brands
  // Brands are exactly those present in the 37 models. Logo basenames from the
  // export (mono + colour). Great Wall has no logo asset in the export yet —
  // seeded logo-less (open question for the owner).
  const LOGO: Record<string, string | null> = {
    Mitsubishi: 'mitsubishi',
    Ford: 'ford',
    Mazda: 'mazda',
    Nissan: 'nissan',
    Jeep: 'jeep',
    Volkswagen: 'volkswagen',
    Kia: 'kia',
    Hyundai: 'hyundai',
    Toyota: 'toyota',
    'Mercedes-Benz': 'mercedes',
    SsangYong: 'ssangyong',
    Volvo: 'volvo',
    BMW: 'bmw',
    Fiat: 'fiat',
    Isuzu: 'isuzu',
    Peugeot: 'peugeot',
    'Great Wall': null,
  }
  const brandNames = [...new Set(MODELS.map((m) => m.brand))]
  const brandId = new Map<string, number>()
  let bi = 0
  for (const name of brandNames) {
    const file = LOGO[name]
    const slug =
      file === 'mercedes' ? 'mercedes-benz' : (file ?? name.toLowerCase().replace(/\s+/g, '-'))
    const data: Record<string, unknown> = { name, slug, sortOrder: bi, published: true }
    if (file) {
      data.logoMono = await media(`assets/logos/${file}.svg`, `${name} логотип`, `${file}-mono.svg`)
      data.logoColor = await media(
        `assets/logos/color/${file}.svg`,
        `${name} логотип кольоровий`,
        `${file}-color.svg`,
      )
    }
    brandId.set(name, await upsert('brands', { slug: { equals: slug } }, data))
    bi += 1
  }
  log(`brands: ${brandId.size}`)

  // ---------------------------------------------------------------- categories
  // 9 categories (CATALOG_PLAN §6) with specTemplate (dovidnyk «Характеристики»).
  // Photos are the export bento cut-outs / placeholders — real cut-outs later.
  const CAT_PHOTO: Record<string, string> = {
    dvyguny: 'uploads/cat-engine2 1.png',
    'kuzovni-detali': 'uploads/part-pickup-hub2 1.png',
    'pidviska-ta-khodova': 'uploads/cat-suspension2 1.png',
    'navisni-agregaty': 'uploads/cat-electric2 1.png',
    'kpp-ta-rozdatky': 'uploads/2 1.png',
    'palyvna-aparatura': 'uploads/cat-engine2 1.png',
    'navisne-obladnannya': 'uploads/part-pickup-hub2 1.png',
    'shyny-ta-dysky': 'uploads/cat-wheels2 1.png',
    inshe: 'uploads/part-pickup-hub2 1.png',
  }
  const catId = new Map<string, number>() // slug → id

  /** Build specTemplate payload; resolve requiredForTypes via ptResolver if given. */
  function specTemplate(
    entries: SpecTemplateEntry[],
    ptResolver?: (name: string) => number | undefined,
  ): Record<string, unknown>[] {
    return entries.map((e) => ({
      key: e.key,
      name: e.name,
      type: e.type,
      ...(e.unit ? { unit: e.unit } : {}),
      required: !!e.required,
      ...(e.options ? { options: e.options.map((value) => ({ value })) } : {}),
      ...(ptResolver && e.requiredForTypes
        ? {
            requiredForTypes: e.requiredForTypes
              .map((n) => ptResolver(n))
              .filter((x): x is number => x != null),
          }
        : {}),
    }))
  }

  // CATEGORIES is in the client's Р51 site display order (Двигуни, Кузовні, Підвіска,
  // Навісні агрегати, КПП, Паливна, Навісне обладнання, Шини та диски, Інше). The
  // collection is `orderable` → created rows get a sequential `_order`, so insertion
  // order IS the site order; getCategoryTree / catalog facets sort by `_order`.
  for (const c of CATEGORIES) {
    const photo = CAT_PHOTO[c.slug]
      ? await media(CAT_PHOTO[c.slug], `${c.name} — фото категорії`)
      : undefined
    const id = await upsert(
      'categories',
      { slug: { equals: c.slug } },
      {
        name: c.name,
        slug: c.slug,
        ...(photo ? { photo } : {}),
        specTemplate: specTemplate(c.specTemplate), // requiredForTypes added below
        published: true,
      },
    )
    catId.set(c.slug, id)
  }
  log(`categories: ${catId.size}`)

  // ---------------------------------------------------------------- part types
  // 107 types (dovidnyk). relatedTypes resolved in a second pass once all ids
  // exist. Natural key = name (unique in the reference).
  const ptId = new Map<string, number>() // name → id
  for (const t of PART_TYPES) {
    const id = await upsert(
      'part-types',
      { name: { equals: t.name } },
      {
        name: t.name,
        category: catId.get(t.categorySlug),
        positionRule: t.positionRule,
        broad: t.broad,
      },
    )
    ptId.set(t.name, id)
  }
  // Second pass: "з цим купують" links.
  for (const t of PART_TYPES) {
    if (!t.related.length) continue
    await payload.update({
      collection: 'part-types',
      id: ptId.get(t.name)!,
      data: {
        relatedTypes: t.related
          .filter((r) => ptId.has(r.type))
          .map((r) => ({ type: ptId.get(r.type), side: r.side })),
      },
    })
  }
  // Fill categories' requiredForTypes now that part type ids exist.
  for (const c of CATEGORIES) {
    if (!c.specTemplate.some((e) => e.requiredForTypes?.length)) continue
    await payload.update({
      collection: 'categories',
      id: catId.get(c.slug)!,
      data: { specTemplate: specTemplate(c.specTemplate, (n) => ptId.get(n)) },
    })
  }
  log(`part types: ${ptId.size} (broad ${PART_TYPES.filter((t) => t.broad).length})`)

  // ---------------------------------------------------------------- models
  // 37 generations (twins as separate records, Р11). Compatibility via alsoFits
  // in a second pass once ids exist.
  const modelId = new Map<string, number>() // slug → id
  for (const m of MODELS) {
    const id = await upsert(
      'models',
      { slug: { equals: m.slug } },
      {
        brand: brandId.get(m.brand),
        name: m.name,
        slug: m.slug,
        ...(m.gen ? { generation: m.gen } : {}),
        ...(m.from ? { yearFrom: m.from } : {}),
        ...(m.to ? { yearTo: m.to } : {}),
        bodyType: m.body,
        ...(m.twinName ? { twinName: m.twinName } : {}),
        published: true,
      },
    )
    modelId.set(m.slug, id)
  }
  // Twin compatibility (Navara↔Pathfinder, Ranger↔BT-50) lives on products via
  // `alsoFits` (Р11), not on the model — the model only carries `twinName`.
  log(`models: ${modelId.size}`)

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
      schedule: { dayFrom: '1', dayTo: '6', openHour: null, closeHour: null },
      mapCoords: { lat: 48.4647, lng: 35.0462 },
      isDefault: false,
    },
  )
  log('pickup points: 2')

  // ---------------------------------------------------------------- lexical builders
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

  // ---------------------------------------------------------------- donors
  // Created from the fixture ("№ авто" labels), model resolved by slug (Р41).
  const donorId = new Map<string, number>()
  const fixture = JSON.parse(
    readFileSync(path.join(FIX, 'prom-sample.json'), 'utf8'),
  ) as FixtureProduct[]
  for (const p of fixture) {
    if (!p.donor || donorId.has(p.donor) || !p.model) continue
    const id = await upsert(
      'donors',
      { label: { equals: p.donor } },
      { label: p.donor, model: modelId.get(p.model) },
    )
    donorId.set(p.donor, id)
  }
  log(`donors: ${donorId.size}`)

  // ---------------------------------------------------------------- products
  // ~26 curated real products from the Prom export (fixture). category is derived
  // from partType by the collection hook. ru values set via a localized update.
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9a-яіїєґ]+/giu, '-')
      .replace(/^-+|-+$/g, '')
  let n = 0
  for (const p of fixture) {
    const photos: number[] = []
    for (const fn of p.photos) photos.push(await fixturePhoto(fn, p.name.uk))
    const partType = ptId.get(p.partType)
    if (!partType) {
      log(`! unknown partType "${p.partType}" for ${p.sku} — skipped`)
      continue
    }
    const data: Record<string, unknown> = {
      sku: p.sku,
      promId: p.promId,
      name: p.name.uk,
      slug: slugify(`${p.name.uk}-${p.sku}`),
      partType,
      ...(p.position && p.position !== 'none' ? { position: p.position } : { position: 'none' }),
      ...(p.model ? { model: modelId.get(p.model) } : {}),
      ...(p.alsoFits.length
        ? { alsoFits: p.alsoFits.map((s) => modelId.get(s)).filter(Boolean) }
        : {}),
      ...(p.donor ? { donor: donorId.get(p.donor) } : {}),
      oem: p.oem.map((number) => ({ number })),
      ...(p.crossNumbers?.length
        ? { crossNumbers: p.crossNumbers.map((number) => ({ number })) }
        : {}),
      description: richText(`${p.name.uk}. Знято з авто-донора, перевірено перед продажем.`),
      conditionLabel: p.conditionLabel,
      conditionText: p.conditionText.uk,
      ...(p._demo_defectFromPhoto && photos.length > 1 ? { defectPhotos: [photos[1]] } : {}),
      specValues: p.specValues.map((s) => ({ key: s.key, label: s.label, value: s.value })),
      photos,
      price: p.price,
      ...(p.discountPercent ? { discountPercent: p.discountPercent } : {}),
      warrantyDays: p.warrantyDays,
      quantity: p.quantity,
      ...(p.inReserve ? { inReserve: p.inReserve } : {}),
      status: p.status,
      pickupPoint: zp,
      ...(p.receivedAt ? { receivedAt: `${p.receivedAt}T10:00:00.000Z` } : {}),
      ...(p.featured ? { featured: true } : {}),
      ...(p.pinnedNew ? { pinnedNew: true } : {}),
      searchKeywords: p.searchKeywords.uk,
    }
    const id = await upsert('products', { sku: { equals: p.sku } }, data)
    // ru localized fields. specValues are localized+required, so a single-locale
    // write must carry them (values are mostly language-neutral — reuse uk).
    await payload.update({
      collection: 'products',
      id,
      locale: 'ru',
      data: {
        name: p.name.ru,
        conditionText: p.conditionText.ru,
        searchKeywords: p.searchKeywords.ru,
        specValues: p.specValues.map((s) => ({ key: s.key, label: s.label, value: s.value })),
      } as never,
    })
    n += 1
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
      quickView: {
        services: [
          'Відправка в день замовлення',
          'Обмін або повернення, якщо не підійшла',
          'Оплата при отриманні або monoPay',
        ].join('\n'),
      },
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
      value: '17',
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
        { value: '1 200+', caption: 'деталей', icon: 'tread' },
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
      // «Гарячі пропозиції» banner slider (Р55, DLSAuto-Головна-B). Placeholder
      // cards (no images yet) — the client uploads 1040×480 banners in the admin;
      // titles/subtitles are the export's demo content.
      blockType: 'hotOffers',
      heading: 'Гарячі пропозиції',
      items: [
        { title: 'Чорна п’ятниця', subtitle: 'Знижки на запчастини до кінця тижня' },
        { title: 'Ford Ranger', subtitle: 'Нові надходження з розборки' },
        { title: 'Фари та ліхтарі', subtitle: 'Перевірені, з фото кожної деталі' },
        { title: 'Mitsubishi L200', subtitle: 'Кузов, підвіска, двигун' },
        { title: 'Гарантія до 60 днів', subtitle: 'На двигуни та КПП' },
        { title: 'Відправка сьогодні', subtitle: 'Нова пошта по всій Україні' },
      ],
    },
    {
      blockType: 'categoriesBlock',
      heading: 'Категорії запчастин',
      variant: 'a',
      // Bento order = the client's Р51 site order (Двигуни leads as the 2-wide card,
      // then the rest row by row). Mirrors categories.sortOrder.
      categories: [
        'dvyguny',
        'kuzovni-detali',
        'pidviska-ta-khodova',
        'navisni-agregaty',
        'kpp-ta-rozdatky',
        'palyvna-aparatura',
        'navisne-obladnannya',
        'shyny-ta-dysky',
        'inshe',
      ].map((s) => catId.get(s)),
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
    {
      blockType: 'pickupsParts',
      heading: 'Запчастини на пікапи',
      subheading: 'Б/в оригінальні деталі на L200, Ranger та Navara',
      limit: 12,
      video: await media('uploads/puckup-truck1.mp4', 'Пікап на бездоріжжі', 'pickup-banner.mp4'),
    },
    {
      blockType: 'suvsParts',
      heading: 'Запчастини на позашляховики',
      subheading: 'Б/в оригінальні деталі на Pajero, X-Trail та Grand Cherokee',
      limit: 12,
      video: await media('uploads/suv.mp4', 'Позашляховик на бездоріжжі', 'suv-banner.mp4'),
    },
    {
      blockType: 'videoCheck',
      heading: 'Перевіряємо перед продажем',
      text: 'Знімаємо запуск двигунів, роботу агрегатів і стан деталей.',
      videos: [
        {
          video: await media('uploads/video1.mp4', 'Запуск двигуна на стенді', 'video1.mp4'),
          badge: 'Запуск двигуна',
          duration: '0:58',
        },
        {
          video: await media('uploads/video2.mp4', 'Тест АКПП на стенді', 'video2.mp4'),
          badge: 'Тест на стенді',
          duration: '0:42',
        },
        {
          video: await media(
            'uploads/video3.mp4',
            'Огляд фари з позначеними дефектами',
            'video3.mp4',
          ),
          badge: 'Огляд деталі',
          duration: '0:24',
        },
        {
          video: await media('uploads/video4.mp4', 'Перевірка стартера', 'video4.mp4'),
          badge: 'Тест на стенді',
          duration: '0:31',
        },
        {
          video: await media(
            'uploads/video5.mp4',
            'Огляд бампера з маркуванням дефектів',
            'video5.mp4',
          ),
          badge: 'Огляд деталі',
          duration: '0:19',
        },
      ],
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
          label: 'Відправка',
          badge: 'замовлення до 15:00',
          shipDay: true,
          icon: 'tread',
          note: 'Підтверджуємо замовлення дзвінком',
          tag: 'Пн–Сб 9–18',
          pairs: [
            { k: 'Перевізники', v: 'Нова пошта, Delivery' },
            { k: 'Габаритні', v: '1–2 дні' },
            { k: 'Самовивіз', v: 'Запоріжжя' },
          ],
        },
        {
          label: 'Оплата',
          badge: 'monoPay',
          value: 'Карткою',
          icon: 'card',
          note: 'Платіжні дані не зберігаємо',
          tag: 'Безпечно',
          pairs: [
            { k: 'Онлайн', v: 'Visa, Mastercard, Apple Pay, Google Pay' },
            { k: 'Готівкою', v: 'При самовивозі' },
            { k: 'Габаритні', v: 'Передплата' },
          ],
        },
        {
          label: 'Гарантія',
          badge: 'до 60 днів',
          value: '14 / 30 / 60',
          icon: 'wrench',
          note: 'Не підійшла — обмін або повернення',
          tag: 'Гарантовано',
          pairs: [
            { k: 'Більшість деталей', v: '14 днів' },
            { k: 'Двигуни, КПП', v: '30 днів' },
            { k: 'Відновлені', v: '60 днів' },
          ],
        },
      ],
    },
  ]

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

  // Home SEO (uk + ru) — drives "/" <title>/description + canonical/hreflang (§8).
  const homeDoc = (
    await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      limit: 1,
      depth: 0,
    })
  ).docs[0]
  if (homeDoc) {
    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      data: {
        seoTitle: 'DLSAuto — вживані автозапчастини з власної розбірки',
        seoDescription:
          'Б/в запчастини на пікапи та позашляховики з власної авторозбірки — перевірені, з фото реальної деталі. Відправка в день замовлення. Запоріжжя та Дніпро.',
      },
    })
    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale: 'ru',
      data: {
        title: 'Главная',
        seoTitle: 'DLSAuto — б/у автозапчасти с собственной разборки',
        seoDescription:
          'Б/у запчасти на пикапы и внедорожники с собственной авторазборки — проверенные, с фото реальной детали. Отправка в день заказа. Запорожье и Днепр.',
      },
    })
  }

  // ---------------------------------------------------------------- reviews
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
