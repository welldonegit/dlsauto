import type { Access, FieldAccess } from 'payload'

/**
 * Access control (DEV_CONTEXT §4): admin — everything; manager — products,
 * orders (read), leads, reviews, banners; settings and users — admin only.
 * Content collections are publicly readable (the frontend reads via the Local
 * API, but REST/GraphQL are public surfaces too, so published-only for guests).
 */

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'

export const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'

export const isAdminOrManager: Access = ({ req: { user } }) =>
  Boolean(user && (user.role === 'admin' || user.role === 'manager'))

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/** Public — anyone may read. */
export const anyone: Access = () => true

/** Guests see only published documents; authenticated staff see everything. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (user) return true
  return { published: { equals: true } }
}
