/**
 * Client-safe shapes for the compare table (no server imports). The server
 * loader lives in `compareData.ts`; the client component imports only this.
 */

export type CompareColumn = {
  id: string // sku
  href: string
  name: string
  photo: string | null
  price: number
  priceLabel: string
  sold: boolean
  // row values
  donor: string
  oem: string
  side: string
  cond: string
  km: string
  warranty: string
  check: string
  video: string
  stock: string
  cat: string
}

export type CompareData = { columns: CompareColumn[] }

/** Table rows, in display order (label + key into CompareColumn). */
export const COMPARE_ROWS: { label: string; key: keyof CompareColumn }[] = [
  { label: 'Авто-донор', key: 'donor' },
  { label: 'Артикул OEM', key: 'oem' },
  { label: 'Сторона', key: 'side' },
  { label: 'Стан', key: 'cond' },
  { label: 'Пробіг донора', key: 'km' },
  { label: 'Гарантія', key: 'warranty' },
  { label: 'Перевірка', key: 'check' },
  { label: 'Відео перевірки', key: 'video' },
  { label: 'Наявність', key: 'stock' },
  { label: 'Категорія', key: 'cat' },
]
