'use client'

import { useId, useState, type ReactNode } from 'react'

/**
 * Tooltip — hover/focus label (e.g. the donor-mark tooltip on a product card).
 * CSS-free positioning above the trigger; shows on hover and keyboard focus.
 * Transform/opacity only.
 */
export function Tooltip({
  content,
  children,
  forceOpen = false,
}: {
  content: ReactNode
  children: ReactNode
  forceOpen?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const show = open || forceOpen
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        aria-describedby={show ? id : undefined}
        tabIndex={0}
        className="inline-flex outline-none"
      >
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute left-1/2 bottom-full font-sans"
        style={{
          marginBottom: 'var(--space-8)',
          transform: show ? 'translate(-50%, 0)' : 'translate(-50%, var(--space-4))',
          opacity: show ? 1 : 0,
          transition: `opacity var(--duration-150) var(--ease-brand), transform var(--duration-150) var(--ease-brand)`,
          background: 'var(--color-neutral-900)',
          color: 'var(--color-neutral-0)',
          padding: 'var(--space-8) var(--space-12)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-13)',
          lineHeight: 'var(--text-13--line-height)',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-md)',
          zIndex: 20,
        }}
      >
        {content}
      </span>
    </span>
  )
}
