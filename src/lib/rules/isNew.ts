/**
 * "Новинка" rule (DEV_CONTEXT §5, PROJECT_CONTEXT §3): a product is new when it
 * was created less than 30 days ago, or pinned manually. Pure over an injected
 * `now` so it is testable.
 */
export const NEW_WINDOW_DAYS = 30

export function isNew(createdAt: Date | string, now: Date, pinnedNew = false): boolean {
  if (pinnedNew) return true
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const ageMs = now.getTime() - created.getTime()
  return ageMs < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
}
