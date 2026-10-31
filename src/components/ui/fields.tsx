'use client'

import {
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'

import { CheckIcon, ChevronDownIcon } from './icons'

/**
 * Form controls. Floating-label fields (label rises on focus / when filled),
 * one control height (56), shared error styling. Error state uses primary red
 * to match the Контакти export 1:1. Interactive → client components.
 */

type FieldState = { focused: boolean; filled: boolean; error?: string }

function fieldBorder(s: FieldState): string {
  if (s.error) return 'var(--color-primary)'
  if (s.focused) return 'var(--color-neutral-900)'
  return 'transparent'
}

function labelStyle(up: boolean) {
  return {
    position: 'absolute' as const,
    left: 'var(--space-16)',
    top: up ? 'var(--space-8)' : 'var(--space-16)',
    fontSize: up ? 'var(--text-12)' : 'var(--text-16)',
    lineHeight: 1.2,
    color: 'var(--color-neutral-500)',
    pointerEvents: 'none' as const,
    transition: `top var(--duration-150) var(--ease-brand), font-size var(--duration-150) var(--ease-brand)`,
  }
}

const shellStyle = (s: FieldState) => ({
  position: 'relative' as const,
  boxSizing: 'border-box' as const,
  border: `var(--border-hairline) solid ${fieldBorder(s)}`,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-neutral-100)',
  transition: `border-color var(--duration-150) var(--ease-brand)`,
})

const controlStyle = {
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  padding: 'var(--space-24) var(--space-16) var(--space-4)',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 'var(--text-16)',
  lineHeight: 'var(--text-16--line-height)',
  color: 'var(--color-neutral-900)',
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 'var(--space-4) 0 0',
        fontSize: 'var(--text-13)',
        lineHeight: 'var(--text-13--line-height)',
        color: 'var(--color-primary)',
      }}
    >
      {children}
    </p>
  )
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'className'> & {
  label: string
  error?: string
  /** Static state for the /ui showcase. */
  forceState?: 'focus'
}

export function TextField({
  label,
  error,
  required,
  forceState,
  onFocus,
  onBlur,
  onChange,
  defaultValue,
  value,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const [focused, setFocused] = useState(forceState === 'focus')
  const [filled, setFilled] = useState(Boolean(defaultValue ?? value))
  const up = focused || filled
  const state: FieldState = { focused, filled, error }
  return (
    <div>
      <div style={{ height: 'var(--control-h-56)', ...shellStyle(state) }}>
        <label htmlFor={id} style={labelStyle(up)}>
          {label}
          {required ? '*' : ''}
        </label>
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            if (forceState !== 'focus') setFocused(false)
            onBlur?.(e)
          }}
          onChange={(e) => {
            setFilled(e.target.value.length > 0)
            onChange?.(e)
          }}
          style={controlStyle}
          {...rest}
        />
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  )
}

/** Ukrainian phone field: formats to +380 XX XXX XX XX, stores 9 digits. */
export function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('380')) d = d.slice(3)
  else if (d.startsWith('0')) d = d.slice(1)
  d = d.slice(0, 9)
  if (!d) return ''
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return '+380 ' + parts.join(' ')
}

export function phoneDigits(formatted: string): string {
  let d = formatted.replace(/\D/g, '')
  if (d.startsWith('380')) d = d.slice(3)
  return d.slice(0, 9)
}

export function PhoneField({
  label = 'Телефон',
  required,
  error,
  value,
  onValueChange,
  forceState,
}: {
  label?: string
  required?: boolean
  error?: string
  value: string
  onValueChange: (formatted: string) => void
  forceState?: 'focus'
}) {
  const id = useId()
  const [focused, setFocused] = useState(forceState === 'focus')
  const up = focused || value.length > 0
  const state: FieldState = { focused, filled: value.length > 0, error }
  return (
    <div>
      <div style={{ height: 'var(--control-h-56)', ...shellStyle(state) }}>
        <label htmlFor={id} style={labelStyle(up)}>
          {label}
          {required ? '*' : ''}
        </label>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          aria-invalid={error ? true : undefined}
          value={focused && !value ? '+380 ' : value}
          onFocus={() => setFocused(true)}
          onBlur={() => forceState !== 'focus' && setFocused(false)}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onValueChange(formatPhone(e.target.value))
          }
          style={controlStyle}
        />
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  )
}

