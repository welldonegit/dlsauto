/**
 * OEM / SKU normalization for search (DEV_CONTEXT §4, §7): lower-case, strip
 * spaces, hyphens, dots. The normalized copy is stored alongside the original
 * so an OEM typed as "MR-554 321.A" matches "mr554321a".
 */
export function normalizeOem(value: string): string {
  return value.toLowerCase().replace(/[\s\-.]+/g, '')
}

/** Normalize a list, dropping blanks and duplicates (order preserved). */
export function normalizeOemList(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const n = normalizeOem(v)
    if (n && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  return out
}
