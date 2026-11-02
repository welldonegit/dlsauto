'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { CloseIcon } from '@/components/ui/icons'
import { MediaImage, type MediaLike } from '@/components/ui/MediaImage'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Що ще ми робимо" (STAGE_3A §3, PROJECT_CONTEXT §5). Header (H2 left, text
 * right); below, two cards 1:2 at 600px: a rotating slot of services on the
 * left (7s auto-advance, pauses on hover / out of view / reduced motion,
 * crossfade + slight photo zoom + delayed caption + progress dots, click to
 * switch, keyboard via the dots) and a video card on the right (poster cover,
 * centre play → VideoModal 16:9 with Escape and focus return). Texts/media from
 * the block.
 */

const DWELL = 7000
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

type Device = 'desktop' | 'laptop' | 'tablet' | 'mobile'
const deviceFor = (vw: number): Device =>
  vw >= 1360 ? 'desktop' : vw >= 1024 ? 'laptop' : vw >= 768 ? 'tablet' : 'mobile'

type Card = { title: string; text: string; image: MediaLike }

export function WhatElseWeDo({
  heading,
  text,
  cards,
  video,
  videoPoster,
}: BlockComponentProps<'whatElseWeDo'>) {
  const list: Card[] = (cards ?? []).map((c) => ({
    title: c.title ?? '',
    text: c.text ?? '',
    image: c.image,
  }))
  const rootRef = useRef<HTMLElement>(null)
  const [vw, setVw] = useState(1440)
  const [inView, setInView] = useState(false)
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    const detectReduce = () =>
      setReduce(
        !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      )
    onResize()
    detectReduce()
    window.addEventListener('resize', onResize)
    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window && rootRef.current) {
      io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 })
      io.observe(rootRef.current)
    } else setInView(true)
    return () => {
      window.removeEventListener('resize', onResize)
      io?.disconnect()
    }
  }, [])

  if (!list.length && !video) return null

  const d = deviceFor(vw)
  const wide = d === 'desktop' || d === 'laptop'
  const m = d === 'mobile'
  const slotH = wide ? '37.5rem' : undefined // 600px
  const slotRatio = m ? '4 / 5' : wide ? undefined : '16 / 10'
  const videoRatio = m ? '4 / 3' : wide ? undefined : '16 / 9'

  return (
    <section
      ref={rootRef}
      aria-labelledby="wewd-h"
      className="bg-neutral-50 pt-[var(--space-64)] pb-[var(--space-64)] lg:pt-[var(--space-96)] lg:pb-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        {/* header */}
        <div className="grid grid-cols-1 items-start gap-x-[var(--space-24)] gap-y-[var(--space-16)] md:grid-cols-12">
          <h2
            id="wewd-h"
            className="text-24 font-semibold md:col-span-6 md:text-28 lg:text-40"
            style={{ margin: 0, letterSpacing: '-0.02em', textWrap: 'balance' }}
          >
            {heading}
          </h2>
          {text ? (
            <p
              className="text-16 md:col-span-6 md:col-start-7"
              style={{
                margin: 0,
                lineHeight: 1.5,
                color: 'var(--color-neutral-600)',
                textWrap: 'pretty',
              }}
            >
              {text}
            </p>
          ) : null}
        </div>

        {/* cards */}
        <div
          className="grid grid-cols-1 gap-[var(--space-16)] md:gap-[var(--space-24)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          style={{ marginTop: 'var(--space-32)' }}
        >
          {list.length ? (
            <RotatingSlot
              cards={list}
              inView={inView}
              reduce={reduce}
              height={slotH}
              ratio={slotRatio}
              mobile={m}
            />
          ) : null}
          <VideoCard
            poster={videoPoster}
            video={video}
            reduce={reduce}
            height={slotH}
            ratio={videoRatio}
            mobile={m}
          />
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- icons */

function SlotIcon({ kind }: { kind: number }) {
  // card 0 → wrench+check (service), card 1 → car (buy-out), per the export.
  return (
    <svg
      viewBox="0 0 24 24"
      className="dls-icon"
      style={{ width: 'var(--icon-24)', height: 'var(--icon-24)' }}
      aria-hidden="true"
    >
      {kind === 0 ? (
        <>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.4 7.6l-6.2 6.2a2.1 2.1 0 0 1-3-3l6.2-6.2a6 6 0 0 1 7.6-7.4z" />
          <path d="m15.5 18.5 2 2 4-4" />
        </>
      ) : (
        <>
          <path d="M5 17H4a1 1 0 0 1-1-1v-3.5l1.8-4.6A1.5 1.5 0 0 1 6.2 7h11.6a1.5 1.5 0 0 1 1.4.9l1.8 4.6V16a1 1 0 0 1-1 1h-1" />
          <path d="M3 12.5h18" />
          <path d="M9.5 17h5" />
          <circle cx="7.5" cy="17" r="2" />
          <circle cx="16.5" cy="17" r="2" />
        </>
      )}
    </svg>
  )
}

function WorkshopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="dls-icon"
      style={{ width: 'var(--icon-24)', height: 'var(--icon-24)' }}
      aria-hidden="true"
    >
      <path d="M3 20h18" />
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M8 20v-7h8v7" />
      <path d="M8 16.5h8" />
    </svg>
  )
}

