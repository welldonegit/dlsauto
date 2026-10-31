'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { CheckIcon } from '@/components/ui/icons'
import { formatPhone, phoneDigits } from '@/components/ui/fields'

/**
 * Footer "Замовити дзвінок" — the same call-back action as in the header.
 * Client-side phone validation; submits to a stub for now (stage 1).
 */
export function FooterCallback() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <p
        role="status"
        className="flex items-center font-sans"
        style={{ margin: 0, gap: 'var(--space-8)', fontSize: 'var(--text-16)', color: 'var(--color-neutral-900)' }}
      >
        <span style={{ color: 'var(--color-success)' }}>
          <CheckIcon size="20" />
        </span>
        Дякуємо! Передзвонимо на {phone} протягом 15 хвилин у робочий час.
      </p>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (phoneDigits(phone).length < 9) {
          setError('Введіть номер телефону повністю')
          return
        }
        setSent(true)
      }}
      className="flex flex-col"
      style={{ gap: 'var(--space-16)' }}
    >
      <div className="flex flex-col md:flex-row" style={{ gap: 'var(--space-8)' }}>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-label="Номер телефону"
          placeholder="+380 __ ___ __ __"
          value={phone}
          onChange={(e) => {
            setPhone(formatPhone(e.target.value))
            setError('')
          }}
          className="min-w-0 flex-1 font-sans"
          style={{
            height: 'var(--control-h-48)',
            boxSizing: 'border-box',
            padding: '0 var(--space-16)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-neutral-100)',
            fontSize: 'var(--text-16)',
            color: 'var(--color-neutral-900)',
            outline: error ? 'var(--border-hairline) solid var(--color-error)' : 'none',
            outlineOffset: 'calc(-1 * var(--border-hairline))',
          }}
        />
        <Button type="submit" variant="primary" size="md">
          Замовити дзвінок
        </Button>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-14)', color: 'var(--color-neutral-500)' }}>
        Дзвонимо лише щодо вашого запиту
      </p>
      {error ? (
        <p role="alert" style={{ margin: 0, fontSize: 'var(--text-14)', color: 'var(--color-error)' }}>
          {error}
        </p>
      ) : null}
    </form>
  )
}
