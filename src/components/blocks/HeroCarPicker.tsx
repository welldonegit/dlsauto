'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import type { Locale } from '@/i18n/config'
import { partsLabel } from '@/lib/rules'

/**
 * "Підібрати за моїм авто" — the white search card on the home first screen
 * (Головна-B export). Cascading selects Марка → Модель, then a free-text part
 * field (PROJECT_CONTEXT §3). Each resolved step turns its red dot on and fills
 * one progress bar; the submit label counts the parts for the chosen model.
 *
 * Deferred (stage 4): the part field's autocomplete — the field, focus state
 * and a debounced query are present, but the lookup is a stub that returns
 * nothing, so the suggestion list never opens. Submit routes to the real §8
 * catalog URL; those pages land in stage 3c.
 */

export type PickerModel = { slug: string; label: string; partsCount: number }
export type PickerBrand = { slug: string; name: string; logo: string | null; models: PickerModel[] }
type Field = 'brand' | 'model' | 'part'

// Stage-4 stub: no part index yet, so autocomplete always resolves to empty.
async function searchParts(query: string): Promise<string[]> {
  void query // the term will hit the search API once stage 4 lands
  return []
}

export function HeroCarPicker({ brands, locale }: { brands: PickerBrand[]; locale: Locale }) {
  const router = useRouter()
  const [brand, setBrand] = useState(brands[0]?.slug ?? '')
  const [model, setModel] = useState('')
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<Field | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const brandObj = brands.find((b) => b.slug === brand)
  const models = brandObj?.models ?? []
  const modelObj = models.find((m) => m.slug === model)
  const hasBrand = !!brandObj
  const hasModel = !!modelObj
  const count = modelObj?.partsCount ?? 0

  // Debounced part lookup (stage-4 stub — resolves empty, so the list stays
  // closed). The query is captured and sent to the stub after a 200ms pause.
  useEffect(() => {
    const q = query.trim()
    if (!hasModel || q.length < 1) return
    const id = setTimeout(() => {
      void searchParts(q).then(setSuggestions)
    }, 200)
    return () => clearTimeout(id)
  }, [query, hasModel])

  const bc = (field: Field, filled: boolean) =>
    focus === field
      ? 'var(--color-neutral-900)'
      : filled
        ? 'var(--color-neutral-300)'
        : 'var(--color-neutral-200)'
  const ring = (field: Field) =>
    focus === field
      ? 'inset 0 0 0 var(--border-hairline) var(--color-neutral-900), 0 0 0 0.25rem rgba(30,35,43,0.08)'
      : 'none'
  // Hover tint only when the field is idle and interactive (matches the export).
  const hoverClass = (field: Field, enabled: boolean) =>
    enabled && focus !== field ? 'hover:border-[color:var(--color-neutral-400)]' : ''

  const showSuggest = focus === 'part' && suggestions.length > 0

  const submit = () => {
    if (!hasBrand) return
    const prefix = locale === 'uk' ? '' : '/ru'
    let url = `${prefix}/brand/${brand}`
    if (hasModel) url += `/${model}`
    const q = query.trim()
    if (q) url += `?q=${encodeURIComponent(q)}`
    router.push(url)
  }

  const fieldWrap = 'flex flex-col gap-[var(--space-8)]'
  const controlBase =
    'relative box-border rounded-[var(--radius-sm)] border-[length:var(--border-hairline)] border-solid'

  return (
    <div
      className="min-w-0 box-border p-[var(--space-24)] md:p-[var(--space-32)]"
      style={{
        background: 'var(--color-neutral-0)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 0.75rem 2rem rgba(18,22,28,0.16)',
      }}
    >
      <h3
        className="text-20 md:text-24"
        style={{
          margin: 0,
          lineHeight: 1.25,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--color-neutral-900)',
        }}
      >
        Підібрати за моїм авто
      </h3>

      {/* three progress tracks */}
      <div
        aria-hidden="true"
        className="mt-[var(--space-16)] grid grid-cols-3 gap-[var(--space-8)]"
      >
        {[hasBrand, hasModel, false].map((on, i) => (
          <span
            key={i}
            className="overflow-hidden"
            style={{
              height: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-neutral-200)',
            }}
          >
            <span
              className="block"
              style={{
                height: '100%',
                width: on ? '100%' : '0%',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                transition: 'width var(--duration-600) var(--ease-brand)',
              }}
            />
          </span>
        ))}
      </div>

      <div className="mt-[var(--space-32)] flex flex-col gap-[var(--space-24)]">
        {/* Марка */}
        <div className={fieldWrap}>
          <PickerLabel htmlFor="heroB-brand" on={hasBrand} color="var(--color-neutral-900)">
            Марка
          </PickerLabel>
          <div
            className={`${controlBase} ${hoverClass('brand', true)}`}
            style={{
              height: 'var(--control-h-56)',
              borderColor: bc('brand', hasBrand),
              boxShadow: ring('brand'),
              background: 'var(--color-neutral-0)',
              transition:
                'border-color var(--duration-300) var(--ease-brand), box-shadow var(--duration-300) var(--ease-brand)',
            }}
          >
            {brandObj?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- tiny inline SVG mark, next/image adds no value
              <img
                src={brandObj.logo}
                alt=""
                className="pointer-events-none absolute object-contain"
                style={{
                  left: 'var(--space-16)',
                  top: '50%',
                  marginTop: 'calc(var(--icon-24) / -2)',
                  width: 'var(--icon-24)',
                  height: 'var(--icon-24)',
                }}
              />
            ) : null}
            <select
              id="heroB-brand"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value)
                setModel('')
                setQuery('')
              }}
              onFocus={() => setFocus('brand')}
              onBlur={() => setFocus(null)}
              className="h-full w-full box-border cursor-pointer appearance-none bg-transparent text-16 outline-none"
              style={{
                paddingRight: 'var(--space-48)',
                paddingLeft: brandObj?.logo
                  ? 'calc(var(--space-16) + var(--icon-24) + var(--space-12))'
                  : 'var(--space-16)',
                color: brand ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)',
              }}
            >
              <option value="" disabled>
                Оберіть марку
              </option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <Chevron open={focus === 'brand'} stroke="var(--color-neutral-900)" />
          </div>
        </div>

        {/* Модель */}
        <div className={fieldWrap}>
          <PickerLabel
            htmlFor="heroB-model"
            on={hasModel}
            color={hasBrand ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)'}
          >
            Модель
          </PickerLabel>
          <div
            className={`${controlBase} ${hoverClass('model', hasBrand)}`}
            style={{
              height: 'var(--control-h-56)',
              borderColor: bc('model', hasModel),
              boxShadow: ring('model'),
              background: hasBrand ? 'var(--color-neutral-0)' : 'var(--color-neutral-100)',
              transition:
                'border-color var(--duration-300) var(--ease-brand), box-shadow var(--duration-300) var(--ease-brand), background var(--duration-300) var(--ease-brand)',
            }}
          >
            <select
              id="heroB-model"
              value={model}
              disabled={!hasBrand}
              onChange={(e) => {
                setModel(e.target.value)
                setQuery('')
              }}
              onFocus={() => setFocus('model')}
              onBlur={() => setFocus(null)}
              className="h-full w-full box-border appearance-none bg-transparent px-[var(--space-16)] text-16 outline-none disabled:cursor-not-allowed"
              style={{
                paddingRight: 'var(--space-48)',
                cursor: hasBrand ? 'pointer' : 'not-allowed',
                color: model
                  ? 'var(--color-neutral-900)'
                  : hasBrand
                    ? 'var(--color-neutral-500)'
                    : 'var(--color-neutral-400)',
              }}
            >
              <option value="" disabled>
                {hasBrand ? 'Оберіть модель' : 'Спочатку марка'}
              </option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.label}
                </option>
              ))}
            </select>
            <Chevron
              open={focus === 'model'}
              stroke={hasBrand ? 'var(--color-neutral-900)' : 'var(--color-neutral-400)'}
            />
          </div>
        </div>

        {/* Деталь */}
        <div className={fieldWrap}>
          <PickerLabel
            htmlFor="heroB-part"
            on={false}
            color={hasModel ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)'}
            hint="(необовʼязково)"
          >
            Деталь
          </PickerLabel>
          <div className="relative">
            <input
              id="heroB-part"
              type="text"
              autoComplete="off"
              placeholder="Наприклад, фара ліва"
              value={query}
              disabled={!hasModel}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocus('part')}
              onBlur={() => setFocus(null)}
              className={`w-full h-[var(--control-h-56)] box-border px-[var(--space-16)] rounded-[var(--radius-sm)] border-[length:var(--border-hairline)] border-solid text-16 outline-none ${hoverClass('part', hasModel)}`}
              style={{
                borderColor: bc('part', !!query),
                boxShadow: ring('part'),
                background: hasModel ? 'var(--color-neutral-0)' : 'var(--color-neutral-100)',
                color: 'var(--color-neutral-900)',
                transition:
                  'border-color var(--duration-300) var(--ease-brand), box-shadow var(--duration-300) var(--ease-brand), background var(--duration-300) var(--ease-brand)',
              }}
            />
            {showSuggest ? (
              <div
                role="listbox"
                className="absolute left-0 right-0 py-[var(--space-8)]"
                style={{
                  zIndex: 5,
                  top: 'calc(var(--control-h-56) + var(--space-8))',
                  background: 'var(--color-neutral-0)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 0.75rem 2rem rgba(18,22,28,0.16)',
                }}
              >
                {suggestions.map((s) => (
                  <div
                    key={s}
                    role="option"
                    aria-selected={false}
                    className="flex items-center h-[var(--control-h-48)] px-[var(--space-16)] text-16 cursor-pointer"
                    style={{ color: 'var(--color-neutral-900)' }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-[var(--space-32)]">
        <Button variant="primary" size="lg" fullWidth disabled={!hasBrand} onClick={submit}>
          {hasModel ? `Показати ${partsLabel(count)}` : 'Знайти деталі'}
        </Button>
      </div>
    </div>
  )
}

function PickerLabel({
  htmlFor,
  on,
  color,
  hint,
  children,
}: {
  htmlFor: string
  on: boolean
  color: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-[var(--space-8)] text-14"
      style={{ lineHeight: 1.4 }}
    >
      <span
        aria-hidden="true"
        className="shrink-0 box-border rounded-full"
        style={{
          width: 'var(--space-8)',
          height: 'var(--space-8)',
          border: 'calc(var(--border-hairline) * 1.5) solid var(--color-primary)',
          background: on ? 'var(--color-primary)' : 'transparent',
          transition: 'background var(--duration-200) ease-out',
        }}
      />
      <span
        style={{
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {children}
      </span>
      {hint ? <span style={{ color: 'var(--color-neutral-500)' }}>{hint}</span> : null}
    </label>
  )
}

function Chevron({ open, stroke }: { open: boolean; stroke: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className="pointer-events-none absolute"
      style={{
        right: 'var(--space-16)',
        top: '50%',
        marginTop: 'calc(var(--icon-20) / -2)',
        width: 'var(--icon-20)',
        height: 'var(--icon-20)',
        fill: 'none',
        stroke,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition:
          'transform var(--duration-300) var(--ease-brand), stroke var(--duration-300) var(--ease-brand)',
      }}
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}
