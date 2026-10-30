import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

// Single source of truth for the public domain (see .env.example → DOMAIN).
// Used here for CSP; and in the app for metadataBase / canonical / hreflang / sitemap.
const domain = process.env.DOMAIN || 'localhost'
const isProd = process.env.NODE_ENV === 'production'

// CSP is Report-Only in stage 0; enforcement and tightening happen in stage 10.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' https://${domain} https://*.${domain}`,
  "frame-ancestors 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS only in production (behind TLS); never on http localhost.
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  // Standalone output for a small, self-contained Docker runtime image.
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default withPayload(nextConfig)
