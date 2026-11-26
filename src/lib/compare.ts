'use client'

import { useSyncExternalStore } from 'react'

/**
 * Compare ("порівняння") — a localStorage-backed store of product ids, parallel
 * to the wishlist (PROJECT_CONTEXT §3, DEV_CONTEXT §5). Drives the «Порівняти всі»
 * action in DLSRecommend, the header badge, and the /compare page. Survives
 * reloads, syncs across tabs via `storage`. SSR renders the empty snapshot to
 * match the first client paint (no hydration mismatch). Mirrors `wishlist.ts`.
 */

const KEY = 'dls_compare'
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

export function compareHas(id: string): boolean {
  return load().has(id)
}

export function compareToggle(id: string): boolean {
  const set = load()
  const next = !set.has(id)
  if (next) set.add(id)
  else set.delete(id)
  persist()
  return next
}

/** Explicit add/remove — «Порівняти всі» adds, the compare page removes. */
export function compareSet(id: string, on: boolean): void {
  const set = load()
  if (on) set.add(id)
  else set.delete(id)
  persist()
}

/** All compared ids (for the /compare page). */
export function compareItems(): string[] {
  return [...load()]
}

/** Clear the whole compare set («Очистити все»). */
export function compareClear(): void {
  load().clear()
  persist()
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

/** Reactive membership for one product (the compare toggle on a card/row). */
export function useCompared(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => load().has(id),
    () => false,
  )
}

/** Reactive count for the header badge. */
export function useCompareCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => {
      void version // tie the snapshot to the mutation counter
      return load().size
    },
    () => 0,
  )
}

/** Reactive id list for the /compare page. */
export function useCompareItems(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      void version
      return [...load()]
    },
    () => EMPTY,
  )
}

const EMPTY: string[] = []
