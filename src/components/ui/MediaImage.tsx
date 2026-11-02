import Image from 'next/image'
import type { CSSProperties } from 'react'

import type { Media } from '@/payload-types'

/**
 * Thin wrapper over next/image for Payload media relations. Accepts the related
 * value as it arrives from the data layer (a Media object when populated, a
 * number or null otherwise) and picks a sharp variant. Renders a neutral
 * placeholder box when the media is missing. Always `fill` — the caller sizes
 * the positioned parent.
 */

type SizeKey = 'thumb' | 'card' | 'gallery' | 'original'

export type MediaLike = number | Media | null | undefined

function pick(media: Media, size: SizeKey): string | null {
  if (size !== 'original') {
    const v = media.sizes?.[size]?.url
    if (v) return v
  }
  return media.url ?? null
}

export function MediaImage({
  media,
  size = 'card',
  alt,
  sizes,
  priority,
  className,
  style,
}: {
  media: MediaLike
  size?: SizeKey
  /** Override the media's own alt (e.g. decorative → ''). */
  alt?: string
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
}) {
  const obj = media && typeof media === 'object' ? media : null
  const src = obj ? pick(obj, size) : null
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{ background: 'var(--color-neutral-200)', ...style, position: 'absolute', inset: 0 }}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={alt ?? obj?.alt ?? ''}
      fill
      sizes={sizes ?? '100vw'}
      priority={priority}
      className={className}
      style={{ objectFit: 'cover', ...style }}
    />
  )
}
