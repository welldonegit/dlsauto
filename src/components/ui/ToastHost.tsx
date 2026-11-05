'use client'

import { useEffect, useRef, useState } from 'react'

import { Toast } from './Toast'

/**
 * Global toast outlet. Any component fires `showToast(...)`; this host (mounted
 * once in the layout) renders the single Toast and auto-dismisses it. Decoupled
 * via a window CustomEvent so callers need no context/provider wiring.
 */

type ToastDetail = { title: string; description?: string }

export function showToast(detail: ToastDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ToastDetail>('dls:toast', { detail }))
}

export function ToastHost() {
  const [toast, setToast] = useState<ToastDetail | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const onToast = (e: Event) => {
      setToast((e as CustomEvent<ToastDetail>).detail)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setToast(null), 4000)
    }
    window.addEventListener('dls:toast', onToast)
    return () => {
      window.removeEventListener('dls:toast', onToast)
      clearTimeout(timer.current)
    }
  }, [])

  return (
    <Toast
      open={!!toast}
      title={toast?.title ?? ''}
      description={toast?.description}
      onClose={() => setToast(null)}
    />
  )
}
