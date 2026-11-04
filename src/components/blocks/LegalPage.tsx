import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RichTextNodes, splitLexicalSections, type LexRoot } from '@/components/ui/RichText'
import type { Locale } from '@/i18n/config'

/**
 * Shared layout for the two legal pages (STAGE_3A §2): breadcrumb, H1, "updated"
 * date and the rich-text body, one section per H2. Оферта additionally shows the
 * ФОП requisites from settings. The content itself is a richText block from
 * Payload.
 */

export type LegalLabels = {
  home: string
  contents: string
  updated: string
  requisites: string
}

export type Requisites = { name?: string | null; edrpou?: string | null; address?: string | null }

function formatUpdated(iso: string | undefined, locale: Locale): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const fmt = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  // Drop the trailing " р." / " г." era marker some locales append.
  return fmt.format(date).replace(/\s*[гр]\.$/u, '')
}

export function LegalPage({
  title,
  content,
  updatedAt,
  locale,
  labels,
  requisites,
}: {
  title: string
  content: LexRoot
  updatedAt?: string
  locale: Locale
  labels: LegalLabels
  requisites?: Requisites
}) {
  const sections = splitLexicalSections(content)
  const hasRequisites =
    !!requisites && !!(requisites.name || requisites.edrpou || requisites.address)

  const updated = formatUpdated(updatedAt, locale)
  const homeHref = locale === 'uk' ? '/' : '/ru'

  return (
    <div
      className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
      style={{
        maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))',
        paddingTop: 'var(--space-24)',
        paddingBottom: 'var(--space-64)',
      }}
    >
      <Breadcrumbs items={[{ label: labels.home, href: homeHref }, { label: title }]} />
      <h1
        className="text-28 font-semibold md:text-32 lg:text-40"
        style={{ margin: 'var(--space-16) 0 0', letterSpacing: '-0.02em', textWrap: 'balance' }}
      >
        {title}
      </h1>
      {updated ? (
        <p
          className="text-14"
          style={{ margin: 'var(--space-8) 0 0', color: 'var(--color-neutral-600)' }}
        >
          {labels.updated} {updated}
        </p>
      ) : null}

      <article
        className="flex min-w-0 flex-col gap-[var(--space-48)] text-14 md:text-16 lg:gap-[var(--space-64)] wide:text-18"
        style={{
          marginTop: 'var(--space-48)',
          maxWidth: '47.5rem',
          color: 'var(--color-neutral-900)',
        }}
      >
        {sections.map((s) => (
          <section
            key={s.id}
            id={s.title ? s.id : undefined}
            style={{ scrollMarginTop: 'var(--space-96)' }}
          >
            <RichTextNodes nodes={s.nodes} />
          </section>
        ))}
        {hasRequisites ? (
          <section id="sec-requisites" style={{ scrollMarginTop: 'var(--space-96)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--space-16)' }}>
              <h2
                className="text-24 font-semibold lg:text-28"
                style={{ margin: 0, letterSpacing: '-0.02em' }}
              >
                {labels.requisites}
              </h2>
              <dl className="flex flex-col" style={{ margin: 0, gap: 'var(--space-8)' }}>
                {requisites?.name ? <RequisiteRow value={requisites.name} /> : null}
                {requisites?.edrpou ? (
                  <RequisiteRow label="ЄДРПОУ / ІПН" value={requisites.edrpou} />
                ) : null}
                {requisites?.address ? <RequisiteRow value={requisites.address} /> : null}
              </dl>
            </div>
          </section>
        ) : null}
      </article>
    </div>
  )
}

function RequisiteRow({ label, value }: { label?: string; value: string }) {
  return (
    <div style={{ margin: 0 }}>
      {label ? <span style={{ color: 'var(--color-neutral-600)' }}>{label}: </span> : null}
      <span>{value}</span>
    </div>
  )
}
