import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * Cached Payload Local API client. getPayload already memoizes by config, but we
 * hold the promise so concurrent callers share one init. Used only server-side
 * (data layer, seed, worker) — never import from a client component.
 */
let cached: Promise<Payload> | null = null

export function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = getPayload({ config })
  return cached
}
