'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CatalogSort } from '@/lib/data'

/**
 * Catalog filter island (DLSCatalog). Wraps the server-rendered product grid
 * (passed as children) with the filter aside and toolbar. All state is URL-
 * driven: every control writes query params and navigates, so pages are
 * shareable and SEO-canonical (§8). On tablet/mobile the aside becomes a sheet.
 *
 * Note (export↔DEV_CONTEXT, Р14): the demo's «Перевірка» group is a check
 * method (field removed in Р14) — replaced by «Стан» (conditionLabel). The demo
 * «З відео перевірки» extra has no queryable field and is omitted; «Акція»
 * (discountPercent) stays.
 */

export type Opt = { value: string; label: string; count?: number }
export type BrandOpt = { slug: string; name: string }

export type CatalogFiltersProps = {
  brands: BrandOpt[]
  modelsByBrand: Record<string, BrandOpt[]>
  categoryFacets: Opt[]
  current: {
    brand: string
    model: string
    cats: string[]
    priceFrom: number
    priceTo: number
    warr: string[]
    sides: string[]
    conds: string[]
    promo: boolean
    sort: CatalogSort
  }
  basePath: string // "/catalog" or "/ru/catalog" or ".../catalog/<category>"
  categoryLocked: string | null // slug when on /catalog/<category> (не чип)
  children: React.ReactNode
}

const PMIN = 100
const PMAX = 120000

const WARR_OPTS: Opt[] = [
  { value: '14', label: '14 днів' },
  { value: '30', label: '30 днів' },
  { value: '60', label: '60 днів' },
]
const SIDE_OPTS: Opt[] = [
  { value: 'left', label: 'Ліва' },
  { value: 'right', label: 'Права' },
]
const COND_OPTS: Opt[] = [
  { value: 'used_checked', label: 'Б/в, перевірений' },
  { value: 'used', label: 'Б/в' },
  { value: 'used_defects', label: 'Б/в, з дефектами' },
  { value: 'new', label: 'Новий' },
]
const SORT_OPTS: { value: CatalogSort; label: string }[] = [
  { value: 'pop', label: 'За популярністю' },
  { value: 'new', label: 'Спочатку нові' },
  { value: 'cheap', label: 'Спочатку дешевші' },
  { value: 'exp', label: 'Спочатку дорожчі' },
]

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// Non-linear price track (√), as the export.
const tOf = (v: number) => Math.sqrt((v - PMIN) / (PMAX - PMIN))

