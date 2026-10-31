'use client'

import type { ReactNode } from 'react'

import { CloseIcon } from './icons'

/**
 * Toast — bottom-right status card (PROJECT_CONTEXT §3). Controlled by `open`;
 * slides/fades in with transform/opacity only. Optional action + dismiss.
 */
export function Toast({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean
  title: ReactNode
  description?: ReactNode
  onClose?: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed font-sans"
      style={{
        right: 'var(--space-24)',
        bottom: 'var(--space-24)',
        zIndex: 1000,
        width: 'var(--space-320)',
        maxWidth: 'calc(100vw - var(--space-32))',
        boxSizing: 'border-box',
        padding: `var(--space-16) var(--space-48) var(--space-16) var(--space-16)`,
        background: 'var(--color-neutral-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--color-neutral-900)',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(var(--space-12))',
        pointerEvents: open ? 'auto' : 'none',
        visibility: open ? 'visible' : 'hidden',
        transition: `opacity var(--duration-300) var(--ease-brand), transform var(--duration-300) var(--ease-brand)`,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-14)',
          lineHeight: 'var(--text-14--line-height)',
          fontWeight: 600,
        }}
      >
        {title}
      </p>
      {description ? (
        <p
          style={{
            margin: 'var(--space-2) 0 0',
            fontSize: 'var(--text-13)',
            lineHeight: 'var(--text-13--line-height)',
            color: 'var(--color-neutral-600)',
          }}
        >
          {description}
        </p>
      ) : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="absolute inline-flex cursor-pointer items-center justify-center"
          style={{
            top: 'var(--space-8)',
            right: 'var(--space-8)',
            width: 'var(--control-h-32)',
            height: 'var(--control-h-32)',
            padding: 0,
            border: 'none',
            borderRadius: 'var(--radius-full)',
            background: 'transparent',
            color: 'var(--color-neutral-600)',
          }}
        >
          <CloseIcon size="16" />
        </button>
      ) : null}
    </div>
  )
}
