'use client'

import { useEffect, useRef, useState } from 'react'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Шлях деталі" (STAGE_3A §3). A scroll-scrubbed, pinned narrative: a line car
 * is bought, disassembled, tested, defect-marked, published as a product card,
 * then shipped. The scene is bespoke line-art in code (like the hero disc);
 * the step labels/text come from the CMS block. Scrolling through the pinned
 * track advances the scene; the stepper dots also jump to a step. Everything
 * animates via transform/opacity (plus a dash-draw for the defect marks).
 *
 * Desktop/laptop: pinned 600vh track, 100vh sticky stage. Mobile/tablet: a
 * shorter scrubbed track with the scene stacked under a horizontal stepper.
 */

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
const T = (s: number, k: number) => ease(clamp((s - k + 0.2) / 0.4))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const r2 = (n: number) => Math.round(n * 100) / 100
const tr = (x: number, y: number) => `translate(${r2(x)} ${r2(y)})`
const HEAD: [number, number, number][] = [
  [174, 340, 0.8],
  [90, 250, 1],
  [400, 250, 5],
  [400, 280, 5],
  [400, 206, 4],
]
const MARKS: [number, number, number][] = [
  [-12, -5, 2.6],
  [8, 6, 2.2],
  [11, -5, 2.4],
]

type Scene = Record<string, string | number>

function scene(s: number): Scene {
  const t1 = T(s, 1),
    t2 = T(s, 2),
    t3 = T(s, 3),
    t4 = T(s, 4),
    t5 = T(s, 5)
  const dim = clamp(1 - 0.8 * t2 - 0.2 * t3)
  let [hx, hy, hs] = HEAD[0]
  ;[t1, t2, t3, t4].forEach((t, i) => {
    hx = lerp(hx, HEAD[i + 1][0], t)
    hy = lerp(hy, HEAD[i + 1][1], t)
    hs = lerp(hs, HEAD[i + 1][2], t)
  })
  const k5 = 1 - 0.5 * t5
  hx = 400 + (hx - 400) * k5
  hy = 290 + (hy - 290) * k5
  hs *= k5
  const prog = [
    ease(clamp((s - 2.8) / 0.25)),
    ease(clamp((s - 2.95) / 0.25)),
    clamp((s - 3.2) / 0.55),
  ]
  const out: Scene = {}
  MARKS.forEach(([lx, ly, lr], i) => {
    const r = lr * hs,
      c = 2 * Math.PI * r,
      n = i + 1
    out['m' + n + 'x'] = r2(hx + lx * hs)
    out['m' + n + 'y'] = r2(hy + ly * hs)
    out['m' + n + 'r'] = r2(r)
    out['m' + n + 'd'] = r2(c) + ' ' + r2(c)
    out['m' + n + 'o'] = r2(c * (1 - prog[i]))
  })
  const a = prog[2] * Math.PI * 2
  const bu = ease(clamp((s - 5.3) / 0.4))
  const bs = 0.6 + 0.4 * t5
  const bx = 400 + 160 * bu
  const done = s >= 5.72
  const tx = bx - 90 * bs
  const cs = (0.96 + 0.04 * t4) * k5
  return {
    ...out,
    beamOp: r2(t2 * (1 - t3)),
    glowOp: r2(t2 * (1 - t3)),
    groundOp: r2(0.4 * dim),
    connOp: r2(0.6 * t1 * dim),
    bodyTf: tr(70 * t1, 0),
    bodyOp: r2(dim),
    partOp: r2(dim),
    doorTf: tr(80 * t1, -150 * t1),
    hoodTf: tr(-20 * t1, -150 * t1),
    bumperTf: tr(-80 * t1, 70 * t1),
    wheelTf: tr(lerp(230, 190, t1), lerp(400, 500, t1)),
    engineTf: tr(lerp(210, 130, t1), lerp(350, 360, t1)),
    engineOp: r2(t1 * dim),
    tagOp: r2(t1 * dim),
    headTagOp: r2(t1 * (1 - t2)),
    modelOp: r2(1 - t1),
    standOp: r2(t2 * (1 - t3)),
    checkOp: r2(t2 * (1 - t3)),
    headTf: tr(hx, hy) + ' scale(' + r2(hs) + ')',
    headOp: r2(1 - t5),
    markOp: r2((prog[0] > 0 ? 1 : 0) * (1 - t5)),
    penTf: tr(
      (out.m3x as number) + (out.m3r as number) * Math.cos(a),
      (out.m3y as number) + (out.m3r as number) * Math.sin(a),
    ),
    penOp: r2(t3 * (1 - t4)),
    cardTf: 'translate(400 290) scale(' + r2(cs) + ') translate(-400 -290)',
    cardOp: r2(t4 * (1 - t5)),
    boxTf: tr(bx, 300) + ' scale(' + r2(bs) + ')',
    boxOp: r2(t5),
    boxFade: done ? 0 : 1,
    boxFadeS: done ? 0.96 : 1,
    sentOp: done ? 1 : 0,
    sentS: done ? 1 : 0.96,
    trailD: 'M300 ' + r2(300 + 70 * bs) + ' L' + r2(Math.max(300, tx)) + ' ' + r2(300 + 70 * bs),
    trailOp: done ? 0 : r2((t5 as number) * (tx > 306 ? 1 : 0)),
    trailClip: done ? r2(Math.max(0, tx - 290) + 4) : 0,
  }
}

