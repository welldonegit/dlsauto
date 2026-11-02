'use client'

import { useEffect, useRef, useState } from 'react'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Про компанію" first screen (STAGE_3A §3, PROJECT_CONTEXT §5). A dark hero
 * with a perfect-circle brake-disc drawn in SVG (vent slots + 5 holes), tilted
 * with CSS perspective/rotateX and spun on an inner layer with rotateZ
 * (~24s/turn). The glow is a separate, static layer; the spinning SVG carries no
 * filter, so only one compositor layer transforms per frame. The spin pauses
 * out of view (IntersectionObserver) and under prefers-reduced-motion.
 *
 * Verify (criterion 2): a 5s Performance capture shows Composite only — no
 * Layout/Paint from the rotation.
 */

// Vent-slot paths (one turn of the disc), 1:1 with the export geometry.
const VENTS =
  'M440.0 0.0 Q499.3 26.2 533.4 84.5M433.3 76.4 Q487.2 112.5 510.6 175.8M413.5 150.5 Q460.3 195.4 472.3 261.8M381.1 220.0 Q419.3 272.3 419.7 339.8M337.1 282.8 Q365.7 341.0 354.3 407.5M282.8 337.1 Q300.9 399.3 278.1 462.9M220.0 381.1 Q227.0 445.5 193.5 504.1M150.5 413.5 Q146.2 478.2 103.0 530.1M76.4 433.3 Q60.9 496.3 9.4 539.9M0.0 440.0 Q-26.2 499.3 -84.5 533.4M-76.4 433.3 Q-112.5 487.2 -175.8 510.6M-150.5 413.5 Q-195.4 460.3 -261.8 472.3M-220.0 381.1 Q-272.3 419.3 -339.8 419.7M-282.8 337.1 Q-341.0 365.7 -407.5 354.3M-337.1 282.8 Q-399.3 300.9 -462.9 278.1M-381.1 220.0 Q-445.5 227.0 -504.1 193.5M-413.5 150.5 Q-478.2 146.2 -530.1 103.0M-433.3 76.4 Q-496.3 60.9 -539.9 9.4M-440.0 0.0 Q-499.3 -26.2 -533.4 -84.5M-433.3 -76.4 Q-487.2 -112.5 -510.6 -175.8M-413.5 -150.5 Q-460.3 -195.4 -472.3 -261.8M-381.1 -220.0 Q-419.3 -272.3 -419.7 -339.8M-337.1 -282.8 Q-365.7 -341.0 -354.3 -407.5M-282.8 -337.1 Q-300.9 -399.3 -278.1 -462.9M-220.0 -381.1 Q-227.0 -445.5 -193.5 -504.1M-150.5 -413.5 Q-146.2 -478.2 -103.0 -530.1M-76.4 -433.3 Q-60.9 -496.3 -9.4 -539.9M-0.0 -440.0 Q26.2 -499.3 84.5 -533.4M76.4 -433.3 Q112.5 -487.2 175.8 -510.6M150.5 -413.5 Q195.4 -460.3 261.8 -472.3M220.0 -381.1 Q272.3 -419.3 339.8 -419.7M282.8 -337.1 Q341.0 -365.7 407.5 -354.3M337.1 -282.8 Q399.3 -300.9 462.9 -278.1M381.1 -220.0 Q445.5 -227.0 504.1 -193.5M413.5 -150.5 Q478.2 -146.2 530.1 -103.0M433.3 -76.4 Q496.3 -60.9 539.9 -9.4'

const HOLES: [number, number][] = [
  [0, -105],
  [99.9, -32.4],
  [61.7, 84.9],
  [-61.7, 84.9],
  [-99.9, -32.4],
]

type Device = 'desktop' | 'laptop' | 'tablet' | 'mobile'
function deviceFor(vw: number): Device {
  return vw >= 1360 ? 'desktop' : vw >= 1024 ? 'laptop' : vw >= 768 ? 'tablet' : 'mobile'
}

