'use client'

import { useRef, useState } from 'react'

import { showToast } from '@/components/ui/ToastHost'

/** Copy-the-article button next to the OEM (DLSProduct): copies the value, flips to a
 * check for 3s and toasts «Артикул скопійовано». */
export function OemCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* clipboard unavailable — nothing more to do */
      }
      ta.remove()
    }
    showToast({ title: 'Артикул скопійовано' })
    setCopied(true)
    clearTimeout(t.current)
    t.current = setTimeout(() => setCopied(false), 3000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Артикул скопійовано' : 'Скопіювати артикул'}
      className="dls-pd-copy"
      data-copied={copied ? 'true' : 'false'}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="8" y="8" width="14" height="14" rx="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  )
}

/** "Додати в кошик" button in «З цим товаром купують» — cart is stage 5, so it toasts. */
export function CartAddButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        showToast({ title: 'Кошик — етап 5', description: 'Кошик запрацює на наступному етапі.' })
      }
      aria-label={label}
      className="dls-pd-with__add"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    </button>
  )
}
