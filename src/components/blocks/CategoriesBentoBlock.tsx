import { CardArrow } from '@/components/ui/CardArrow'
import { MediaImage } from '@/components/ui/MediaImage'
import { getCategoryTree, type CategoryWithCount } from '@/lib/data'
import { partsLabel } from '@/lib/rules'

import type { BlockComponentProps } from './BlockRenderer'

/**
 * "Категорії запчастин" bento, variant A (DLSCategoriesBento export). A light
 * band with a 4-col grid (2-col below lg): the first category is a 2-wide lead
 * card, eight 1×1 cards follow, then a dark promo panel spanning 2 columns with
 * the "Часто шукають" search chips and an "Усі категорії" link. Cards float a
 * contain-fit cut-out that scales on hover, with a circle arrow that fills and
 * nudges — all CSS :hover, so this stays a server component.
 *
 * Categories (name, in-stock count, slug, photo) come from Payload; order is the
 * block's `categories` list (the first is the lead), else the tree order. Chips
 * are the block's `searchChips`. The panel total is the sum of category counts.
 */
export async function CategoriesBentoBlock({
  heading,
  categories,
  searchChips,
  locale,
}: BlockComponentProps<'categoriesBlock'>) {
  const tree = await getCategoryTree(locale)
  const byId = new Map(tree.map((c) => [c.id, c]))

  const ordered: CategoryWithCount[] = categories?.length
    ? categories
        .map((c) => byId.get(typeof c === 'object' ? c.id : c))
        .filter((c): c is CategoryWithCount => !!c)
    : tree
  if (!ordered.length) return null

  const prefix = locale === 'uk' ? '' : '/ru'
  const chips = (searchChips ?? []).map((ch) => ch.label ?? '').filter(Boolean)
  const total = tree.reduce((s, c) => s + c.partsCount, 0)

  return (
    <section
      aria-labelledby="cats-bento-title"
      className="bg-neutral-50 pt-[var(--space-64)] pb-[var(--space-64)] lg:pt-[var(--space-96)] lg:pb-[var(--space-96)]"
    >
      <div
        className="mx-auto box-border w-full px-[var(--space-16)] md:px-[var(--space-32)] wide:px-[var(--space-64)]"
        style={{ maxWidth: 'calc(var(--container-max) + 2 * var(--space-64))' }}
      >
        <h2
          id="cats-bento-title"
          className="text-24 md:text-28 wide:text-40"
          style={{
            margin: 0,
            lineHeight: 1.15,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-neutral-900)',
          }}
        >
          {heading}
        </h2>

        <div className="mt-[var(--space-24)] grid grid-cols-2 gap-[var(--space-12)] md:gap-[var(--space-24)] lg:mt-[var(--space-32)] lg:auto-rows-[20rem] lg:grid-cols-4">
          {ordered.map((c, i) => {
            const lead = i === 0
            return (
              <a
                key={c.id}
                href={`${prefix}/catalog/${c.slug}`}
                className={[
                  'group relative box-border flex min-w-0 flex-col gap-[var(--space-16)] overflow-hidden rounded-[var(--radius-lg)] p-[var(--space-24)] no-underline',
                  'col-span-1',
                  lead
                    ? 'col-span-2 min-h-[22.5rem] md:min-h-[27.5rem] lg:min-h-0'
                    : 'min-h-[17.5rem] md:min-h-[20rem] lg:min-h-0',
                ].join(' ')}
                style={{
                  background: 'var(--color-neutral-0)',
                  color: 'var(--color-neutral-900)',
                  boxShadow: 'inset 0 0 0 var(--border-hairline) var(--color-neutral-200)',
                }}
              >
                <div className="relative flex min-h-0 flex-[1_1_auto] items-center justify-center">
                  {c.photo ? (
                    <MediaImage
                      media={c.photo}
                      size="card"
                      alt=""
                      sizes={
                        lead ? '(min-width:1024px) 50vw, 100vw' : '(min-width:1024px) 25vw, 50vw'
                      }
                      className="scale-[1.32] transition-transform duration-300 ease-[var(--ease-brand)] group-hover:scale-[1.39]"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex scale-[1.32] items-center justify-center transition-transform duration-300 ease-[var(--ease-brand)] group-hover:scale-[1.39]"
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        background:
                          'repeating-linear-gradient(135deg, var(--color-neutral-200) 0 var(--border-hairline), var(--color-neutral-0) var(--border-hairline) 0.75rem)',
                      }}
                    >
                      <span
                        className="text-12"
                        style={{
                          padding: 'var(--space-4) var(--space-8)',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--color-neutral-0)',
                          fontFamily: 'ui-monospace, Menlo, monospace',
                          color: 'var(--color-neutral-500)',
                        }}
                      >
                        {c.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative flex flex-none flex-col gap-[var(--space-12)] md:flex-row md:items-center md:justify-between md:gap-[var(--space-16)]">
                  <div className="flex min-w-0 flex-col gap-[var(--space-4)]">
                    <h3
                      className="text-20"
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        textWrap: 'balance',
                        color: 'var(--color-neutral-900)',
                      }}
                    >
                      {c.name}
                    </h3>
                    {/* desktop: count under the name; mobile: moved beside the arrow */}
                    <span
                      className="hidden text-14 md:block"
                      style={{ color: 'var(--color-neutral-500)' }}
                    >
                      {partsLabel(c.partsCount)}
                    </span>
                  </div>
                  {/* mobile keeps the arrow on the count's line (as the Моделі cards do); desktop shows the arrow only */}
                  <div className="flex items-center justify-between gap-[var(--space-16)] md:block">
                    <span
                      className="text-14 md:hidden"
                      style={{ color: 'var(--color-neutral-500)' }}
                    >
                      {partsLabel(c.partsCount)}
                    </span>
                    <CardArrow />
                  </div>
                </div>
              </a>
            )
          })}

          {/* dark promo panel */}
          <div
            className="group relative col-span-2 box-border flex min-w-0 flex-col gap-[var(--space-24)] rounded-[var(--radius-lg)] p-[var(--space-24)]"
            style={{ background: 'var(--color-neutral-850)' }}
          >
            <div className="flex flex-1 flex-col justify-center gap-[var(--space-12)]">
              <p
                id="bento-often"
                className="text-12"
                style={{
                  margin: 0,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-neutral-400)',
                }}
              >
                Часто шукають
              </p>
              {chips.length ? (
                <ul
                  aria-labelledby="bento-often"
                  className="m-0 flex list-none flex-wrap gap-[var(--space-8)] p-0"
                >
                  {chips.map((label) => (
                    <li key={label} className="flex">
                      <a
                        href={`${prefix}/search?q=${encodeURIComponent(label)}`}
                        className="relative z-[1] box-border flex items-center whitespace-nowrap rounded-[var(--radius-sm)] border-[length:var(--border-hairline)] border-solid border-neutral-600 bg-transparent px-[var(--space-16)] py-[var(--space-8)] text-[0.9375rem] no-underline transition-colors duration-200 ease-[var(--ease-brand)] hover:bg-[color:var(--color-neutral-800)]"
                        style={{
                          minHeight: 'var(--control-h-44)',
                          lineHeight: 'var(--text-14--line-height)',
                          color: 'var(--color-neutral-0)',
                        }}
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex items-end justify-between gap-[var(--space-16)]">
              <div className="flex min-w-0 flex-col gap-[var(--space-4)]">
                <h3
                  className="text-20"
                  style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.01em' }}
                >
                  <a
                    href={`${prefix}/catalog`}
                    className="no-underline"
                    style={{ color: 'var(--color-neutral-0)' }}
                  >
                    Усі категорії
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[var(--radius-lg)]"
                    />
                  </a>
                </h3>
                <span className="text-14" style={{ color: 'var(--color-neutral-400)' }}>
                  {partsLabel(total)}
                </span>
              </div>
              <CardArrow />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
