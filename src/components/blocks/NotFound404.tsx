'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'

/**
 * 404 content (STAGE_3A §1): a self-drawing line pickup missing its left
 * headlight — marked with a mono "404" tag — plus a search field and useful
 * links. Rendered inside the real not-found.tsx (HTTP 404). Text is passed in
 * from the i18n dictionary so uk/ru both read naturally.
 *
 * The line set uses the same stroke as the icon set (--icon-stroke scaled up
 * for the large art). The draw is a one-shot stroke-dashoffset transition and
 * respects prefers-reduced-motion. The live search-suggestion dropdown from the
 * export is deferred to the search stage (stage 4) — it needs real data, which
 * we don't invent here; the field itself submits to /search.
 */

export type NotFoundText = {
  heading: string
  lead: string
  searchPlaceholder: string
  searchSubmit: string
  searchLabel: string
  linksLabel: string
  home: string
  catalog: string
  contacts: string
  artLabel: string
  artTag: string
}

export function NotFound404({ text, locale }: { text: NotFoundText; locale: 'uk' | 'ru' }) {
  const prefix = locale === 'uk' ? '' : '/ru'
  const links = [
    { label: text.home, href: `${prefix}/` },
    { label: text.catalog, href: `${prefix}/catalog` },
    { label: text.contacts, href: `${prefix}/contacts` },
  ]
  return (
    <section
      aria-labelledby="nf-h1"
      className="mx-auto box-border w-full px-[var(--space-16)] py-[var(--space-48)] md:px-[var(--space-32)] md:py-[var(--space-64)] wide:px-[var(--space-64)] wide:py-[var(--space-96)]"
      style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
    >
      <div className="grid grid-cols-1 items-center gap-[var(--space-32)] lg:grid-cols-2 lg:gap-[var(--space-48)] wide:gap-[var(--space-64)]">
        {/* text — second on narrow (art leads), first from laptop up */}
        <div className="order-2 flex min-w-0 flex-col lg:order-1">
          <h1
            id="nf-h1"
            className="text-32 font-semibold md:text-40 lg:text-d"
            style={{ margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            {text.heading}
          </h1>
          <p
            className="text-14 md:text-16 wide:text-18"
            style={{
              margin: 'var(--space-24) 0 0',
              maxWidth: '32.5rem',
              color: 'var(--color-neutral-600)',
              textWrap: 'pretty',
            }}
          >
            {text.lead}
          </p>

          <SearchForm text={text} prefix={prefix} />

          <nav
            aria-label={text.linksLabel}
            className="flex flex-wrap items-center text-16"
            style={{ marginTop: 'var(--space-24)', gap: 'var(--space-8) var(--space-16)' }}
          >
            {links.map((l, i) => (
              <span key={l.href} className="flex items-center" style={{ gap: 'var(--space-16)' }}>
                {i > 0 ? (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 'var(--border-hairline)',
                      height: 'var(--space-16)',
                      background: 'var(--color-neutral-300)',
                    }}
                  />
                ) : null}
                <a
                  href={l.href}
                  className="underline underline-offset-4 [text-decoration-color:var(--color-neutral-400)] hover:[text-decoration-color:var(--color-neutral-900)]"
                  style={{ color: 'var(--color-neutral-900)' }}
                >
                  {l.label}
                </a>
              </span>
            ))}
          </nav>
        </div>

        {/* art — first on narrow, second from laptop up */}
        <div className="order-1 flex min-w-0 justify-center lg:order-2">
          <PickupArt label={text.artLabel} tag={text.artTag} />
        </div>
      </div>
    </section>
  )
}