export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style' | 'className'
> & { label: string; error?: string; forceState?: 'focus' }

export function TextArea({
  label,
  error,
  required,
  rows = 4,
  forceState,
  onFocus,
  onBlur,
  onChange,
  defaultValue,
  ...rest
}: TextAreaProps) {
  const id = useId()
  const [focused, setFocused] = useState(forceState === 'focus')
  const [filled, setFilled] = useState(Boolean(defaultValue))
  const up = focused || filled
  const state: FieldState = { focused, filled, error }
  return (
    <div>
      <div style={shellStyle(state)}>
        <label htmlFor={id} style={labelStyle(up)}>
          {label}
          {required ? '*' : ''}
        </label>
        <textarea
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            if (forceState !== 'focus') setFocused(false)
            onBlur?.(e)
          }}
          onChange={(e) => {
            setFilled(e.target.value.length > 0)
            onChange?.(e)
          }}
          style={{ ...controlStyle, height: 'auto', resize: 'vertical', display: 'block' }}
          {...rest}
        />
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  )
}

/** Floating-label native select with a line-set chevron. */
export function Select({
  label,
  required,
  error,
  options,
  defaultValue = '',
  onChange,
  forceState,
}: {
  label: string
  required?: boolean
  error?: string
  options: { value: string; label: string }[]
  defaultValue?: string
  onChange?: (value: string) => void
  forceState?: 'focus'
}) {
  const id = useId()
  const [focused, setFocused] = useState(forceState === 'focus')
  const [filled, setFilled] = useState(Boolean(defaultValue))
  const up = focused || filled
  const state: FieldState = { focused, filled, error }
  return (
    <div>
      <div style={{ height: 'var(--control-h-56)', ...shellStyle(state) }}>
        <label htmlFor={id} style={labelStyle(up)}>
          {label}
          {required ? '*' : ''}
        </label>
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          defaultValue={defaultValue}
          onFocus={() => setFocused(true)}
          onBlur={() => forceState !== 'focus' && setFocused(false)}
          onChange={(e) => {
            setFilled(e.target.value.length > 0)
            onChange?.(e.target.value)
          }}
          style={{
            ...controlStyle,
            appearance: 'none',
            cursor: 'pointer',
            paddingRight: 'var(--space-48)',
          }}
        >
          <option value="" disabled hidden />
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size="20"
          style={{
            position: 'absolute',
            right: 'var(--space-16)',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--color-neutral-900)',
          }}
        />
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  )
}

/** Checkbox with a line-set check. */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  forceState,
}: {
  label: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  forceState?: 'checked'
}) {
  const [internal, setInternal] = useState(defaultChecked ?? false)
  const isChecked = checked ?? internal ?? forceState === 'checked'
  const on = forceState === 'checked' ? true : isChecked
  return (
    <label className="inline-flex cursor-pointer items-start" style={{ gap: 'var(--space-12)' }}>
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center"
        style={{
          width: 'var(--icon-24)',
          height: 'var(--icon-24)',
          borderRadius: 'var(--radius-xs)',
          border: `var(--border-hairline) solid ${on ? 'var(--color-primary)' : 'var(--color-neutral-300)'}`,
          background: on ? 'var(--color-primary)' : 'transparent',
          color: 'var(--color-neutral-0)',
          transition: `background var(--duration-150) var(--ease-brand), border-color var(--duration-150) var(--ease-brand)`,
        }}
      >
        {on ? <CheckIcon size="16" /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => {
          setInternal(e.target.checked)
          onChange?.(e.target.checked)
        }}
      />
      <span
        style={{
          fontSize: 'var(--text-14)',
          lineHeight: 'var(--text-14--line-height)',
          color: 'var(--color-neutral-600)',
        }}
      >
        {label}
      </span>
    </label>
  )
}