export function CatalogFilters({
  brands,
  modelsByBrand,
  categoryFacets,
  current,
  basePath,
  categoryLocked,
  children,
}: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sheet, setSheet] = useState(false)
  const [sheetShown, setSheetShown] = useState(false)
  const [acc, setAcc] = useState<Record<string, boolean>>({
    auto: true,
    cat: true,
    price: true,
    warr: false,
    side: false,
    cond: false,
    extra: false,
  })

  const openSheet = useCallback(() => {
    setSheet(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetShown(true)))
    document.body.style.overflow = 'hidden'
  }, [])
  const closeSheet = useCallback(() => {
    setSheetShown(false)
    document.body.style.overflow = ''
    window.setTimeout(() => setSheet(false), 250)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sheet) closeSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, closeSheet])

  // Build a URL from a param patch over the current params.
  const push = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      const p = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        p.delete(k)
        if (Array.isArray(v)) v.filter(Boolean).forEach((x) => p.append(k, x))
        else if (v != null && v !== '') p.set(k, v)
      }
      p.delete('shown') // reset pagination on any filter change
      const qs = p.toString()
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    },
    [router, basePath, searchParams],
  )

  const toggleArr = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

  const models = useMemo(
    () => (current.brand ? (modelsByBrand[current.brand] ?? []) : []),
    [current.brand, modelsByBrand],
  )

  // Active chips (car / categories / price / warr / side / cond / promo).
  const chips = useMemo(() => {
    const out: { label: string; onRemove: () => void }[] = []
    if (current.brand && current.model) {
      const b = brands.find((x) => x.slug === current.brand)?.name ?? current.brand
      const mName = models.find((x) => x.slug === current.model)?.name ?? current.model
      out.push({ label: `${b} ${mName}`, onRemove: () => push({ brand: null, model: null }) })
    } else if (current.brand) {
      const b = brands.find((x) => x.slug === current.brand)?.name ?? current.brand
      out.push({ label: b, onRemove: () => push({ brand: null, model: null }) })
    }
    current.cats
      .filter((c) => c !== categoryLocked)
      .forEach((c) => {
        const name = categoryFacets.find((f) => f.value === c)?.label ?? c
        out.push({
          label: name,
          onRemove: () => push({ cat: current.cats.filter((x) => x !== c) }),
        })
      })
    if (current.priceFrom > PMIN || current.priceTo < PMAX) {
      const label =
        current.priceFrom > PMIN && current.priceTo < PMAX
          ? `${fmt(current.priceFrom)} – ${fmt(current.priceTo)} ₴`
          : current.priceFrom > PMIN
            ? `від ${fmt(current.priceFrom)} ₴`
            : `до ${fmt(current.priceTo)} ₴`
      out.push({ label, onRemove: () => push({ pmin: null, pmax: null }) })
    }
    current.warr.forEach((v) =>
      out.push({
        label: `Гарантія ${WARR_OPTS.find((o) => o.value === v)?.label ?? v}`,
        onRemove: () => push({ warr: current.warr.filter((x) => x !== v) }),
      }),
    )
    current.sides.forEach((v) =>
      out.push({
        label: SIDE_OPTS.find((o) => o.value === v)?.label ?? v,
        onRemove: () => push({ side: current.sides.filter((x) => x !== v) }),
      }),
    )
    current.conds.forEach((v) =>
      out.push({
        label: COND_OPTS.find((o) => o.value === v)?.label ?? v,
        onRemove: () => push({ cond: current.conds.filter((x) => x !== v) }),
      }),
    )
    if (current.promo) out.push({ label: 'Акція', onRemove: () => push({ promo: null }) })
    return out
  }, [current, brands, models, categoryFacets, categoryLocked, push])

  const resetAll = () =>
    push({
      brand: null,
      model: null,
      cat: null,
      pmin: null,
      pmax: null,
      warr: null,
      side: null,
      cond: null,
      promo: null,
    })

  return (
    <div className="dls-cat">
      {/* overlay for the mobile/tablet sheet */}
      {sheet ? (
        <div
          aria-hidden
          onClick={closeSheet}
          className="dls-cat__overlay"
          style={{ opacity: sheetShown ? 1 : 0 }}
        />
      ) : null}

      <div className="dls-cat__layout">
        <aside
          aria-label="Фільтри"
          className="dls-cat__aside"
          data-sheet={sheet ? 'true' : 'false'}
          data-shown={sheetShown ? 'true' : 'false'}
        >
          <div className="dls-cat__asideInner">
            <div className="dls-cat__grab" aria-hidden />
            <div className="dls-cat__asideHead">
              <h2 className="dls-cat__asideTitle">Фільтри</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                <button type="button" onClick={resetAll} className="dls-cat__reset">
                  Скинути
                </button>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Закрити фільтри"
                  className="dls-cat__sheetClose"
                >
                  <Icon name="x" />
                </button>
              </div>
            </div>

            <div className="dls-cat__asideBody">
              <Accordion
                id="auto"
                title="Авто"
                open={acc.auto}
                onToggle={() => setAcc((s) => ({ ...s, auto: !s.auto }))}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                  <Select
                    label="Марка"
                    value={current.brand}
                    placeholder="Марка"
                    options={brands.map((b) => ({ value: b.slug, label: b.name }))}
                    onChange={(v) => push({ brand: v || null, model: null })}
                  />
                  <Select
                    label="Модель"
                    value={current.model}
                    placeholder="Модель"
                    disabled={!current.brand}
                    options={models.map((m) => ({ value: m.slug, label: m.name }))}
                    onChange={(v) => push({ model: v || null })}
                  />
                </div>
              </Accordion>

              <Accordion
                id="cat"
                title="Категорія"
                open={acc.cat}
                onToggle={() => setAcc((s) => ({ ...s, cat: !s.cat }))}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {categoryFacets.map((o) => (
                    <Check
                      key={o.value}
                      label={o.label}
                      count={o.count}
                      checked={current.cats.includes(o.value)}
                      disabled={o.value === categoryLocked}
                      onToggle={() => push({ cat: toggleArr(current.cats, o.value) })}
                    />
                  ))}
                </div>
              </Accordion>

              <Accordion
                id="price"
                title="Ціна"
                open={acc.price}
                onToggle={() => setAcc((s) => ({ ...s, price: !s.price }))}
              >
                <PriceRange
                  key={`${current.priceFrom}-${current.priceTo}`}
                  from={current.priceFrom}
                  to={current.priceTo}
                  onCommit={(f, t) =>
                    push({ pmin: f > PMIN ? String(f) : null, pmax: t < PMAX ? String(t) : null })
                  }
                />
              </Accordion>

              <Accordion
                id="warr"
                title="Гарантія"
                open={acc.warr}
                onToggle={() => setAcc((s) => ({ ...s, warr: !s.warr }))}
              >
                {WARR_OPTS.map((o) => (
                  <Check
                    key={o.value}
                    label={o.label}
                    checked={current.warr.includes(o.value)}
                    onToggle={() => push({ warr: toggleArr(current.warr, o.value) })}
                  />
                ))}
              </Accordion>

              <Accordion
                id="side"
                title="Сторона"
                open={acc.side}
                onToggle={() => setAcc((s) => ({ ...s, side: !s.side }))}
              >
                {SIDE_OPTS.map((o) => (
                  <Check
                    key={o.value}
                    label={o.label}
                    checked={current.sides.includes(o.value)}
                    onToggle={() => push({ side: toggleArr(current.sides, o.value) })}
                  />
                ))}
              </Accordion>

              <Accordion
                id="cond"
                title="Стан"
                open={acc.cond}
                onToggle={() => setAcc((s) => ({ ...s, cond: !s.cond }))}
              >
                {COND_OPTS.map((o) => (
                  <Check
                    key={o.value}
                    label={o.label}
                    checked={current.conds.includes(o.value)}
                    onToggle={() => push({ cond: toggleArr(current.conds, o.value) })}
                  />
                ))}
              </Accordion>

              <Accordion
                id="extra"
                title="Додатково"
                last
                open={acc.extra}
                onToggle={() => setAcc((s) => ({ ...s, extra: !s.extra }))}
              >
                <Check
                  label="Акція"
                  checked={current.promo}
                  onToggle={() => push({ promo: current.promo ? null : '1' })}
                />
              </Accordion>
            </div>

            <div className="dls-cat__sheetFoot">
              <button type="button" onClick={closeSheet} className="dls-cat__sheetApply">
                Показати
              </button>
            </div>
          </div>
        </aside>

        <section aria-label="Товари" style={{ minWidth: 0 }}>
          <div className="dls-cat__toolbar">
            <button type="button" onClick={openSheet} className="dls-cat__filterBtn">
              <Icon name="filter" />
              <span>Фільтри</span>
              {chips.length ? <span className="dls-cat__filterBadge">{chips.length}</span> : null}
            </button>
            <div className="dls-cat__chips">
              {chips.map((ch, i) => (
                <span key={i} className="dls-cat__chip">
                  <span className="dls-cat__chipLabel">{ch.label}</span>
                  <button
                    type="button"
                    onClick={ch.onRemove}
                    aria-label={`Прибрати фільтр: ${ch.label}`}
                    className="dls-cat__chipX"
                  >
                    <Icon name="x" small />
                  </button>
                </span>
              ))}
            </div>
            <label className="dls-cat__sortWrap">
              <Icon name="sort" />
              <select
                aria-label="Сортування"
                value={current.sort}
                onChange={(e) => push({ sort: e.target.value })}
                className="dls-cat__sort"
              >
                {SORT_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {children}
        </section>
      </div>
    </div>
  )
}