/* ---------------------------------------------------------------- tile */

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 'var(--control-h-48)',
        height: 'var(--control-h-48)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-neutral-0)',
        color: 'var(--color-neutral-900)',
      }}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- rotating slot */

function RotatingSlot({
  cards,
  inView,
  reduce,
  height,
  ratio,
  mobile,
}: {
  cards: Card[]
  inView: boolean
  reduce: boolean
  height?: string
  ratio?: string
  mobile: boolean
}) {
  const [active, setActive] = useState(0)
  const [p, setP] = useState(0)
  const [hover, setHover] = useState(false)
  const raf = useRef<number | undefined>(undefined)
  const last = useRef<number | undefined>(undefined)

  useEffect(() => {
    const tick = (now: number) => {
      const dt = last.current ? Math.min(now - last.current, 100) : 0
      last.current = now
      if (!reduce && !hover && inView) {
        setP((prev) => {
          const next = prev + dt / DWELL
          if (next >= 1) {
            setActive((a) => (a + 1) % cards.length)
            return 0
          }
          return next
        })
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [hover, inView, reduce, cards.length])

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-roledescription="карусель"
      aria-label="Послуги"
      className="relative min-w-0 overflow-hidden"
      style={{
        height,
        aspectRatio: ratio,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-neutral-800)',
        isolation: 'isolate',
      }}
    >
      {cards.map((c, i) => {
        const a = i === active
        const hv = a && hover
        return (
          <article
            key={i}
            aria-hidden={!a}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: a ? 2 : 1,
              opacity: a ? 1 : 0,
              pointerEvents: a ? 'auto' : 'none',
              transition: `opacity ${a ? 900 : 700}ms ${EASE}`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: a ? (hv ? 'scale(1.03)' : 'scale(1)') : 'scale(1.06)',
                transition: a
                  ? `transform ${hv ? 700 : 1600}ms ${EASE}`
                  : 'transform 0ms linear 900ms',
              }}
            >
              <MediaImage media={c.image} size="gallery" sizes="(min-width: 1024px) 33vw, 100vw" />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 bottom-0 left-0"
              style={{
                height: '55%',
                background:
                  'linear-gradient(0deg, rgba(18,22,28,0.9) 0%, rgba(18,22,28,0.55) 45%, rgba(18,22,28,0) 100%)',
              }}
            />
            <Link
              href="/contacts"
              tabIndex={a ? 0 : -1}
              className="absolute flex items-center no-underline"
              style={{
                left: mobile ? 'var(--space-16)' : 'var(--space-24)',
                right: mobile ? 'var(--space-16)' : 'var(--space-24)',
                bottom: `calc(${mobile ? 'var(--space-16)' : 'var(--space-24)'} + var(--space-32))`,
                gap: 'var(--space-16)',
                color: 'var(--color-neutral-0)',
                opacity: a ? 1 : 0,
                transform: a ? 'translateY(0)' : 'translateY(0.75rem)',
                transition: a
                  ? `opacity 600ms ${EASE} 420ms, transform 700ms ${EASE} 420ms`
                  : 'opacity 300ms ease-out, transform 0ms linear 700ms',
              }}
            >
              <Tile>
                <SlotIcon kind={i % 2} />
              </Tile>
              <span className="flex min-w-0 flex-col" style={{ gap: 'var(--space-2)' }}>
                <span
                  className="text-18 lg:text-20"
                  style={{
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--color-neutral-0)',
                  }}
                >
                  {c.title}
                </span>
                <span
                  className="text-14 md:text-16"
                  style={{ lineHeight: 1.45, color: 'var(--color-neutral-300)' }}
                >
                  {c.text}
                </span>
              </span>
            </Link>
          </article>
        )
      })}
      {/* progress dots */}
      <div
        role="group"
        aria-label="Перемкнути послугу"
        className="absolute z-[3] flex"
        style={{
          left: mobile ? 'var(--space-16)' : 'var(--space-24)',
          bottom: 'var(--space-12)',
          gap: 'var(--space-4)',
        }}
      >
        {cards.map((c, i) => {
          const a = i === active
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActive(i)
                setP(0)
              }}
              aria-label={c.title}
              aria-current={a ? 'true' : 'false'}
              className="flex items-center border-0 bg-transparent p-0"
              style={{
                width: 'var(--space-48)',
                height: 'var(--space-24)',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              <span
                className="relative block w-full overflow-hidden"
                style={{
                  height: 'var(--border-thick)',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(252,252,253,0.32)',
                }}
              >
                <span
                  className="absolute inset-0"
                  style={{
                    background: 'var(--color-neutral-0)',
                    transformOrigin: 'left center',
                    transform: `scaleX(${a ? (reduce ? 1 : p) : 0})`,
                  }}
                />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- video card */

function VideoCard({
  poster,
  video,
  reduce,
  height,
  ratio,
  mobile,
}: {
  poster: MediaLike
  video: MediaLike
  reduce: boolean
  height?: string
  ratio?: string
  mobile: boolean
}) {
  const [hover, setHover] = useState(false)
  const [open, setOpen] = useState(false)
  const [modalIn, setModalIn] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const videoSrc = video && typeof video === 'object' ? (video.url ?? '') : ''

  const close = () => {
    setModalIn(false)
    window.setTimeout(() => {
      setOpen(false)
      document.body.style.overflow = ''
      lastFocus.current?.focus?.()
    }, 300)
  }
  const openModal = () => {
    lastFocus.current = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    setOpen(true)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setModalIn(true)
        closeRef.current?.focus()
      }),
    )
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const inset = mobile ? 'var(--space-16)' : 'var(--space-24)'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative min-w-0 overflow-hidden"
      style={{
        height,
        aspectRatio: ratio,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-neutral-800)',
        isolation: 'isolate',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: hover ? 'scale(1.03)' : 'scale(1)',
          transition: `transform 700ms ${EASE}`,
        }}
      >
        <MediaImage media={poster} size="gallery" sizes="(min-width: 1024px) 66vw, 100vw" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 left-0"
        style={{
          height: '45%',
          background:
            'linear-gradient(0deg, rgba(18,22,28,0.9) 0%, rgba(18,22,28,0.55) 45%, rgba(18,22,28,0) 100%)',
        }}
      />
      <button
        type="button"
        onClick={openModal}
        aria-label="Відтворити відео «Наш цех і двір»"
        aria-haspopup="dialog"
        className="absolute top-1/2 left-1/2 z-[2] flex items-center justify-center border-0 p-0"
        style={{
          width: 'var(--control-h-56)',
          height: 'var(--control-h-56)',
          marginTop: 'calc(-1 * var(--control-h-56) / 2)',
          marginLeft: 'calc(-1 * var(--control-h-56) / 2)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(252,252,253,0.88)',
          color: 'var(--color-neutral-900)',
          cursor: 'pointer',
          transform: hover ? 'scale(1.08)' : 'scale(1)',
          transition: `transform 320ms ${EASE}`,
        }}
      >
        <svg
          viewBox="0 0 24 24"
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
      </button>
      <div
        className="pointer-events-none absolute flex items-center"
        style={{ left: inset, right: inset, bottom: inset, gap: 'var(--space-16)' }}
      >
        <Tile>
          <WorkshopIcon />
        </Tile>
        <span className="flex min-w-0 flex-col" style={{ gap: 'var(--space-2)' }}>
          <span
            className="text-18 lg:text-20"
            style={{ fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-neutral-0)' }}
          >
            Наш цех і двір
          </span>
          <span
            className="text-14 md:text-16"
            style={{ lineHeight: 1.45, color: 'var(--color-neutral-300)' }}
          >
            Як розбираємо, перевіряємо і зберігаємо деталі
          </span>
        </span>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Відео «Наш цех і двір»"
          onClick={close}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{
            padding: mobile ? 'var(--space-64) var(--space-16)' : 'var(--space-80) var(--space-64)',
            background: 'rgba(18,22,28,0.94)',
            opacity: modalIn ? 1 : 0,
            transition: `opacity 300ms ${EASE}`,
          }}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Закрити відео"
            className="absolute flex items-center justify-center border-0 p-0"
            style={{
              top: 'var(--space-16)',
              right: 'var(--space-16)',
              width: 'var(--control-h-48)',
              height: 'var(--control-h-48)',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(252,252,253,0.12)',
              color: 'var(--color-neutral-0)',
              cursor: 'pointer',
            }}
          >
            <CloseIcon size="24" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full overflow-hidden"
            style={{
              maxWidth: '75rem',
              aspectRatio: '16 / 9',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-neutral-950)',
              transform: modalIn || reduce ? 'scale(1)' : 'scale(0.96)',
              transition: `transform 400ms ${EASE}`,
            }}
          >
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full"
                style={{ objectFit: 'cover', background: 'var(--color-neutral-950)' }}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-16"
                style={{ color: 'var(--color-neutral-400)' }}
              >
                Тут буде відео цеху і двору
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
