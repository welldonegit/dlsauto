/**
 * Business rules (DEV_CONTEXT §5) — pure, unit-tested functions used by the data
 * layer, collection hooks, seed and the frontend. Timezone-sensitive rules are
 * evaluated in Europe/Kyiv over an injected `now`.
 */
export { slugify, transliterate } from './slug'
export { normalizeOem, normalizeOemList } from './oem'
export { pluralUk, partsWord, partsLabel } from './plural'
export { modelDisplayName, modelYears, modelLabel } from './modelName'
export { isNew, NEW_WINDOW_DAYS } from './isNew'
export {
  POSITIONS,
  POSITION_OPTIONS,
  POSITION_RULES,
  positionLabel,
  positionMatch,
  decompose,
  oppositePosition,
  type Position,
  type PositionRule,
} from './position'
export {
  availability,
  isAvailable,
  AVAILABILITY_LABEL,
  type Availability,
  type AvailabilityInput,
} from './availability'
export {
  alternatives,
  boughtTogether,
  fromSameCar,
  type RecoProduct,
  type RelatedType,
  type SideCond,
} from './recommend'
export { dispatchDay, dispatchLabel, DISPATCH_LABEL_UK, type Dispatch } from './shipping'
export { pickupStatus, DEFAULT_SCHEDULE, type Schedule, type OpenStatus } from '@/lib/hours'
