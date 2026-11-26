'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CatalogSort } from '@/lib/data'

/**
 * Catalog filter island (DLSCatalog). Wraps the server-rendered product grid
 * (passed as children) with the filter aside and toolbar. All state is URL-
 * driven: every control writes query params and navigates, so pages are
 * shareable and SEO-canonical (§8). On tablet/mobile the aside becomes a sheet.
 *
 * Note (export↔DEV_CONTEXT, Р14): the demo's «Перевірка» group is a check
 * method (field removed in Р14) — replaced by «Стан» (conditionLabel). «Акція»
 * (discountPercent) and «З відео перевірки» stay in «Додатково»; the latter is
 * computed from the photos (a video among them, no stored field) and only shown
 * when some product actually carries one (`hasVideo`).
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
    video: boolean
    body: string // 'pickup' | 'suv' | 'passenger' | '' — set from the home sections, no filter control
    sort: CatalogSort
  }
  basePath: string // "/catalog" or "/ru/catalog" or ".../catalog/<category>"
  categoryLocked: string | null // slug when on /catalog/<category> (не чип)
  carFromCookie: boolean // car comes from the cookie pre-filter → removing it opts out (?car=off)
  hasVideo: boolean // show the «З відео перевірки» facet only when some product has a video
  brandLocked?: string | null // brand slug fixed by the path (/brand/<brand>…) — select disabled, no chip
  modelLocked?: string | null // model slug fixed by the path (/brand/<brand>/<model>) — select disabled, no chip
  modelBasePath?: string | null // on a brand page, picking a model navigates to `${modelBasePath}/<slug>`
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
const BODY_LABEL: Record<string, string> = {
  pickup: 'Пікапи',
  suv: 'Позашляховики',
  passenger: 'Легкові',
}
const SORT_OPTS: { value: CatalogSort; label: string }[] = [
  { value: 'pop', label: 'За популярністю' },
  { value: 'new', label: 'Спочатку нові' },
  { value: 'cheap', label: 'Спочатку дешевші' },
  { value: 'exp', label: 'Спочатку дорожчі' },
]

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// Non-linear price track (√), as the export: position ↔ value, snapped to 100 ₴.
const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
const tOf = (v: number) => Math.sqrt((v - PMIN) / (PMAX - PMIN))
const vOf = (t: number) => {
  const v = PMIN + (PMAX - PMIN) * t * t
  return Math.max(PMIN, Math.min(PMAX, Math.round(v / 100) * 100))
}
// One keyboard step ≈ 2% of the track (export).
const step = (v: number, dir: number) => vOf(clamp01(tOf(v) + dir * 0.02))
const GAP = 100 // minimum spread between the two handles (₴)

export function CatalogFilters({
  brands,
  modelsByBrand,
  categoryFacets,
  current,
  basePath,
  categoryLocked,
  carFromCookie,
  hasVideo,
  brandLocked = null,
  modelLocked = null,
  modelBasePath = null,
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
    // Removing the car opts out of the cookie pre-filter (?car=off) so it is not re-applied.
    const removeCar = () =>
      push(carFromCookie ? { brand: null, model: null, car: 'off' } : { brand: null, model: null })
    // No car chip when the brand is fixed by the path (/brand/<brand>…).
    if (!brandLocked && current.brand && current.model) {
      const b = brands.find((x) => x.slug === current.brand)?.name ?? current.brand
      const mName = models.find((x) => x.slug === current.model)?.name ?? current.model
      out.push({ label: `${b} ${mName}`, onRemove: removeCar })
    } else if (!brandLocked && current.brand) {
      const b = brands.find((x) => x.slug === current.brand)?.name ?? current.brand
      out.push({ label: b, onRemove: removeCar })
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
    if (current.video) out.push({ label: 'З відео перевірки', onRemove: () => push({ vid: null }) })
    // Body-type (from the home «на пікапи/позашляховики» links) — a removable chip,
    // no control in the panel (owner 25.11).
    if (BODY_LABEL[current.body])
      out.push({ label: BODY_LABEL[current.body], onRemove: () => push({ body: null }) })
    return out
  }, [current, brands, models, categoryFacets, categoryLocked, carFromCookie, brandLocked, push])

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
      vid: null,
      body: null,
      car: carFromCookie ? 'off' : null,
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
                    disabled={!!brandLocked}
                    options={brands.map((b) => ({ value: b.slug, label: b.name }))}
                    onChange={(v) => push({ brand: v || null, model: null, car: null })}
                  />
                  <Select
                    label="Модель"
                    value={current.model}
                    placeholder="Модель"
                    disabled={!!modelLocked || !current.brand}
                    options={models.map((m) => ({ value: m.slug, label: m.name }))}
                    onChange={(v) => {
                      // On a brand page a model picks the §8 model path; elsewhere it is a query filter.
                      if (modelBasePath) {
                        router.push(v ? `${modelBasePath}/${v}` : modelBasePath, { scroll: false })
                      } else {
                        push({ model: v || null, car: null })
                      }
                    }}
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
                {hasVideo ? (
                  <Check
                    label="З відео перевірки"
                    checked={current.video}
                    onToggle={() => push({ vid: current.video ? null : '1' })}
                  />
                ) : null}
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
  // Local handle values (keyed remount resets them when props change on nav). Text
  // overrides let the number inputs be typed freely before they commit on blur.
  const [lo, setLo] = useState(from)
  const [hi, setHi] = useState(to)
  const [loText, setLoText] = useState<string | null>(null)
  const [hiText, setHiText] = useState<string | null>(null)
  const [drag, setDrag] = useState<'lo' | 'hi' | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const committed = useRef({ lo: from, hi: to })
  // Authoritative live values, written synchronously so the commit on pointer-up /
  // key-up never races a not-yet-flushed render (pointermove is a lower-priority
  // event than pointerup in React).
  const valRef = useRef({ lo: from, hi: to })
  const setLoVal = (v: number) => {
    valRef.current.lo = v
    setLo(v)
  }
  const setHiVal = (v: number) => {
    valRef.current.hi = v
    setHi(v)
  }

  const commit = useCallback(
    (nlo: number, nhi: number) => {
      if (nlo === committed.current.lo && nhi === committed.current.hi) return
      committed.current = { lo: nlo, hi: nhi }
      onCommit(nlo, nhi)
    },
    [onCommit],
  )
  const commitRef = () => commit(valRef.current.lo, valRef.current.hi)

  // Drag: move the nearest handle to the pointer, keeping the 100 ₴ gap; commit on release.
  const setFromX = (clientX: number, which: 'lo' | 'hi') => {
    const el = trackRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const v = vOf(clamp01((clientX - r.left) / r.width))
    if (which === 'lo') setLoVal(Math.min(v, valRef.current.hi - GAP))
    else setHiVal(Math.max(v, valRef.current.lo + GAP))
  }

  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = clamp01((e.clientX - r.left) / r.width)
    const which =
      Math.abs(x - tOf(valRef.current.lo)) <= Math.abs(x - tOf(valRef.current.hi)) ? 'lo' : 'hi'
    el.setPointerCapture?.(e.pointerId)
    setDrag(which)
    setFromX(e.clientX, which)
  }
  const onTrackMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag) setFromX(e.clientX, drag)
  }
  const onTrackUp = () => {
    if (drag) {
      setDrag(null)
      commitRef()
    }
  }

  // Keyboard: arrows nudge the handle by one step; commit when the key is released.
  const keyDir = (e: React.KeyboardEvent): number =>
    e.key === 'ArrowRight' || e.key === 'ArrowUp'
      ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
        ? -1
        : 0
  const onKeyLo = (e: React.KeyboardEvent) => {
    const dir = keyDir(e)
    if (!dir) return
    e.preventDefault()
    setLoVal(Math.min(step(valRef.current.lo, dir), valRef.current.hi - GAP))
  }
  const onKeyHi = (e: React.KeyboardEvent) => {
    const dir = keyDir(e)
    if (!dir) return
    e.preventDefault()
    setHiVal(Math.max(step(valRef.current.hi, dir), valRef.current.lo + GAP))
  }

  const commitInputs = () => {
    const base = valRef.current
    const nlo = Math.max(
      PMIN,
      Math.min(PMAX, parseInt((loText ?? '').replace(/\D/g, ''), 10) || base.lo),
    )
    const nhi = Math.max(
      PMIN,
      Math.min(PMAX, parseInt((hiText ?? '').replace(/\D/g, ''), 10) || base.hi),
    )
    const a = Math.min(nlo, nhi)
    const b = Math.max(nlo, nhi)
    setLoVal(a)
    setHiVal(b)
    setLoText(null)
    setHiText(null)
    commit(a, b)
  }

  return (
    <div style={{ padding: '0 var(--space-2)' }}>
      <div className="dls-cat__priceRow">
        <label className="dls-cat__priceField">
          <span className="dls-cat__pricePre">від</span>
          <input
            inputMode="numeric"
            aria-label="Ціна від"
            value={loText ?? fmt(lo)}
            onChange={(e) => setLoText(e.target.value)}
            onBlur={commitInputs}
            className="dls-cat__priceInput"
          />
        </label>
        <label className="dls-cat__priceField">
          <span className="dls-cat__pricePre">до</span>
          <input
            inputMode="numeric"
            aria-label="Ціна до"
            value={hiText ?? fmt(hi)}
            onChange={(e) => setHiText(e.target.value)}
            onBlur={commitInputs}
            className="dls-cat__priceInput"
          />
        </label>
      </div>
      <div
        ref={trackRef}
        className="dls-cat__track"
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackUp}
      >
        <span className="dls-cat__trackBase" aria-hidden />
        <span
          className="dls-cat__trackFill"
          aria-hidden
          style={{ left: `${tOf(lo) * 100}%`, right: `${(1 - tOf(hi)) * 100}%` }}
        />
        <span
          role="slider"
          tabIndex={0}
          aria-label="Мінімальна ціна"
          aria-valuemin={PMIN}
          aria-valuemax={PMAX}
          aria-valuenow={lo}
          onKeyDown={onKeyLo}
          onKeyUp={commitRef}
          onBlur={commitRef}
          className="dls-cat__thumb"
          style={{ left: `${tOf(lo) * 100}%` }}
        />
        <span
          role="slider"
          tabIndex={0}
          aria-label="Максимальна ціна"
          aria-valuemin={PMIN}
          aria-valuemax={PMAX}
          aria-valuenow={hi}
          onKeyDown={onKeyHi}
          onKeyUp={commitRef}
          onBlur={commitRef}
          className="dls-cat__thumb"
          style={{ left: `${tOf(hi) * 100}%` }}
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
