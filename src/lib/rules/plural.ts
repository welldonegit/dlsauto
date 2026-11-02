/**
 * Ukrainian plural forms for "деталь" (PROJECT_CONTEXT §3: 1 деталь, 2–4 деталі,
 * 5+ деталей). Generalized so other nouns can reuse the three-form picker.
 */
export function pluralUk(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

/** "деталь / деталі / деталей" — the count word used on model and category cards. */
export function partsWord(n: number): string {
  return pluralUk(n, 'деталь', 'деталі', 'деталей')
}

/** "85 деталей" — count plus its word. */
export function partsLabel(n: number): string {
  return `${n} ${partsWord(n)}`
}