// -------------------------------------------------------------- sub-components
function Accordion({
  title,
  open,
  onToggle,
  last,
  children,
}: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="dls-cat__acc" data-last={last ? 'true' : 'false'}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="dls-cat__accHead">
        {title}
        <span className="dls-cat__accChevron" data-open={open ? 'true' : 'false'}>
          <Icon name="chevron" />
        </span>
      </button>
      <div className="dls-cat__accPanel" data-open={open ? 'true' : 'false'}>
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          <div className="dls-cat__accBody">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  options: Opt[]
  disabled?: boolean
  onChange: (v: string) => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="dls-cat__select"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="dls-cat__selectChevron" aria-hidden>
        <Icon name="chevron" />
      </span>
    </div>
  )
}

function Check({
  label,
  count,
  checked,
  disabled,
  onToggle,
}: {
  label: string
  count?: number
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="dls-cat__check"
      data-checked={checked ? 'true' : 'false'}
    >
      <span className="dls-cat__box" aria-hidden>
        <Icon name="tick" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {count != null ? <span className="dls-cat__count">{count}</span> : null}
    </button>
  )
}

function PriceRange({
  from,
  to,
  onCommit,
}: {
  from: number
  to: number
  onCommit: (from: number, to: number) => void
}) {
  // Uncontrolled inputs (keyed remount resets them when props change on nav).
  const [f, setF] = useState(String(from))
  const [t, setT] = useState(String(to))
  const commit = () => {
    const nf = Math.max(PMIN, Math.min(PMAX, parseInt(f.replace(/\D/g, ''), 10) || PMIN))
    const nt = Math.max(PMIN, Math.min(PMAX, parseInt(t.replace(/\D/g, ''), 10) || PMAX))
    onCommit(Math.min(nf, nt), Math.max(nf, nt))
  }
  return (
    <div style={{ padding: '0 var(--space-2)' }}>
      <div className="dls-cat__priceRow">
        <label className="dls-cat__priceField">
          <span className="dls-cat__pricePre">від</span>
          <input
            inputMode="numeric"
            aria-label="Ціна від"
            value={f}
            onChange={(e) => setF(e.target.value)}
            onBlur={commit}
            className="dls-cat__priceInput"
          />
        </label>
        <label className="dls-cat__priceField">
          <span className="dls-cat__pricePre">до</span>
          <input
            inputMode="numeric"
            aria-label="Ціна до"
            value={t}
            onChange={(e) => setT(e.target.value)}
            onBlur={commit}
            className="dls-cat__priceInput"
          />
        </label>
      </div>
      <div className="dls-cat__track" aria-hidden>
        <span className="dls-cat__trackBase" />
        <span
          className="dls-cat__trackFill"
          style={{ left: `${tOf(from) * 100}%`, right: `${(1 - tOf(to)) * 100}%` }}
        />
      </div>
      <div className="dls-cat__priceMinmax">
        <span>100 ₴</span>
        <span>120 000 ₴</span>
      </div>
    </div>
  )
}

function Icon({ name, small }: { name: string; small?: boolean }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: small ? 'dls-cat__icon dls-cat__icon--sm' : 'dls-cat__icon',
  }
  switch (name) {
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      )
    case 'sort':
      return (
        <svg {...common}>
          <path d="m21 16-4 4-4-4" />
          <path d="M17 20V4" />
          <path d="m3 8 4-4 4 4" />
          <path d="M7 4v16" />
        </svg>
      )
    case 'tick':
      return (
        <svg {...common} className="dls-cat__tick" strokeWidth={3}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )
    default:
      return null
  }
}
