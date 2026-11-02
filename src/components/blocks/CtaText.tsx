'use client'

import { useEffect, useRef, useState } from 'react'

import { Container, Section } from '@/components/ui/layout'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * Text CTA ("Приїжджайте"/"Зв'яжіться з нами" family, STAGE_3A §3). A primary
 * card with a heading that reveals word-by-word, text, and a white button. The
 * reveal is opacity/transform + a brief blur on the words; it runs once in view
 * and is neutralised under reduced motion. Texts from the block.
 */
const START = 250

export function CtaText({
  heading,
  text,
  buttonLabel,
  buttonLink,
}: BlockComponentProps<'ctaText'>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window) || !rootRef.current) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          setShown(true)
        }
      },
      { threshold: 0.35 },
    )
    io.observe(rootRef.current)
    return () => io.disconnect()
  }, [])

  if (!heading && !text) return null
  const words = (heading ?? '').split(' ')
  const line = (i: number) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : 'translateY(1rem)',
    transition: `opacity 400ms ease-out ${START + i * 80}ms, transform 400ms ease-out ${START + i * 80}ms`,
  })

  return (
    <Section aria-label={heading ?? 'Заклик'}>
      <Container>
        <div
          ref={rootRef}
          className="box-border flex flex-col items-center text-center"
          style={{
            padding: 'var(--space-48) var(--space-24)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary)',
            color: 'var(--color-neutral-0)',
            opacity: shown ? 1 : 0,
            transform: shown ? 'scale(1)' : 'scale(0.96)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          <h2
            aria-label={heading ?? undefined}
            className="flex flex-wrap justify-center text-24 font-semibold md:text-28 lg:text-40"
            style={{ margin: 0, columnGap: '0.26em', letterSpacing: '-0.02em' }}
          >
            {words.map((w, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(0.75rem)',
                  filter: shown ? 'blur(0)' : 'blur(0.25rem)',
                  transition: `opacity 400ms ease-out ${START + i * 60}ms, transform 400ms ease-out ${START + i * 60}ms, filter 400ms ease-out ${START + i * 60}ms`,
                }}
              >
                {w}
              </span>
            ))}
          </h2>
          {text ? (
            <p
              className="text-16 wide:text-18"
              style={{
                margin: 'var(--space-16) 0 0',
                maxWidth: '40rem',
                lineHeight: 1.5,
                textWrap: 'balance',
                ...line(1),
              }}
            >
              {text}
            </p>
          ) : null}
          {buttonLabel ? (
            <a
              href={buttonLink || '#'}
              className="dls-fill inline-flex items-center justify-center font-semibold no-underline"
              style={{
                marginTop: 'var(--space-48)',
                height: 'var(--control-h-56)',
                padding: '0 var(--space-24)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-neutral-0)',
                color: 'var(--color-neutral-900)',
                fontSize: 'var(--text-16)',
                ['--dls-fill' as string]: 'var(--color-neutral-200)',
                ...line(3),
              }}
            >
              {buttonLabel}
            </a>
          ) : null}
        </div>
      </Container>
    </Section>
  )
}
