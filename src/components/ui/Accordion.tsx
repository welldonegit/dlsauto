'use client'

import { useState, type ReactNode } from 'react'

import { ChevronDownIcon } from './icons'

/**
 * Accordion — single open or multiple. Grid-rows 0fr→1fr reveal (no height
 * animation jank), chevron rotates. Used in the footer (mobile nav) and FAQ.
 */
export type AccordionItem = { id: string; title: ReactNode; content: ReactNode }

export function Accordion({
  items,
  defaultOpen,
  divided = true,
}: {
  items: AccordionItem[]
  defaultOpen?: string[]
  divided?: boolean
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen ?? []))
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div
      style={{
        borderTop: divided ? `var(--border-hairline) solid var(--color-neutral-300)` : undefined,
      }}
    >
      {items.map((it) => {
        const isOpen = open.has(it.id)
        return (
          <div
            key={it.id}
            style={{
              borderBottom: divided
                ? `var(--border-hairline) solid var(--color-neutral-300)`
                : undefined,
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(it.id)}
              className="flex w-full cursor-pointer items-center justify-between font-sans font-semibold"
              style={{
                height: 'var(--control-h-56)',
                padding: 0,
                border: 'none',
                background: 'none',
                fontSize: 'var(--text-16)',
                color: 'var(--color-neutral-900)',
                textAlign: 'left',
              }}
            >
              {it.title}
              <ChevronDownIcon
                size="20"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: `transform var(--duration-300) var(--ease-brand)`,
                }}
              />
            </button>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                opacity: isOpen ? 1 : 0,
                transition: `grid-template-rows var(--duration-300) var(--ease-brand), opacity var(--duration-300) var(--ease-brand)`,
              }}
            >
              <div style={{ overflow: 'hidden', minHeight: 0 }}>
                <div style={{ padding: `0 0 var(--space-16)` }}>{it.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
