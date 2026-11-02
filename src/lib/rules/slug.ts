/**
 * Slug generation with Ukrainian → Latin transliteration (DEV_CONTEXT §4:
 * "slug из name с транслитерацией uk→latin"). Pure and testable; used by the
 * Payload slug field hook and by the seed script.
 */

// Ukrainian first, Russian extras folded in so imported ru-only names also slugify.
const MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
  // Russian-only letters (fallback for imports)
  ё: 'e',
  ъ: '',
  ы: 'y',
  э: 'e',
}

export function transliterate(input: string): string {
  let out = ''
  for (const ch of input.toLowerCase()) {
    out += ch in MAP ? MAP[ch] : ch
  }
  return out
}

export function slugify(input: string): string {
  return transliterate(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
