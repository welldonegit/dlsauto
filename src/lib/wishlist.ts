'use client'

import { useSyncExternalStore } from 'react'

/**
 * Wishlist ("обране") — a tiny localStorage-backed store of product ids
 * (PROJECT_CONTEXT §3). Survives reloads, syncs across tabs via the `storage`
 * event, and drives both the heart on each ProductCard and the badge in the
 * header. Compare will get its own parallel store when the compare UI lands.
 *
 * Reads go through the React hooks so components re-render on change; writes are
 * `toggle`. SSR renders the empty snapshot (no localStorage), matching the first
 * client paint, so there is no hydration mismatch.
 */

const KEY = 'dls_wishlist'
const listeners = new Set<() => void>()
let ids: Set<string> | null = null
let version = 0

function load(): Set<string> {
  if (ids) return ids
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    ids = new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    ids = new Set()
  }
  return ids
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...load()]))
  } catch {
    // storage unavailable (private mode) — keep the in-memory set
  }
  version += 1
  listeners.forEach((l) => l())
}

export function wishlistHas(id: string): boolean {
  return load().has(id)
}

export function wishlistToggle(id: string): boolean {
  const set = load()
  const next = !set.has(id)
  if (next) set.add(id)
  else set.delete(id)
  persist()
  return next
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      ids = null // force reload from the other tab's write
      version += 1
      listeners.forEach((l) => l())
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Reactive membership for one product (the heart on its card). */
export function useWishlisted(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => load().has(id),
    () => false,
  )
}

/** Reactive count for the header badge. */
export function useWishlistCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => {
      void version // tie the snapshot to the mutation counter
      return load().size
    },
    () => 0,
  )
}
