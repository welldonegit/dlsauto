'use client'

import { useState } from 'react'

import { SectionHeading } from '@/components/ui/SectionHeading'
import { Container, Section } from '@/components/ui/layout'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Часті питання" (DLSFaq export). Six Q/A laid out in two columns (3+3),
 * multi-open accordion (opening one does not close others). Each item: a round
 * "?" glyph, the question, and a round chevron that rotates on open; the answer
 * reveals via a grid-rows 0fr→1fr transition. Texts from the block. Client
 * component (accordion state).
 */
type Item = { question: string; answer: string; i: number }

export function FaqBlock({ heading, subheading, items }: BlockComponentProps<'faq'>) {
  const list: Item[] = (items ?? [])
    .map((it, i) => ({ question: it.question ?? '', answer: it.answer ?? '', i }))
    .filter((it) => it.question && it.answer)
  const [open, setOpen] = useState<Record<number, boolean>>({})
  if (!list.length) return null

  const half = Math.ceil(list.length / 2)
  const columns = [list.slice(0, half), list.slice(half)]
  const toggle = (i: number) => setOpen((o) => ({ ...o, [i]: !o[i] }))

  return (
    <Section aria-label={heading ?? 'Часті питання'}>
      <Container>
        {heading ? <SectionHeading>{heading}</SectionHeading> : null}
        {subheading ? (
          <p
            className="text-16 wide:text-18"
            style={{
              margin: 'var(--space-16) 0 0',
              maxWidth: '40rem',
              lineHeight: 1.5,
              color: 'var(--color-neutral-600)',
              textWrap: 'pretty',
            }}
          >
            {subheading}
          </p>
        ) : null}

        <div className="mt-[var(--space-32)] flex flex-wrap gap-x-[var(--space-24)] gap-y-[var(--space-12)] md:mt-[var(--space-48)] md:gap-y-[var(--space-16)]">
          {columns.map((col, c) => (
            <div
              key={c}
              className="flex min-w-0 flex-1 flex-col gap-[var(--space-12)] md:gap-[var(--space-16)]"
              style={{ flexBasis: '30rem' }}
            >
              {col.map((it) => {
                const isOpen = !!open[it.i]
                return (
                  <article
                    key={it.i}
                    style={{
                      background: 'var(--color-neutral-white)',
                      border: `var(--border-hairline) solid ${isOpen ? 'var(--color-neutral-300)' : 'var(--color-neutral-200)'}`,
                      borderRadius: 'var(--radius-lg)',
                      transition: 'border-color var(--duration-300) ease-out',
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-a-${it.i}`}
                        id={`faq-q-${it.i}`}
                        onClick={() => toggle(it.i)}
                        className="flex w-full cursor-pointer items-center border-0 bg-transparent p-[var(--space-16)] text-left md:p-[var(--space-24)]"
                        style={{ gap: 'var(--space-12)' }}
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-[var(--control-h-40)] w-[var(--control-h-40)] shrink-0 items-center justify-center md:h-[var(--control-h-48)] md:w-[var(--control-h-48)]"
                          style={{
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-neutral-100)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          <QuestionIcon />
                        </span>
                        <span
                          className="min-w-0 flex-1 text-16 font-semibold md:text-18"
                          style={{ lineHeight: 1.4, minHeight: '2.8em', textWrap: 'pretty' }}
                        >
                          {it.question}
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex shrink-0 items-center justify-center"
                          style={{
                            width: 'var(--control-h-32)',
                            height: 'var(--control-h-32)',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-neutral-100)',
                            color: 'var(--color-neutral-900)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform var(--duration-300) ease-out',
                          }}
                        >
                          <ChevronIcon />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={`faq-a-${it.i}`}
                      role="region"
                      aria-labelledby={`faq-q-${it.i}`}
                      className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                      style={{
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p
                          className="text-16 pr-[var(--space-16)] pb-[var(--space-16)] pl-[calc(var(--space-16)+var(--control-h-40)+var(--space-12))] md:pr-[var(--space-24)] md:pb-[var(--space-24)] md:pl-[calc(var(--space-24)+var(--control-h-48)+var(--space-16))]"
                          style={{
                            margin: 0,
                            lineHeight: 1.6,
                            color: 'var(--color-neutral-600)',
                            textWrap: 'pretty',
                          }}
                        >
                          {it.answer}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function QuestionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: 'var(--icon-24)',
        height: 'var(--icon-24)',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.75,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.6 2.6 0 1 1 3.3 2.5c-.5.2-.9.7-.9 1.3v.6" />
      <circle cx="12" cy="16.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: 'var(--icon-20)',
        height: 'var(--icon-20)',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
