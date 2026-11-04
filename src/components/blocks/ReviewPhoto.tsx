'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { CloseIcon } from '@/components/ui/icons'
import type { Media } from '@/payload-types'

/**
 * Review photo (DLSReviews export): a 64×64 thumbnail that opens a lightbox.
 * Click or Escape closes; the overlay traps scroll while open. Image-only, so
 * no focus trap beyond the close button. Rendered inside the server ReviewsBlock.
 */
export function ReviewPhoto({ photo }: { photo: Media }) {
  const [open, setOpen] = useState(false)
  const alt = photo.alt || 'Фото з відгуку'
  const thumb = photo.sizes?.thumb?.url ?? photo.url ?? ''
  const full = photo.sizes?.gallery?.url ?? photo.url ?? ''

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!thumb) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Відкрити фото: ${alt}`}
        className="relative block overflow-hidden transition-opacity duration-150 hover:opacity-85"
        style={{
          marginTop: 'var(--space-16)',
          width: 'var(--space-64)',
          height: 'var(--space-64)',
          padding: 0,
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-neutral-200)',
          cursor: 'zoom-in',
        }}
      >
        <Image
          src={thumb}
          alt={alt}
          width={64}
          height={64}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{
            padding: 'var(--space-64) var(--space-16)',
            background: 'rgba(18,22,28,0.85)',
            cursor: 'zoom-out',
          }}
        >
          <Image
            src={full}
            alt={alt}
            width={photo.width ?? 1200}
            height={photo.height ?? 900}
            onClick={(e) => e.stopPropagation()}
            sizes="(min-width: 960px) 60rem, 100vw"
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-lg)',
              cursor: 'auto',
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрити"
            className="absolute flex items-center justify-center"
            style={{
              top: 'var(--space-16)',
              right: 'var(--space-16)',
              width: 'var(--control-h-48)',
              height: 'var(--control-h-48)',
              padding: 0,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-neutral-0)',
              color: 'var(--color-neutral-900)',
              cursor: 'pointer',
            }}
          >
            <CloseIcon size="24" />
          </button>
        </div>
      ) : null}
    </>
  )
}
