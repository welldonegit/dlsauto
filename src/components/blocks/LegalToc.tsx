'use client'

import { useEffect, useState } from 'react'

import { ChevronDownIcon } from '@/components/ui/icons'

/**
 * Table of contents for the legal pages (STAGE_3A §2). Sticky on the left from
 * laptop up, a collapsible panel on mobile. Scroll-spy highlights the current
 * section (IntersectionObserver, transform/opacity only). Clicking a row
 * smooth-scrolls to the section; sections carry scroll-margin for the sticky
 * header. Active row: primary bar + neutral-900 text; inactive: faint bar +
 * neutral-600.
 */
export function LegalToc({
  sections,
  contentsLabel,
}: {
  sections: { id: string; title: string }[]
  contentsLabel: string
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el)
    if (!els.length || !('IntersectionObserver' in window)) return
    const visible = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio)
          else visible.delete(e.target.id)
        }
        // Topmost section with any part in the activation band wins.
        let top: string | null = null
        for (const el of els) {
          if (visible.has(el.id)) {
            top = el.id
            break
          }
        }
        if (top) setActive(top)
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: [0, 1] },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    setActive(id)
    setOpen(false)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }

  const list = (
    <ol
      className="flex min-w-0 flex-col"
      style={{ margin: 0, padding: 0, listStyle: 'none', gap: 'var(--space-2)' }}
    >
      {sections.map((s) => {
        const on = s.id === active
        return (
          <li key={s.id} style={{ minWidth: 0 }}>
            <a
              href={`#${s.id}`}
              aria-current={on ? 'location' : undefined}
              onClick={go(s.id)}
              className="flex items-start no-underline"
              style={{
                gap: 'var(--space-12)',
                padding: 'var(--space-8) 0',
                fontSize: 'var(--text-14)',
                lineHeight: 'var(--text-14--line-height)',
                fontWeight: on ? 600 : 400,
                color: on ? 'var(--color-neutral-900)' : 'var(--color-neutral-600)',
                transition: 'color var(--duration-200) var(--ease-brand)',
              }}
            >
              <span
                aria-hidden="true"
                className="shrink-0 self-stretch"
                style={{
                  width: 'var(--border-thick)',
                  borderRadius: 'var(--radius-full)',
                  background: on ? 'var(--color-primary)' : 'var(--color-neutral-200)',
                  transition: 'background var(--duration-200) var(--ease-brand)',
                }}
              />
              <span className="min-w-0">{s.title}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )

  return (
    <nav aria-label={contentsLabel} className="min-w-0">
      {/* Mobile: collapsible panel */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between"
          style={{
            height: 'var(--control-h-48)',
            padding: '0 var(--space-16)',
            border: 'var(--border-hairline) solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-neutral-white)',
            fontSize: 'var(--text-16)',
            fontWeight: 600,
            color: 'var(--color-neutral-900)',
          }}
        >
          {contentsLabel}
          <ChevronDownIcon
            size="20"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--duration-200) var(--ease-brand)',
            }}
          />
        </button>
        {open ? (
          <div
            style={{
              marginTop: 'var(--space-8)',
              padding: 'var(--space-8) var(--space-16)',
              border: 'var(--border-hairline) solid var(--color-neutral-200)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-neutral-white)',
            }}
          >
            {list}
          </div>
        ) : null}
      </div>

      {/* Laptop+: sticky list */}
      <div className="hidden lg:block lg:sticky" style={{ top: 'var(--space-32)' }}>
        {list}
      </div>
    </nav>
  )
}
