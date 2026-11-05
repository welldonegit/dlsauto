import type { Media } from '@/payload-types'

import type { BlockComponentProps } from './BlockRenderer'
import { Videos, type VideoTile } from './Videos'

/**
 * "Перевіряємо перед продажем" (DLSVideos) server wrapper. Maps the block's
 * video list (upload + badge + duration) to tiles for the client carousel.
 */
function mediaUrl(m: number | Media | null | undefined): string | null {
  return m && typeof m === 'object' ? (m.url ?? null) : null
}

export function VideoCheckBlock({
  heading,
  text,
  videos,
  locale: _locale,
}: BlockComponentProps<'videoCheck'>) {
  const tiles: VideoTile[] = (videos ?? [])
    .map((v) => ({
      src: mediaUrl(v.video) ?? '',
      badge: v.badge ?? '',
      duration: v.duration ?? '',
    }))
    .filter((t) => t.src)
  if (!tiles.length) return null
  void _locale

  return (
    <Videos
      heading={heading ?? 'Перевіряємо перед продажем'}
      subtitle={text ?? ''}
      videos={tiles}
    />
  )
}
