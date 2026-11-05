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
export { dispatchDay, dispatchLabel, DISPATCH_LABEL_UK, type Dispatch } from './shipping'
export { pickupStatus, DEFAULT_SCHEDULE, type Schedule, type OpenStatus } from '@/lib/hours'
