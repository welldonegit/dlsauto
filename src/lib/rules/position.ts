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

// -------------------------------------------------------------- compatibility
type Axis = 'front' | 'rear' | 'any'
type Side = 'left' | 'right' | 'pair' | 'both' | 'any'
type Seat = 'driver' | 'passenger' | 'any'
type Decomposed = { axis: Axis; side: Side; seat: Seat }

const DECOMPOSE: Record<Position, Decomposed> = {
  'front-left': { axis: 'front', side: 'left', seat: 'any' },
  'front-right': { axis: 'front', side: 'right', seat: 'any' },
  'rear-left': { axis: 'rear', side: 'left', seat: 'any' },
  'rear-right': { axis: 'rear', side: 'right', seat: 'any' },
  left: { axis: 'any', side: 'left', seat: 'any' },
  right: { axis: 'any', side: 'right', seat: 'any' },
  front: { axis: 'front', side: 'any', seat: 'any' },
  rear: { axis: 'rear', side: 'any', seat: 'any' },
  pair: { axis: 'any', side: 'pair', seat: 'any' },
  both: { axis: 'any', side: 'both', seat: 'any' },
  driver: { axis: 'any', side: 'any', seat: 'driver' },
  passenger: { axis: 'any', side: 'any', seat: 'passenger' },
  none: { axis: 'any', side: 'any', seat: 'any' },
}

/** Decompose a position onto axis / side / seat (Р10). */
export function decompose(pos: Position | null | undefined): Decomposed {
  return DECOMPOSE[pos ?? 'none'] ?? DECOMPOSE.none
}

function sideCompat(a: Side, b: Side): boolean {
  if (a === 'any' || b === 'any') return true
  if (a === b) return true
  // "підходить на обидві сторони" (both) is compatible with ліва and права (Р36).
  const sided = (s: Side) => s === 'left' || s === 'right' || s === 'both'
  if (a === 'both' && sided(b)) return true
  if (b === 'both' && sided(a)) return true
  // комплект (pair) is an alternative only to комплект; driver ≠ passenger.
  return false
}

/**
 * Two positions compatible (Р10/Р36): on each axis the values are equal or one
 * is "any" (—); `both` matches ліва/права; `pair` matches only `pair`; seat
 * (водійська/пасажирська) matches only the equal value. Used by alternatives and
 * "з цим купують". Types with rule `none` carry position `none` → always match.
 */
export function positionMatch(
  a: Position | null | undefined,
  b: Position | null | undefined,
): boolean {
  const da = decompose(a)
  const db = decompose(b)
  const axisOk = da.axis === 'any' || db.axis === 'any' || da.axis === db.axis
  const seatOk = da.seat === 'any' || db.seat === 'any' || da.seat === db.seat
  return axisOk && seatOk && sideCompat(da.side, db.side)
}

/** The opposite side of a position for "з цим купують" side=opposite (Р37/Р45). */
export function oppositePosition(pos: Position | null | undefined): Position | null {
  switch (pos) {
    case 'front-left':
      return 'front-right'
    case 'front-right':
      return 'front-left'
    case 'rear-left':
      return 'rear-right'
    case 'rear-right':
      return 'rear-left'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return null
  }
}