function SearchForm({ text, prefix }: { text: NotFoundText; prefix: string }) {
  const [query, setQuery] = useState('')
  return (
    <form
      role="search"
      action={`${prefix}/search`}
      method="get"
      className="flex flex-col lg:flex-row"
      style={{ marginTop: 'var(--space-32)', gap: 'var(--space-8)' }}
    >
      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          name="q"
          aria-label={text.searchLabel}
          autoComplete="off"
          placeholder={text.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full box-border outline-none"
          style={{
            height: 'var(--control-h-56)',
            padding: '0 var(--space-16)',
            border: 'var(--border-hairline) solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-neutral-white)',
            fontFamily: 'inherit',
            fontSize: 'var(--text-16)',
            color: 'var(--color-neutral-900)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-neutral-900)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-neutral-200)')}
        />
      </div>
      <Button size="lg" type="submit">
        {text.searchSubmit}
      </Button>
    </form>
  )
}

/**
 * The pickup line drawing. viewBox and path geometry are 1:1 with the export
 * (icon geometry, exempt from the token rule); colours come through style so
 * they stay token-bound. Self-draws once on mount via stroke-dashoffset.
 */
function PickupArt({ label, tag }: { label: string; tag: string }) {
  const [drawn, setDrawn] = useState(false)
  const [instant, setInstant] = useState(false)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // All state updates happen inside the rAF callback, never synchronously in
    // the effect body.
    raf.current = requestAnimationFrame(() => {
      if (reduce) {
        setInstant(true)
        setDrawn(true)
        return
      }
      raf.current = requestAnimationFrame(() => setDrawn(true))
    })
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  const drawDur = instant ? '0ms' : '1200ms'
  const fadeDur = instant ? '0ms' : '400ms'
  const fadeDelay = instant ? '0ms' : '1200ms'

  return (
    <svg
      viewBox="100 120 620 360"
      role="img"
      aria-label={label}
      className="block h-auto w-full"
      style={{
        maxWidth: '40rem',
        overflow: 'visible',
        fill: 'none',
        stroke: 'var(--color-neutral-900)',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      <g
        style={{
          strokeDasharray: 1,
          strokeDashoffset: drawn ? 0 : 1,
          transition: `stroke-dashoffset ${drawDur} cubic-bezier(0.45, 0, 0.2, 1)`,
        }}
      >
        <path pathLength={1} d="M120 446 L700 446" />
        <path
          pathLength={1}
          d="M300 300 L360 245 L452 245 Q462 246 463 256 L466 320 L690 320 L690 388 L612 388 A52 52 0 0 0 508 388 L282 388 A52 52 0 0 0 178 388 L146 388 L140 380 L140 344 L150 340 L152 316 L300 300"
        />
        <path pathLength={1} d="M312 296 L360 254 L444 254 L446 296 Z" />
        <path pathLength={1} d="M300 306 L300 384 M452 306 L452 384 M418 322 L436 322" />
        <path pathLength={1} d="M466 336 L680 336 M682 330 L682 350" />
        <path pathLength={1} d="M352 268 L338 268 L336 282 L350 282" />
        <path pathLength={1} d="M140 352 L150 352 M140 362 L150 362 M140 372 L150 372" />
        <circle pathLength={1} cx="230" cy="400" r="46" />
        <circle pathLength={1} cx="230" cy="400" r="18" />
        <circle pathLength={1} cx="560" cy="400" r="46" />
        <circle pathLength={1} cx="560" cy="400" r="18" />
      </g>
      <g
        style={{
          opacity: drawn ? 1 : 0,
          transition: `opacity ${fadeDur} ease-out ${fadeDelay}`,
        }}
      >
        <path d="M154 318 L190 314 L192 332 L156 336 Z" strokeWidth={1.5} strokeDasharray="4 4" />
        <path d="M172 314 L172 206" strokeWidth={1} />
        <circle
          cx="172"
          cy="314"
          r="2.5"
          style={{ fill: 'var(--color-neutral-900)', stroke: 'none' }}
        />
        <rect
          x="104"
          y="174"
          width="136"
          height="32"
          rx="4"
          strokeWidth={1.5}
          style={{ fill: 'var(--color-neutral-0)' }}
        />
        <text
          x="172"
          y="195"
          textAnchor="middle"
          fontSize={14}
          fontWeight={500}
          style={{
            fill: 'var(--color-neutral-900)',
            stroke: 'none',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {tag}
        </text>
      </g>
    </svg>
  )
}
