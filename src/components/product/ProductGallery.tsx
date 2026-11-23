'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Product gallery (DLSProduct). Main 4:3 frame with the "Фото реальної деталі"
 * badge, zoom-to-lightbox, counter and prev/next arrows; a thumbnail rail
 * (vertical column left of the frame on desktop, horizontal row below on
 * tablet/mobile). The inspection video ("Перевірка") is a slide of its own.
 * Arrows show on hover (desktop) or always (touch); the lightbox traps focus.
 */

export type Slide = { src: string; isVideo: boolean; videoSrc?: string | null }

export function ProductGallery({ slides, name }: { slides: Slide[]; name: string }) {
  const list = slides.length ? slides : [{ src: '', isVideo: false }]
  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const [lb, setLb] = useState(false)
  const [lbShown, setLbShown] = useState(false)
  const lbCloseRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const closeT = useRef<ReturnType<typeof setTimeout>>(undefined)

  const total = list.length
  const go = useCallback((n: number) => setIdx((n + total) % total), [total])
  const cur = list[idx]

  const openLb = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement
    setLb(true)
    requestAnimationFrame(() => {
      setLbShown(true)
      lbCloseRef.current?.focus({ preventScroll: true })
    })
    document.body.style.overflow = 'hidden'
  }, [])
  const closeLb = useCallback(() => {
    setLbShown(false)
    document.body.style.overflow = ''
    closeT.current = setTimeout(() => {
      setLb(false)
      lastFocus.current?.focus?.({ preventScroll: true })
    }, 200)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(idx + 1)
      else if (e.key === 'ArrowLeft') go(idx - 1)
      else if (e.key === 'Escape' && lb) closeLb()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, lb, go, closeLb])

  useEffect(() => () => clearTimeout(closeT.current), [])

  const counter = `${idx + 1} / ${total}`

  return (
    <div className="dls-pd-gallery">
      <div className="dls-pd-gallery__grid">
        <div
          className="dls-pd-gallery__frame"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {cur.isVideo && cur.videoSrc ? (
            <video
              src={cur.videoSrc}
              controls
              playsInline
              muted
              preload="metadata"
              aria-label="Відео перевірки деталі"
              className="dls-pd-gallery__media"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cur.src}
              alt={`${name} — фото ${idx + 1} з ${total}`}
              onClick={openLb}
              className="dls-pd-gallery__media dls-pd-gallery__media--zoom"
            />
          )}
          <span className="dls-pd-gallery__badge">Фото реальної деталі</span>
          <button
            type="button"
            onClick={openLb}
            aria-label="Збільшити фото"
            className="dls-pd-gallery__zoom"
          >
            <Icon name="zoom" />
          </button>
          <span className="dls-pd-gallery__counter">{counter}</span>
          {total > 1 ? (
            <>
              <button
                type="button"
                aria-label="Попереднє фото"
                onClick={() => go(idx - 1)}
                className="dls-pd-gallery__arrow dls-pd-gallery__arrow--prev"
                data-show={hover ? 'true' : 'false'}
              >
                <Icon name="prev" />
              </button>
              <button
                type="button"
                aria-label="Наступне фото"
                onClick={() => go(idx + 1)}
                className="dls-pd-gallery__arrow dls-pd-gallery__arrow--next"
                data-show={hover ? 'true' : 'false'}
              >
                <Icon name="next" />
              </button>
            </>
          ) : null}
        </div>

        {total > 1 ? (
          <div className="dls-pd-gallery__thumbsWrap">
            <div role="tablist" aria-label="Фото деталі" className="dls-pd-gallery__thumbs">
              {list.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={t.isVideo ? 'Відео перевірки' : `Фото ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className="dls-pd-gallery__thumb"
                  data-active={i === idx ? 'true' : 'false'}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.src} alt="" />
                  {t.isVideo ? (
                    <span className="dls-pd-gallery__thumbVideo">
                      <Icon name="play" />
                      <span>Перевірка</span>
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {lb ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Фото деталі"
          onClick={closeLb}
          className="dls-pd-lb"
          style={{ opacity: lbShown ? 1 : 0 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="dls-pd-lb__stage">
            {cur.isVideo && cur.videoSrc ? (
              <video
                src={cur.videoSrc}
                controls
                playsInline
                autoPlay
                className="dls-pd-lb__media"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cur.src}
                alt={`${name} — фото ${idx + 1} з ${total}`}
                className="dls-pd-lb__media"
              />
            )}
          </div>
          <button
            type="button"
            ref={lbCloseRef}
            onClick={closeLb}
            aria-label="Закрити"
            className="dls-pd-lb__btn dls-pd-lb__btn--close"
          >
            <Icon name="x" />
          </button>
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(idx - 1)
                }}
                aria-label="Попереднє фото"
                className="dls-pd-lb__btn dls-pd-lb__btn--prev"
              >
                <Icon name="prev" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(idx + 1)
                }}
                aria-label="Наступне фото"
                className="dls-pd-lb__btn dls-pd-lb__btn--next"
              >
                <Icon name="next" />
              </button>
              <span className="dls-pd-lb__counter">{counter}</span>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Icon({ name }: { name: 'zoom' | 'prev' | 'next' | 'play' | 'x' }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    fill: name === 'play' ? 'currentColor' : 'none',
    stroke: name === 'play' ? 'none' : 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'zoom':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      )
    case 'prev':
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      )
    case 'next':
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      )
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      )
  }
}
