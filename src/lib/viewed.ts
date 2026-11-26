'use client'

/**
 * Recently-viewed products ("Ви дивилися") — a localStorage list of SKUs,
 * most-recent first, capped (PROJECT_CONTEXT §3). Written when a product page
 * mounts; read by the DLSRecent rail. No reactive hook: the rail snapshots once
 * on mount (and records the current product after snapshotting, so the current
 * item never appears in its own «Ви дивилися»).
 */

const KEY = 'dls_viewed'
const CAP = 24

function load(): string[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function save(list: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // storage unavailable (private mode) — ignore
  }
}

/** Current viewed SKUs, most-recent first. */
export function viewedItems(): string[] {
  return load()
}

/** Record a view: move the SKU to the front, cap the list. */
export function viewedAdd(sku: string): void {
  const next = [sku, ...load().filter((s) => s !== sku)].slice(0, CAP)
  save(next)
}
