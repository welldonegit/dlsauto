/** Build identifier (git sha), injected at build time; "dev" when running locally. */
export function getBuildSha(): string {
  return process.env.NEXT_PUBLIC_BUILD_SHA || process.env.BUILD_SHA || 'dev'
}

/**
 * Canonical site origin, derived from the single DOMAIN variable.
 * Used for metadataBase, canonical, hreflang and sitemap.
 */
export function getSiteUrl(): string {
  const domain = process.env.DOMAIN
  if (domain) return `https://${domain}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
