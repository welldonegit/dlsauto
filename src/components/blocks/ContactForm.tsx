'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { CameraIcon, CheckIcon, CloseIcon } from '@/components/ui/icons'
import { PhoneField, TextField, phoneDigits } from '@/components/ui/fields'
import { submitPartQuestion } from '@/app/(frontend)/[locale]/contacts/actions'

/**
 * «Запитати про деталь» — client form from the Контакти export (car optional,
 * what required, phone required, up to 5 JPG/PNG photos ≤10 MB). Validates on
 * the client; submits to a stub server action and shows the success panel plus
 * a toast (stage 1 — no persistence yet).
 */

type Photo = { id: string; name: string; url: string }

const MAX_PHOTOS = 5
const MAX_BYTES = 10 * 1024 * 1024

export function ContactForm() {
  const [car, setCar] = useState('')
  const [what, setWhat] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ what?: string; phone?: string }>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [fileError, setFileError] = useState('')
  const [drag, setDrag] = useState(false)
  const [sent, setSent] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url))
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [photos],
  )

  function addFiles(list: FileList | null) {
    const files = Array.from(list ?? [])
    const room = MAX_PHOTOS - photos.length
    const ok = files.filter((f) => /^image\/(jpeg|png)$/.test(f.type) && f.size <= MAX_BYTES)
    const take = ok.slice(0, Math.max(0, room))
    const rejected = files.length - take.length
    const add = take.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    setPhotos((prev) => [...prev, ...add])
    setFileError(
      rejected > 0 ? 'Частину файлів не додано: лише JPG або PNG до 10 МБ, не більше 5 фото' : '',
    )
    setDrag(false)
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const p = prev.find((x) => x.id === id)
      if (p) URL.revokeObjectURL(p.url)
      return prev.filter((x) => x.id !== id)
    })
    setFileError('')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: { what?: string; phone?: string } = {}
    if (!what.trim()) next.what = 'Заповніть це поле'
    if (phoneDigits(phone).length < 9) next.phone = 'Вкажіть номер повністю'
    setErrors(next)
    if (next.what || next.phone) return
    await submitPartQuestion({ car, what, phone, photoCount: photos.length })
    setSent(true)
    setToastOpen(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastOpen(false), 4000)
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.url))
    setCar('')
    setWhat('')
    setPhone('')
    setErrors({})
    setPhotos([])
    setFileError('')
    setSent(false)
  }

  const cardStyle = {
    boxSizing: 'border-box' as const,
    background: 'var(--color-neutral-white)',
    border: 'var(--border-hairline) solid var(--color-neutral-200)',
    borderRadius: 'var(--radius-lg)',
  }

  if (sent) {
    return (
      <>
        <div
          className="p-[var(--space-16)] md:p-[var(--space-24)] wide:p-[var(--space-32)]"
          style={cardStyle}
        >
          <div
            role="status"
            className="flex flex-col items-center justify-center text-center"
            style={{ minHeight: 'var(--space-320)', gap: 'var(--space-24)' }}
          >
            <span
              className="flex items-center justify-center"
              style={{
                width: 'var(--icon-40)',
                height: 'var(--icon-40)',
                borderRadius: 'var(--radius-full)',
                border: 'var(--border-thick) solid var(--color-success)',
                color: 'var(--color-success)',
              }}
            >
              <CheckIcon size="24" />
            </span>
            <p className="font-semibold" style={{ margin: 0, maxWidth: '45ch', fontSize: 'var(--text-20)', color: 'var(--color-neutral-900)' }}>
              Отримали. Відповімо протягом 15 хвилин у робочий час
            </p>
            <Button variant="secondary" size="md" onClick={reset}>
              Надіслати ще одне
            </Button>
          </div>
        </div>
        <Toast
          open={toastOpen}
          title="Заявку надіслано"
          description="Відповімо протягом 15 хвилин у робочий час"
          onClose={() => setToastOpen(false)}
        />
      </>
    )
  }

  return (
    <div className="p-[var(--space-16)] md:p-[var(--space-24)] wide:p-[var(--space-32)]" style={cardStyle}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col" style={{ gap: 'var(--space-16)' }}>
        <TextField
          label="Марка і модель авто"
          value={car}
          onChange={(e) => setCar(e.target.value)}
          placeholder="Наприклад, Ford Ranger 2009"
        />
        <TextField
          label="Що шукаєте"
          required
          error={errors.what}
          value={what}
          onChange={(e) => {
            setWhat(e.target.value)
            setErrors((x) => ({ ...x, what: undefined }))
          }}
          placeholder="Наприклад, фара ліва або OEM-номер"
        />
        <PhoneField
          required
          value={phone}
          error={errors.phone}
          onValueChange={(v) => {
            setPhone(v)
            setErrors((x) => ({ ...x, phone: undefined }))
          }}
        />

        {/* photo upload */}
        <div className="flex flex-col" style={{ gap: 'var(--space-12)' }}>
          {photos.length < MAX_PHOTOS ? (
            <label
              onDragOver={(e) => {
                e.preventDefault()
                if (!drag) setDrag(true)
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                addFiles(e.dataTransfer.files)
              }}
              className="flex cursor-pointer flex-col items-center justify-center text-center"
              style={{
                gap: 'var(--space-8)',
                padding: 'var(--space-24) var(--space-16)',
                boxSizing: 'border-box',
                border: `var(--border-hairline) dashed ${drag ? 'var(--color-neutral-900)' : 'var(--color-neutral-300)'}`,
                borderRadius: 'var(--radius-sm)',
                background: drag ? 'var(--color-neutral-100)' : 'var(--color-neutral-0)',
                transition: 'background var(--duration-150) var(--ease-brand), border-color var(--duration-150) var(--ease-brand)',
              }}
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
                className="sr-only"
              />
              <span style={{ color: 'var(--color-neutral-600)' }}>
                <CameraIcon size="32" />
              </span>
              <span className="font-semibold" style={{ fontSize: 'var(--text-16)', color: 'var(--color-neutral-900)' }}>
                Додайте фото деталі або номера
              </span>
              <span style={{ fontSize: 'var(--text-13)', color: 'var(--color-neutral-600)' }}>
                JPG, PNG, до 10 МБ, до 5 фото
              </span>
            </label>
          ) : null}

          {photos.length > 0 ? (
            <div className="flex flex-wrap" style={{ gap: 'var(--space-8)' }}>
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative overflow-hidden"
                  style={{ width: 'var(--space-80)', height: 'var(--space-80)', borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-200)' }}
                >
                  {/* object-URL preview — plain img is correct for a transient blob */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} className="block h-full w-full" style={{ objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    aria-label="Видалити фото"
                    className="absolute flex cursor-pointer items-center justify-center"
                    style={{
                      top: 'var(--space-4)',
                      right: 'var(--space-4)',
                      width: 'var(--icon-24)',
                      height: 'var(--icon-24)',
                      padding: 0,
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-scrim)',
                      color: 'var(--color-neutral-0)',
                    }}
                  >
                    <CloseIcon size="16" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {fileError ? (
            <p style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--color-primary)' }}>{fileError}</p>
          ) : null}
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth>
          Надіслати
        </Button>
        <p className="text-center" style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--color-neutral-600)', textWrap: 'pretty' }}>
          Натискаючи, ви погоджуєтесь з{' '}
          <a href="#" style={{ color: 'var(--color-neutral-900)', textDecoration: 'underline', textUnderlineOffset: 'var(--space-4)' }}>
            політикою конфіденційності
          </a>
        </p>
      </form>
    </div>
  )
}
