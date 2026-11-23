/**
 * Part location & side (DEV_CONTEXT §5 "Розташування", CATALOG_PLAN §7, Р10).
 *
 * A part type carries a `positionRule` (which side/axis is mandatory); a product
 * carries a single `position` from the closed list below. For compatibility
 * (alternatives, "з цим купують") a position decomposes onto three axes —
 * axis (front/rear), side (left/right/pair), seat (driver/passenger) — each
 * value either concrete or "any" (—). The matrix in `positionMatch` lives with
 * the business rules and is unit-tested separately. Two fit-rules are distinct
 * (Р36): `pair` — комплект ліва + права, одна позиція продажу; `both` — одна
 * деталь, що підходить на обидві сторони (сумісна з ліва і права).
 */

/** Side rule of a part type (справочник «Код правила»). */
export const POSITION_RULES = ['lr', 'fb', 'any', 'seat', 'none'] as const
export type PositionRule = (typeof POSITION_RULES)[number]

/** The closed "Розташування" list (dovidnyk sheet «Розташування»). */
export const POSITIONS = [
  { value: 'front-left', label: 'передня ліва' },
  { value: 'front-right', label: 'передня права' },
  { value: 'rear-left', label: 'задня ліва' },
  { value: 'rear-right', label: 'задня права' },
  { value: 'left', label: 'ліва' },
  { value: 'right', label: 'права' },
  { value: 'front', label: 'передня' },
  { value: 'rear', label: 'задня' },
  { value: 'pair', label: 'комплект: ліва + права' },
  { value: 'both', label: 'підходить на обидві сторони' },
  { value: 'driver', label: 'водійська' },
  { value: 'passenger', label: 'пасажирська' },
  { value: 'none', label: '—' },
] as const

export type Position = (typeof POSITIONS)[number]['value']

/** Payload select options for the position field. */
export const POSITION_OPTIONS = POSITIONS.map((p) => ({ label: p.label, value: p.value }))

/** Human label for a position value (uk). */
export function positionLabel(value: Position | null | undefined): string {
  return POSITIONS.find((p) => p.value === value)?.label ?? '—'
}
