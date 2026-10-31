import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { UiShowcase } from './UiShowcase'

/**
 * /ui — the design-system showcase. Available in dev and on stage, noindex,
 * and a 404 in production.
 */
export const metadata: Metadata = {
  title: 'UI kit — DLSAuto',
  robots: { index: false, follow: false },
}

export default function UiPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <UiShowcase />
}
