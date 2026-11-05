'use client'

import { useSyncExternalStore } from 'react'

/**
 * Selected car ("моє авто") — the model the visitor picked in the hero car
 * selector (PROJECT_CONTEXT §3). Stored in a cookie so it survives reloads;
 * drives the "Підходить на ваше авто" pill on cards and the "Показуємо новинки
 * на …" filter in New Arrivals. Reactive via the hooks below.
 *
 * SSR renders no car (the empty server snapshot), matching the first client
 * paint, so there is no hydration mismatch; the cookie is read right after.
 */

export type SelectedCar = { slug: string; label: string }

const KEY = 'dls_car'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const listeners = new Set<() => void>()
let car: SelectedCar | null | undefined // undefined = not read yet

function read(): SelectedCar | null {
  if (car !== undefined) return car
  try {
    const m = document.cookie.match(/(?:^|; )dls_car=([^;]*)/)
    car = m ? (JSON.parse(decodeURIComponent(m[1])) as SelectedCar) : null
  } catch {
    car = null
  }
  return car
}

function write(next: SelectedCar | null) {
  car = next
  try {
    document.cookie = next
      ? `${KEY}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${MAX_AGE}; samesite=lax`
      : `${KEY}=; path=/; max-age=0; samesite=lax`
  } catch {
    // cookies unavailable — keep the in-memory value
  }
  listeners.forEach((l) => l())
}

export function setSelectedCar(next: SelectedCar) {
  write(next)
}
export function clearSelectedCar() {
  write(null)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reactive selected car (null when none). */
export function useSelectedCar(): SelectedCar | null {
  return useSyncExternalStore(
    subscribe,
    () => read(),
    () => null,
  )
}
