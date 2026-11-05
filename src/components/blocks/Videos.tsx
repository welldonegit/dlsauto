'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type VideoTile = { src: string; badge: string; duration: string }

/**
 * "Перевіряємо перед продажем" (DLSVideos). A full-bleed snap-carousel of 4/5
 * video tiles: each shows a category badge, a duration chip and a centre play
 * button at rest; on hover the tile's video plays (others pause and rewind),
 * the play button fades out and the duration fades in. Edge-aware prev/next
 * arrows on desktop/tablet. Videos preload metadata only.
 */
export function Videos({
  heading,
  subtitle,
  videos,
}: {
  heading: string
  subtitle: string
  videos: VideoTile[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const vids = useRef<(HTMLVideoElement | null)[]>([])
  const [hovered, setHovered] = useState<number | null>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    syncEdges()
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [syncEdges])

  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return
      if (i === hovered) void v.play().catch(() => {})
      else if (!v.paused) {
        v.pause()
        v.currentTime = 0
      }
    })
  }, [hovered])

  const scrollBy = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * (296 + 16), behavior: 'smooth' })

  const side = 'max(var(--dls-pad), calc((100% - var(--container-max)) / 2))'
  if (!videos.length) return null

  return (
    <section
      aria-labelledby="videos-title"
      className="bg-neutral-50 pt-[var(--space-64)] lg:pt-[var(--space-96)] [--dls-pad:var(--space-16)] md:[--dls-pad:var(--space-32)] wide:[--dls-pad:var(--space-64)]"
    >
      <div
        className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <h2
          id="videos-title"
          className="text-24 md:text-28 wide:text-40"
          style={{
            margin: 0,
            lineHeight: 1.15,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-neutral-900)',
          }}
        >
          {heading}
        </h2>
        {subtitle ? (
          <p
            className="text-16 wide:text-18"
            style={{
              margin: 'var(--space-16) 0 0',
              maxWidth: '40rem',
              lineHeight: 1.5,
              color: 'var(--color-neutral-600)',
              textWrap: 'pretty',
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        onScroll={syncEdges}
        className="mt-[var(--space-32)] flex gap-[var(--space-16)] overflow-x-auto md:mt-[var(--space-48)]"
        style={{
          paddingInline: side,
          scrollPaddingLeft: side,
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {videos.map((v, i) => {
          const on = hovered === i
          return (
            <article
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative w-[15rem] shrink-0 overflow-hidden md:w-[16rem] wide:w-[18.5rem]"
              style={{
                aspectRatio: '4 / 5',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-neutral-900)',
                scrollSnapAlign: 'start',
              }}
            >
              <video
                ref={(el) => {
                  vids.current[i] = el
                }}
                src={v.src}
                aria-label={v.badge}
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 block h-full w-full"
                style={{ objectFit: 'cover' }}
              />
              <div
                aria-hidden="true"
                className="absolute right-0 bottom-0 left-0"
                style={{
                  height: '33%',
                  background: 'linear-gradient(to top, rgba(18,22,28,0.64), rgba(18,22,28,0))',
                  pointerEvents: 'none',
                }}
              />
              <span
                className="absolute text-12"
                style={{
                  top: 'var(--space-12)',
                  left: 'var(--space-12)',
                  padding: 'var(--space-4) var(--space-8)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(18,22,28,0.64)',
                  fontWeight: 500,
                  color: 'var(--color-neutral-0)',
                }}
              >
                {v.badge}
              </span>
              <span
                aria-label={`Тривалість ${v.duration}`}
                className="absolute text-12"
                style={{
                  top: 'var(--space-12)',
                  right: 'var(--space-12)',
                  padding: 'var(--space-4) var(--space-8)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(18,22,28,0.64)',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-neutral-0)',
                  opacity: on ? 1 : 0,
                  transform: on ? 'translateY(0)' : 'translateY(calc(var(--space-4) * -1))',
                  transition: `opacity var(--duration-${on ? '600' : '200'}) var(--ease-brand), transform var(--duration-${on ? '600' : '200'}) var(--ease-brand)`,
                }}
              >
                {v.duration}
              </span>
              <span
                aria-hidden="true"
                className="absolute flex items-center justify-center"
                style={{
                  top: '50%',
                  left: '50%',
                  width: 'var(--control-h-56)',
                  height: 'var(--control-h-56)',
                  marginTop: 'calc(var(--control-h-56) / -2)',
                  marginLeft: 'calc(var(--control-h-56) / -2)',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(252,252,253,0.88)',
                  color: 'var(--color-neutral-900)',
                  opacity: on ? 0 : 1,
                  transform: on ? 'scale(0.88)' : 'scale(1)',
                  transition:
                    'opacity var(--duration-300) var(--ease-brand), transform var(--duration-300) var(--ease-brand)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  aria-hidden="true"
                  style={{
                    width: 'var(--icon-24)',
                    height: 'var(--icon-24)',
                    marginLeft: '0.1875rem',
                    fill: 'currentColor',
                  }}
                >
                  <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" />
                </svg>
              </span>
            </article>
          )
        })}
      </div>

      <div
        className="mx-auto box-border hidden w-full justify-end gap-[var(--space-8)] px-[var(--space-16)] pt-[var(--space-24)] pb-[var(--space-64)] md:flex md:px-[var(--space-32)] lg:pb-[var(--space-96)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <VideoArrow dir="prev" disabled={atStart} onClick={() => scrollBy(-1)} />
        <VideoArrow dir="next" disabled={atEnd} onClick={() => scrollBy(1)} />
      </div>
    </section>
  )
}

function VideoArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Попередні відео' : 'Наступні відео'}
      className="flex shrink-0 items-center justify-center rounded-full border-[length:var(--border-hairline)] border-solid border-neutral-300 transition-colors duration-150 ease-out hover:enabled:border-[color:var(--color-neutral-900)]"
      style={{
        width: 'var(--control-h-48)',
        height: 'var(--control-h-48)',
        background: 'var(--color-neutral-0)',
        color: disabled ? 'var(--color-neutral-400)' : 'var(--color-neutral-900)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
        style={{
          width: 'var(--icon-20)',
          height: 'var(--icon-20)',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        <path d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  )
}
