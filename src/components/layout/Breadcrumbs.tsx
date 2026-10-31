import Link from 'next/link'

/**
 * Breadcrumbs. Server component; the last crumb is the current page (no link).
 * Slash separators as real text nodes (no ::before).
 */
export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлібні крихти" className="font-sans">
      <ol className="flex flex-wrap items-center" style={{ gap: 'var(--space-8)', margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${it.label}-${i}`} className="flex items-center" style={{ gap: 'var(--space-8)' }}>
              {it.href && !last ? (
                <Link
                  href={it.href}
                  className="no-underline"
                  style={{ fontSize: 'var(--text-14)', color: 'var(--color-neutral-500)' }}
                >
                  <span className="dls-underline">{it.label}</span>
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} style={{ fontSize: 'var(--text-14)', color: last ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)' }}>
                  {it.label}
                </span>
              )}
              {last ? null : (
                <span aria-hidden="true" style={{ color: 'var(--color-neutral-400)' }}>
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
