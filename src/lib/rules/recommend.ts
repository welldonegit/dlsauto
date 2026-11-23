/**
 * Recommendation engine (DEV_CONTEXT §5 §12–13, CATALOG_PLAN §10–13). Pure
 * functions over in-memory candidate pools — the data layer fetches the pool
 * (in-stock, with the fields below) and calls these; unit-tested on fixtures.
 *
 * - Альтернативи (§12, Р44/Р35/Р10/Р49): same OEM within the same type (Р44),
 *   or same type + compatible position + compatible model; broad types → OEM
 *   only (Р35); wheels → by size, not model (Р49). Sort: checked first, then
 *   price. ≤6.
 * - З цим купують (§13, Р37/Р45): partType.relatedTypes with a side condition
 *   (same / opposite / any); donor first, then model. ≤3.
 * - Ще з цього авто (§10, Р50): same donor; fallback same model, category-first. ≤8.
 *
 * Manual pins (`alternatives[]`, `boughtTogether[]`) are applied by the caller
 * on top of these results. Sold/reserved never appear (pool is in-stock only).
 */
import { decompose, oppositePosition, positionMatch, type Position } from './position'

export type SideCond = 'same' | 'opposite' | 'any'

export type RecoProduct = {
  id: number
  partTypeId: number
  broad: boolean
  position: Position | null
  modelId: number | null
  alsoFitsIds: number[]
  donorId: number | null
  categoryId: number | null
  oem: string[] // normalized
  conditionLabel: string
  price: number
  /** Size key for wheels (diameter+PCD / tire size) — Р49; null for non-wheels. */
  wheelKey?: string | null
}

const CHECKED = 'used_checked'

/** Model compatibility: the two parts share a model (via model or alsoFits). */
function modelCompat(a: RecoProduct, b: RecoProduct): boolean {
  const A = new Set<number>([...(a.modelId != null ? [a.modelId] : []), ...a.alsoFitsIds])
  if (!A.size) return false
  if (b.modelId != null && A.has(b.modelId)) return true
  return b.alsoFitsIds.some((m) => A.has(m))
}

function shareOem(a: RecoProduct, b: RecoProduct): boolean {
  if (!a.oem.length || !b.oem.length) return false
  const set = new Set(a.oem)
  return b.oem.some((o) => set.has(o))
}

/** checked first, then cheapest. */
function byConditionThenPrice(a: RecoProduct, b: RecoProduct): number {
  const ca = a.conditionLabel === CHECKED ? 0 : 1
  const cb = b.conditionLabel === CHECKED ? 0 : 1
  return ca !== cb ? ca - cb : a.price - b.price
}

export function alternatives(target: RecoProduct, pool: RecoProduct[], limit = 6): RecoProduct[] {
  const others = pool.filter((p) => p.id !== target.id)

  // Wheels (Р49): match by size key within the same type, ignore model/OEM.
  if (target.wheelKey) {
    return others
      .filter(
        (p) => p.partTypeId === target.partTypeId && p.wheelKey && p.wheelKey === target.wheelKey,
      )
      .sort(byConditionThenPrice)
      .slice(0, limit)
  }

  // OEM within the SAME type + compatible position (Р44).
  const byOem = others.filter(
    (p) =>
      p.partTypeId === target.partTypeId &&
      shareOem(target, p) &&
      positionMatch(target.position, p.position),
  )

  // Broad types: OEM only (Р35).
  if (target.broad) return byOem.sort(byConditionThenPrice).slice(0, limit)

  // Else also: same type + compatible position + compatible model.
  const byTypeModel = others.filter(
    (p) =>
      p.partTypeId === target.partTypeId &&
      positionMatch(target.position, p.position) &&
      modelCompat(target, p),
  )

  const seen = new Set<number>()
  const merged = [...byOem, ...byTypeModel].filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
  return merged.sort(byConditionThenPrice).slice(0, limit)
}

export type RelatedType = { typeId: number; side: SideCond }

function sideOf(pos: Position | null) {
  return decompose(pos).side
}

/** Does candidate satisfy the side condition relative to the target? */
function sideMatches(target: RecoProduct, cand: RecoProduct, side: SideCond): boolean {
  if (side === 'any') return true
  const ts = sideOf(target.position)
  if (side === 'same') return ts === 'any' || sideOf(cand.position) === ts
  // opposite: candidate sits on the mirror side of the target (Р45 — within the
  // same sub-type, which is already a distinct partType).
  const opp = oppositePosition(target.position)
  if (opp == null) return false
  return sideOf(cand.position) === sideOf(opp)
}

export function boughtTogether(
  target: RecoProduct,
  pool: RecoProduct[],
  related: RelatedType[],
  limit = 3,
): RecoProduct[] {
  const relBySide = new Map<number, SideCond>()
  for (const r of related) relBySide.set(r.typeId, r.side)

  const candidates = pool.filter(
    (p) =>
      p.id !== target.id &&
      relBySide.has(p.partTypeId) &&
      sideMatches(target, p, relBySide.get(p.partTypeId)!),
  )

  // Donor first, then the rest (same model); keep each partType once per side.
  const donorFirst = [
    ...candidates.filter((p) => target.donorId != null && p.donorId === target.donorId),
    ...candidates.filter((p) => !(target.donorId != null && p.donorId === target.donorId)),
  ]
  const seen = new Set<number>()
  const out: RecoProduct[] = []
  for (const p of donorFirst) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
    if (out.length >= limit) break
  }
  return out
}

export function fromSameCar(target: RecoProduct, pool: RecoProduct[], limit = 8): RecoProduct[] {
  const others = pool.filter((p) => p.id !== target.id)
  // Same donor, in stock (pool is in-stock).
  if (target.donorId != null) {
    const sameDonor = others.filter((p) => p.donorId === target.donorId)
    if (sameDonor.length >= 3) return sameDonor.slice(0, limit)
  }
  // Fallback (Р50): same model, current category first, then the rest.
  const sameModel = others.filter((p) => modelCompat(target, p))
  return sameModel
    .sort((a, b) => {
      const ca = a.categoryId === target.categoryId ? 0 : 1
      const cb = b.categoryId === target.categoryId ? 0 : 1
      return ca - cb
    })
    .slice(0, limit)
}
