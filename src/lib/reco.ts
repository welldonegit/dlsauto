import type { Position, RecoProduct, RelatedType, SideCond } from '@/lib/rules'
import type { PartType, Product } from '@/payload-types'

/**
 * Map a Payload Product to the matching engine's RecoProduct (DEV_CONTEXT §5).
 * The product must be fetched at depth ≥1 so partType (for `broad`), model,
 * category, donor and alsoFits are populated; OEM comes from the normalized
 * array. Wheels (Р49) get a size key from their diameter/PCD spec values.
 */

const idOf = (v: number | { id: number } | null | undefined): number | null =>
  v == null ? null : typeof v === 'object' ? v.id : v

/** "R16|6x139.7" for wheels (diameter + PCD) — the Р49 size key; null otherwise. */
function wheelKey(p: Product): string | null {
  const specs = p.specValues ?? []
  const val = (key: string) => specs.find((s) => s.key === key)?.value?.trim() || null
  const diameter = val('diameter')
  if (!diameter) return null
  const pcd = val('pcd')
  return pcd ? `${diameter}|${pcd}` : diameter
}

export function toReco(p: Product): RecoProduct {
  const pt = typeof p.partType === 'object' ? (p.partType as PartType) : null
  return {
    id: p.id,
    partTypeId: idOf(p.partType) ?? -1,
    broad: !!pt?.broad,
    position: (p.position ?? null) as Position | null,
    modelId: idOf(p.model),
    alsoFitsIds: (p.alsoFits ?? []).map((m) => idOf(m)).filter((x): x is number => x != null),
    donorId: idOf(p.donor),
    categoryId: idOf(p.category),
    oem: p.oemNormalized ?? [],
    cross: p.crossNormalized ?? [],
    conditionLabel: p.conditionLabel,
    price: p.price,
    wheelKey: wheelKey(p),
  }
}

/** The related types (with side condition) of a product's part type — for «З цим купують». */
export function relatedTypesOf(p: Product): RelatedType[] {
  const pt = typeof p.partType === 'object' ? (p.partType as PartType) : null
  return (pt?.relatedTypes ?? [])
    .map((r) => ({ typeId: idOf(r.type), side: r.side as SideCond }))
    .filter((r): r is RelatedType => r.typeId != null)
}