export function AboutHero({ eyebrow, heading, text }: BlockComponentProps<'aboutHero'>) {
  const heroRef = useRef<HTMLElement>(null)
  const spinRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<Animation | null>(null)
  const inView = useRef(true)
  const [metrics, setMetrics] = useState<{ vw: number; hw: number }>({ vw: 1440, hw: 1440 })

  // --- disc spin (Web Animations API; compositor-only transform) -------------
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const start = () => {
      const el = spinRef.current
      if (!el || animRef.current || !el.animate) return
      if (mq?.matches) return
      animRef.current = el.animate(
        [
          { transform: 'translateZ(0) rotate(0deg)' },
          { transform: 'translateZ(0) rotate(360deg)' },
        ],
        { duration: 24000, iterations: Infinity, easing: 'linear' },
      )
      if (!inView.current) animRef.current.pause()
    }
    const stop = () => {
      animRef.current?.cancel()
      animRef.current = null
    }
    const onMq = () => (mq?.matches ? stop() : start())
    mq?.addEventListener?.('change', onMq)

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window && heroRef.current) {
      io = new IntersectionObserver(([e]) => {
        inView.current = e.isIntersecting
        if (animRef.current) {
          if (e.isIntersecting) animRef.current.play()
          else animRef.current.pause()
        }
      })
      io.observe(heroRef.current)
    }
    start()
    return () => {
      stop()
      io?.disconnect()
      mq?.removeEventListener?.('change', onMq)
    }
  }, [])

  // --- responsive disc sizing (tied to hero width, as in the export) ---------
  useEffect(() => {
    const measure = () =>
      setMetrics({
        vw: window.innerWidth,
        hw: heroRef.current?.clientWidth ?? window.innerWidth,
      })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const d = deviceFor(metrics.vw)
  const ringsPx = d === 'desktop' ? 360 : d === 'laptop' ? 320 : d === 'tablet' ? 220 : 140
  const sc = Math.max(metrics.hw / 1600, ringsPx / 400)
  const D = Math.round(1120 * sc)

  return (
    <section
      ref={heroRef}
      aria-labelledby="about-hero-h1"
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        isolation: 'isolate',
        minHeight: d === 'desktop' || d === 'laptop' ? '85vh' : '0',
        background: 'var(--color-neutral-hero)',
        color: 'var(--color-neutral-0)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: -1 }}
      >
        {/* glow + beam + spot (static, blurred — never animated) */}
        <div className="absolute inset-0">
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '70%',
              height: '90%',
              borderRadius: '50%',
              background:
                'radial-gradient(closest-side, rgba(224,0,27,0.35), rgba(224,0,27,0.14) 55%, rgba(224,0,27,0) 100%)',
              filter: 'blur(5rem)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-55%',
              right: '-6%',
              width: '46%',
              height: '170%',
              transform: 'rotate(42deg)',
              transformOrigin: '100% 0',
              background:
                'linear-gradient(180deg, rgba(224,0,27,0.35) 0%, rgba(224,0,27,0.18) 30%, rgba(224,0,27,0) 58%)',
              filter: 'blur(4.5rem)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: d === 'desktop' || d === 'laptop' ? '40%' : '35%',
            width: d === 'desktop' || d === 'laptop' ? '70%' : '120%',
            height: d === 'desktop' || d === 'laptop' ? '60%' : '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(92,26,22,0.55), rgba(60,20,20,0.3) 55%, rgba(40,16,18,0) 100%)',
            filter: 'blur(3.5rem)',
          }}
        />
        <div className="absolute right-0 bottom-0 left-0" style={{ height: `${ringsPx}px` }}>
          {/* faint static rings (blurred layers, no animation) */}
          <svg
            viewBox="0 0 1600 400"
            preserveAspectRatio="xMidYMax slice"
            className="absolute inset-0 h-full w-full"
            style={{
              opacity: 0.15,
              filter: 'blur(0.625rem)',
              fill: 'none',
              stroke: 'var(--color-primary)',
            }}
          >
            <g transform="translate(0 60) translate(800 330) scale(1 0.24)">
              <circle r="560" strokeWidth="6" vectorEffect="non-scaling-stroke" />
              <circle r="420" strokeWidth="4" vectorEffect="non-scaling-stroke" />
              <circle r="168" strokeWidth="4" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
          <div className="absolute inset-0" style={{ filter: 'blur(0.75rem)', opacity: 0.7 }}>
            <svg
              viewBox="0 0 1600 400"
              preserveAspectRatio="xMidYMax slice"
              className="block h-full w-full"
              style={{ fill: 'none', stroke: 'var(--color-primary)' }}
            >
              <g transform="translate(800 330) scale(1 0.24)">
                <circle r="560" strokeWidth="12" vectorEffect="non-scaling-stroke" />
                <circle r="420" strokeWidth="7" vectorEffect="non-scaling-stroke" />
                <circle r="168" strokeWidth="7" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
          </div>
          {/* the tilted, spinning disc */}
          <div
            className="absolute left-1/2 bottom-0"
            style={{
              width: `${D}px`,
              height: `${D}px`,
              marginLeft: `${-D / 2}px`,
              bottom: `${Math.round(70 * sc - D / 2)}px`,
              perspective: `${D * 8}px`,
            }}
          >
            <div className="absolute inset-0" style={{ transform: 'rotateX(76.1deg)' }}>
              <div
                ref={spinRef}
                className="absolute inset-0"
                style={{ willChange: 'transform', transform: 'translateZ(0) rotate(0deg)' }}
              >
                <svg
                  viewBox="-600 -600 1200 1200"
                  className="block h-full w-full"
                  style={{ fill: 'none' }}
                >
                  <g style={{ stroke: 'var(--color-primary)' }} opacity="0.9">
                    <circle r="560" strokeWidth="6" />
                    <circle r="420" strokeWidth="3.5" />
                    <circle r="168" strokeWidth="3.5" />
                    {HOLES.map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="22" strokeWidth="3" />
                    ))}
                    <path d={VENTS} strokeWidth="3" strokeLinecap="round" />
                  </g>
                  <g style={{ stroke: 'var(--color-primary-light)' }}>
                    <circle r="560" strokeWidth="2.5" />
                    <circle r="420" strokeWidth="1.5" />
                    <circle r="168" strokeWidth="1.5" />
                    {HOLES.map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="22" strokeWidth="1.5" />
                    ))}
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div
        className="mx-auto box-border flex w-full flex-col items-center px-[var(--space-16)] text-center md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{
          maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))',
          paddingTop: 'var(--space-64)',
          paddingBottom:
            d === 'desktop'
              ? 'max(var(--space-240), calc(13.75vw + var(--space-48)))'
              : d === 'laptop'
                ? 'var(--space-240)'
                : d === 'tablet'
                  ? 'var(--space-200)'
                  : 'var(--space-160)',
        }}
      >
        {eyebrow ? (
          <span
            className="text-12 md:text-14"
            style={{
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-primary-light)',
              marginBottom: 'var(--space-16)',
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <h1
          id="about-hero-h1"
          className="text-28 md:text-32 lg:text-40 wide:text-d"
          style={{
            margin: 0,
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            background:
              'linear-gradient(180deg, var(--color-neutral-0) 35%, var(--color-neutral-400) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textWrap: 'balance',
          }}
        >
          {heading}
        </h1>
        {text ? (
          <p
            className="text-14 md:text-16 wide:text-18"
            style={{
              margin: 'var(--space-32) 0 0',
              maxWidth: d === 'mobile' ? '100%' : '45rem',
              lineHeight: 1.5,
              color: 'rgba(252,252,253,0.75)',
              textWrap: 'pretty',
            }}
          >
            {text}
          </p>
        ) : null}
      </div>
    </section>
  )
}