type Device = 'desktop' | 'laptop' | 'tablet' | 'mobile'
const deviceFor = (vw: number): Device =>
  vw >= 1360 ? 'desktop' : vw >= 1024 ? 'laptop' : vw >= 768 ? 'tablet' : 'mobile'

export function PartPath({ heading, steps }: BlockComponentProps<'partPath'>) {
  const list = (steps ?? []).filter((s) => s.title || s.text)
  const rootRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [vw, setVw] = useState(1440)
  const [s, setS] = useState(0)
  const [trackPx, setTrackPx] = useState(0)
  const raf = useRef<number | undefined>(undefined)

  const count = Math.max(list.length, 1)
  const lastIndex = count - 1

  useEffect(() => {
    const measure = () => {
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const sh = stickyRef.current?.offsetHeight ?? vh
      const wideNow = window.innerWidth >= 1024
      if (!wideNow) {
        const want = Math.round(sh + vh * 0.6 * count)
        if (Math.abs(want - trackPx) > 2) {
          setTrackPx(want)
          return
        }
      }
      const total = r.height - sh
      const next = total > 0 ? clamp(-r.top / total) * count : 0
      setS((prev) => (Math.abs(next - prev) > 0.0005 ? next : prev))
    }
    const queue = () => {
      if (raf.current !== undefined) return
      raf.current = requestAnimationFrame(() => {
        raf.current = undefined
        measure()
      })
    }
    const onResize = () => {
      setVw(window.innerWidth)
      queue()
    }
    onResize()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', queue, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', queue)
      if (raf.current !== undefined) {
        cancelAnimationFrame(raf.current)
        raf.current = undefined
      }
    }
  }, [trackPx, count])

  const d = deviceFor(vw)
  const wide = d === 'desktop' || d === 'laptop'
  const active = clamp(Math.floor(s), 0, lastIndex)
  // Scene choreography is tuned for the 6-stage narrative; normalise s to it.
  const f = scene((s * 6) / count)

  const goTo = (k: number) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const total = r.height - (stickyRef.current?.offsetHeight ?? window.innerHeight)
    window.scrollTo({
      top: window.scrollY + r.top + (total * (k + 0.5)) / count,
      behavior: 'smooth',
    })
  }

  const lineFill = `calc((100% - var(--space-32)) * ${lastIndex ? active / lastIndex : 0})`

  return (
    <section
      aria-label={heading ?? 'Шлях деталі'}
      style={{ background: 'var(--color-neutral-950)', color: 'var(--color-neutral-0)' }}
    >
      <div
        ref={rootRef}
        style={{ position: 'relative', height: wide ? '600vh' : `${trackPx || 0}px` }}
      >
        <div
          ref={stickyRef}
          className="flex items-center overflow-hidden"
          style={{ position: 'sticky', top: 0, height: wide ? '100vh' : 'auto' }}
        >
          <div
            className="mx-auto box-border grid w-full items-center gap-[var(--space-32)] px-[var(--space-16)] py-[var(--space-64)] md:px-[var(--space-32)] lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] lg:gap-[var(--space-48)] lg:px-[var(--space-48)] lg:py-[var(--space-96)] wide:px-[var(--space-64)]"
            style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
          >
            {/* left: heading + vertical stepper (desktop) */}
            <div className="hidden min-w-0 flex-col gap-[var(--space-48)] lg:flex">
              <h2
                className="text-24 font-semibold md:text-28 lg:text-40"
                style={{ margin: 0, letterSpacing: '-0.02em', textWrap: 'balance' }}
              >
                {heading ?? 'Шлях деталі'}
              </h2>
              <div className="flex flex-col" style={{ gap: 'var(--space-32)' }}>
                <ol
                  className="relative flex flex-col"
                  style={{ margin: 0, padding: 0, listStyle: 'none', gap: 'var(--space-4)' }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '0.3125rem',
                      top: 'var(--space-16)',
                      bottom: 'var(--space-16)',
                      width: 'var(--border-hairline)',
                      background: 'var(--color-neutral-600)',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '0.3125rem',
                      top: 'var(--space-16)',
                      width: 'var(--border-hairline)',
                      height: lineFill,
                      background: 'var(--color-neutral-0)',
                      transition: 'height 300ms ease-out',
                    }}
                  />
                  {list.map((st, i) => (
                    <li key={st.id ?? i} style={{ position: 'relative' }}>
                      <StepButton
                        active={i === active}
                        past={i < active}
                        num={String(i + 1).padStart(2, '0')}
                        name={st.title ?? ''}
                        onClick={() => goTo(i)}
                      />
                    </li>
                  ))}
                </ol>
                <div aria-live="polite" style={{ display: 'grid' }}>
                  {list.map((st, i) => (
                    <div
                      key={st.id ?? i}
                      aria-hidden={i !== active}
                      style={{
                        gridArea: '1 / 1',
                        opacity: i === active ? 1 : 0,
                        transform:
                          i === active
                            ? 'translateY(0)'
                            : i < active
                              ? 'translateY(-0.75rem)'
                              : 'translateY(0.75rem)',
                        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                        pointerEvents: 'none',
                      }}
                    >
                      <p
                        className="text-16 wide:text-18"
                        style={{
                          margin: 0,
                          maxWidth: '27.5rem',
                          lineHeight: 1.5,
                          color: 'var(--color-neutral-400)',
                          textWrap: 'pretty',
                        }}
                      >
                        {st.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right (and the whole thing on mobile): scene + horizontal stepper on narrow */}
            <div
              className="flex min-w-0 flex-col"
              style={{ gap: wide ? 'var(--space-64)' : 'var(--space-32)' }}
            >
              <h2
                className="text-24 font-semibold md:text-28 lg:hidden"
                style={{ margin: 0, letterSpacing: '-0.02em' }}
              >
                {heading ?? 'Шлях деталі'}
              </h2>
              <PartScene f={f} label={list[active]?.title ?? ''} wide={wide} />
              {!wide ? (
                <div className="flex flex-col" style={{ gap: 'var(--space-24)' }}>
                  <ol
                    className="relative flex justify-between"
                    style={{ margin: 0, padding: 0, listStyle: 'none' }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '0.3125rem',
                        right: '0.3125rem',
                        top: '0.3125rem',
                        height: 'var(--border-hairline)',
                        background: 'var(--color-neutral-600)',
                      }}
                    />
                    {list.map((st, i) => (
                      <li key={st.id ?? i} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-label={st.title ?? ''}
                          className="flex flex-col items-center border-0 bg-transparent p-0"
                          style={{
                            minWidth: 'var(--control-h-44)',
                            minHeight: 'var(--control-h-44)',
                            gap: 'var(--space-8)',
                            cursor: 'pointer',
                          }}
                        >
                          <Dot active={i === active} past={i < active} />
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 'var(--text-12)',
                              lineHeight: 1,
                              color:
                                i === active
                                  ? 'var(--color-neutral-0)'
                                  : 'var(--color-neutral-500)',
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <div aria-live="polite" style={{ display: 'grid' }}>
                    {list.map((st, i) => (
                      <div
                        key={st.id ?? i}
                        aria-hidden={i !== active}
                        style={{
                          gridArea: '1 / 1',
                          opacity: i === active ? 1 : 0,
                          transition: 'opacity 300ms ease-out',
                          pointerEvents: 'none',
                        }}
                      >
                        <p
                          className="text-14 md:text-16"
                          style={{
                            margin: 0,
                            lineHeight: 1.5,
                            color: 'var(--color-neutral-400)',
                            textWrap: 'pretty',
                          }}
                        >
                          {st.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Dot({ active, past }: { active: boolean; past: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: '0.6875rem',
        height: '0.6875rem',
        borderRadius: 'var(--radius-full)',
        background: active
          ? 'var(--color-primary)'
          : past
            ? 'var(--color-neutral-0)'
            : 'var(--color-neutral-600)',
        boxShadow: active
          ? '0 0 0 0.25rem var(--color-neutral-950), 0 0 0 0.3125rem rgba(224,0,27,0.6)'
          : '0 0 0 0.25rem var(--color-neutral-950)',
        transition: 'background 300ms ease-out, box-shadow 300ms ease-out',
      }}
    />
  )
}

function StepButton({
  active,
  past,
  num,
  name,
  onClick,
}: {
  active: boolean
  past: boolean
  num: string
  name: string
  onClick: () => void
}) {
  const col = active
    ? 'var(--color-neutral-0)'
    : past
      ? 'var(--color-neutral-400)'
      : 'var(--color-neutral-500)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'step' : undefined}
      className="flex items-center border-0 bg-transparent p-0 text-left"
      style={{
        height: '2.25rem',
        gap: 'var(--space-16)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Dot active={active} past={past} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-14)',
          lineHeight: 1,
          color: col,
          transition: 'color 300ms ease-out',
        }}
      >
        {num}
      </span>
      <span
        className="text-16"
        style={{ fontWeight: active ? 600 : 400, color: col, transition: 'color 300ms ease-out' }}
      >
        {name}
      </span>
    </button>
  )
}

/** The bespoke line scene. Colours via style so they stay token-bound. */
function PartScene({ f, label, wide }: { f: Scene; label: string; wide: boolean }) {
  const ink = 'rgba(252,252,253,0.85)'
  return (
    <svg
      viewBox="0 0 800 600"
      role="img"
      aria-label={`Шлях деталі, крок: ${label}`}
      className="block w-full"
      style={{
        height: wide ? 'auto' : '40vh',
        maxHeight: wide ? 'calc(100vh - var(--space-128))' : '45vh',
        overflow: 'hidden',
        fill: 'none',
        stroke: ink,
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      <g opacity={f.beamOp as number}>
        <path
          d="M312 226 L40 140 L40 360 L312 274 Z"
          style={{ fill: 'rgba(252,252,253,0.06)', stroke: 'none' }}
        />
        <path
          d="M312 236 L80 186 M312 250 L64 250 M312 264 L80 314"
          strokeDasharray="2 10"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <path d="M80 447 L720 447" opacity={f.groundOp as number} vectorEffect="non-scaling-stroke" />
      <g opacity={f.connOp as number} strokeDasharray="3 7">
        <path
          d="M210 182 L296 306 M108 254 L244 340 M174 360 L290 352 M70 430 L220 366 M226 470 L300 404 M456 236 L446 304"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <clipPath id="pp-trail">
        <rect x="290" y="0" width="520" height="600" transform={`translate(${f.trailClip} 0)`} />
      </clipPath>
      <g clipPath="url(#pp-trail)">
        <path
          d={f.trailD as string}
          opacity={f.trailOp as number}
          strokeDasharray="6 8"
          vectorEffect="non-scaling-stroke"
          style={{ transition: 'opacity 500ms ease-in' }}
        />
      </g>
      <g transform={f.bodyTf as string} opacity={f.bodyOp as number}>
        <path
          d="M300 300 L360 245 L452 245 Q462 246 463 256 L466 320 L690 320 L690 388 L612 388 A52 52 0 0 0 508 388 L282 388 A52 52 0 0 0 178 388 L150 388 L150 340"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M466 336 L680 336 M160 354 L170 346 L167 360 L178 355"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="560" cy="400" r="46" vectorEffect="non-scaling-stroke" />
        <circle cx="560" cy="400" r="18" vectorEffect="non-scaling-stroke" />
      </g>
      <g transform={f.doorTf as string} opacity={f.partOp as number}>
        <path
          d="M300 306 L452 306 L452 384 L300 384 Z M312 296 L360 254 L444 254 L446 296 Z M418 322 L436 322"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <g transform={f.hoodTf as string} opacity={f.partOp as number}>
        <path
          d="M146 330 L170 318 L186 329 L206 312 L236 317 L262 306 L300 300"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <g transform={f.bumperTf as string} opacity={f.partOp as number}>
        <path
          d="M150 340 L132 335 L118 347 L126 357 L114 368 L118 386 L150 388"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <g transform={f.wheelTf as string} opacity={f.partOp as number}>
        <circle r="46" vectorEffect="non-scaling-stroke" />
        <circle r="18" vectorEffect="non-scaling-stroke" />
        <circle r="31" strokeDasharray="3 9" vectorEffect="non-scaling-stroke" />
      </g>
      <g transform={f.engineTf as string} opacity={f.engineOp as number}>
        <path
          d="M-40 -20 L30 -20 L30 -28 L44 -28 L44 24 L-40 24 Z M-28 -20 L-28 -32 L-16 -32 L-16 -20 M-6 -20 L-6 -32 L6 -32 L6 -20 M-40 2 L44 2"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="-52" cy="4" r="10" vectorEffect="non-scaling-stroke" />
      </g>
      <g opacity={f.tagOp as number} style={{ fontFamily: 'var(--font-mono)' }} fontSize="12">
        <rect x="136" y="116" width="88" height="22" rx="4" vectorEffect="non-scaling-stroke" />
        <text x="180" y="131" textAnchor="middle" style={{ fill: ink, stroke: 'none' }}>
          DLS-04511
        </text>
        <rect x="20" y="468" width="88" height="22" rx="4" vectorEffect="non-scaling-stroke" />
        <text x="64" y="483" textAnchor="middle" style={{ fill: ink, stroke: 'none' }}>
          DLS-04514
        </text>
      </g>
      <g
        opacity={wide ? (f.tagOp as number) : 0}
        style={{ fontFamily: 'var(--font-mono)' }}
        fontSize="12"
      >
        <rect x="110" y="298" width="88" height="22" rx="4" vectorEffect="non-scaling-stroke" />
        <text x="154" y="313" textAnchor="middle" style={{ fill: ink, stroke: 'none' }}>
          DLS-04513
        </text>
        <rect x="246" y="524" width="88" height="22" rx="4" vectorEffect="non-scaling-stroke" />
        <text x="290" y="539" textAnchor="middle" style={{ fill: ink, stroke: 'none' }}>
          DLS-04515
        </text>
        <rect x="546" y="120" width="88" height="22" rx="4" vectorEffect="non-scaling-stroke" />
        <text x="590" y="135" textAnchor="middle" style={{ fill: ink, stroke: 'none' }}>
          DLS-04516
        </text>
      </g>
      <g opacity={f.headTagOp as number} style={{ fontFamily: 'var(--font-mono)' }} fontSize="12">
        <rect x="46" y="204" width="88" height="22" rx="4" vectorEffect="non-scaling-stroke" />
        <text x="90" y="219" textAnchor="middle" style={{ fill: ink, stroke: 'none' }}>
          DLS-04512
        </text>
      </g>
      <g
        opacity={f.modelOp as number}
        style={{ stroke: 'rgba(252,252,253,0.35)', fontFamily: 'var(--font-mono)' }}
        fontSize="14"
      >
        <rect x="209" y="476" width="192" height="28" rx="8" vectorEffect="non-scaling-stroke" />
        <rect x="413" y="476" width="58" height="28" rx="8" vectorEffect="non-scaling-stroke" />
        <rect x="483" y="476" width="108" height="28" rx="8" vectorEffect="non-scaling-stroke" />
        <text
          x="305"
          y="495"
          textAnchor="middle"
          style={{ fill: 'var(--color-neutral-200)', stroke: 'none' }}
        >
          Ford Ranger 2.5 TDCi
        </text>
        <text
          x="442"
          y="495"
          textAnchor="middle"
          style={{ fill: 'var(--color-neutral-400)', stroke: 'none' }}
        >
          2009
        </text>
        <text
          x="537"
          y="495"
          textAnchor="middle"
          style={{ fill: 'var(--color-neutral-400)', stroke: 'none' }}
        >
          186 000 км
        </text>
      </g>
      <g opacity={f.standOp as number}>
        <path
          d="M400 306 L400 340 M296 340 L520 340 M316 340 L316 420 M500 340 L500 420 M288 420 L528 420"
          vectorEffect="non-scaling-stroke"
        />
        <rect x="566" y="300" width="96" height="72" rx="8" vectorEffect="non-scaling-stroke" />
        <circle cx="596" cy="336" r="14" vectorEffect="non-scaling-stroke" />
        <path
          d="M596 336 L604 328 M626 322 L646 322 M626 336 L646 336 M626 350 L638 350"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M566 318 C530 318 528 252 490 252 M566 334 C520 340 526 276 484 270"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <g opacity={f.checkOp as number} style={{ stroke: 'var(--color-primary)' }}>
        <circle cx="640" cy="180" r="28" vectorEffect="non-scaling-stroke" />
        <path d="M627 181 L636 190 L654 171" vectorEffect="non-scaling-stroke" />
      </g>
      <g transform={f.cardTf as string} opacity={f.cardOp as number}>
        <rect x="240" y="80" width="320" height="420" rx="16" vectorEffect="non-scaling-stroke" />
        <rect
          x="256"
          y="96"
          width="288"
          height="220"
          rx="8"
          style={{ stroke: 'rgba(252,252,253,0.35)' }}
          vectorEffect="non-scaling-stroke"
        />
        <rect x="256" y="332" width="168" height="26" rx="8" vectorEffect="non-scaling-stroke" />
        <text
          x="268"
          y="350"
          style={{ fill: ink, stroke: 'none', fontFamily: 'var(--font-sans)' }}
          fontSize="13"
          fontWeight="500"
        >
          Ford Ranger 2006–2012
        </text>
        <text
          x="256"
          y="394"
          style={{ fill: 'var(--color-neutral-0)', stroke: 'none', fontFamily: 'var(--font-sans)' }}
          fontSize="20"
          fontWeight="600"
        >
          Фара ліва галоген
        </text>
        <text
          x="256"
          y="462"
          style={{ fill: 'var(--color-neutral-0)', stroke: 'none', fontFamily: 'var(--font-sans)' }}
          fontSize="26"
          fontWeight="600"
        >
          4 500 ₴
        </text>
        <rect
          x="496"
          y="428"
          width="48"
          height="40"
          rx="8"
          style={{ fill: 'var(--color-primary)', stroke: 'none' }}
        />
        <g transform="translate(508 436)" style={{ stroke: 'var(--color-neutral-0)' }}>
          <path
            d="M3 4H5.5L7.6 14.2A1.5 1.5 0 0 0 9.1 15.4H17.4A1.5 1.5 0 0 0 18.9 14.2L20.5 7H6.2"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="9.5" cy="19.5" r="1.3" vectorEffect="non-scaling-stroke" />
          <circle cx="17" cy="19.5" r="1.3" vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      <g transform={f.headTf as string} opacity={f.headOp as number}>
        <path
          d="M-18 -7 Q-16 -11 -10 -11 L14 -11 Q18 -11 18 -7 L18 8 Q18 11 14 11 L-12 11 Q-18 11 -18 6 Z"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="-7"
          cy="0"
          r="5"
          style={{ fill: 'rgba(252,252,253,0.9)' }}
          fillOpacity={f.glowOp as number}
          vectorEffect="non-scaling-stroke"
        />
        <path d="M3 -6 L12 -6 M3 0 L12 0 M3 6 L12 6" vectorEffect="non-scaling-stroke" />
      </g>
      <g
        opacity={f.markOp as number}
        style={{ stroke: 'var(--color-neutral-0)' }}
        strokeWidth="2"
        strokeLinecap="butt"
      >
        <circle
          cx={f.m1x as number}
          cy={f.m1y as number}
          r={f.m1r as number}
          strokeDasharray={f.m1d as string}
          strokeDashoffset={f.m1o as number}
        />
        <circle
          cx={f.m2x as number}
          cy={f.m2y as number}
          r={f.m2r as number}
          strokeDasharray={f.m2d as string}
          strokeDashoffset={f.m2o as number}
        />
        <circle
          cx={f.m3x as number}
          cy={f.m3y as number}
          r={f.m3r as number}
          strokeDasharray={f.m3d as string}
          strokeDashoffset={f.m3o as number}
        />
      </g>
      <g transform={f.penTf as string} opacity={f.penOp as number}>
        <path
          d="M0 0 L4 -12 L26 -34 L34 -26 L12 -4 Z M4 -12 L12 -4"
          style={{ fill: 'var(--color-neutral-950)' }}
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <g transform={f.boxTf as string} opacity={f.boxOp as number}>
        <g
          style={{
            opacity: f.boxFade as number,
            transform: `scale(${f.boxFadeS})`,
            transformBox: 'fill-box',
            transformOrigin: 'center',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          <path
            d="M-90 -30 L60 -30 L60 70 L-90 70 Z M-90 -30 L-50 -70 L100 -70 L60 -30 M60 -30 L100 -70 L100 30 L60 70 M-12 -30 L28 -70"
            style={{ fill: 'var(--color-neutral-950)' }}
            vectorEffect="non-scaling-stroke"
          />
          <rect x="-76" y="-12" width="112" height="40" rx="4" vectorEffect="non-scaling-stroke" />
          <path
            d="M-60 -2 L-50 8 L-60 18 L-70 8 Z M-64 8 L-56 8 M-59 5 L-56 8 L-59 11"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x="-42"
            y="13"
            style={{ fill: ink, stroke: 'none', fontFamily: 'var(--font-sans)' }}
            fontSize="12"
            fontWeight="600"
          >
            Нова пошта
          </text>
        </g>
      </g>
      <g opacity={f.boxOp as number}>
        <g
          style={{
            opacity: f.sentOp as number,
            transform: `scale(${f.sentS})`,
            transformBox: 'fill-box',
            transformOrigin: 'center',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          <circle
            cx="400"
            cy="276"
            r="32"
            style={{ stroke: 'var(--color-primary)' }}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M385 277 L395 287 L416 266"
            style={{ stroke: 'var(--color-primary)' }}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x="400"
            y="342"
            textAnchor="middle"
            style={{
              fill: 'var(--color-neutral-400)',
              stroke: 'none',
              fontFamily: 'var(--font-mono)',
            }}
            fontSize="13"
          >
            Відправлено · ТТН 2045 0123 4567 8901
          </text>
        </g>
      </g>
    </svg>
  )
}
