/**
 * Shared "pill arrow" for the home cards. The glyph matches the arrow in the
 * "Ремонт у власному сервісі" (WhatElseWeDo) block: a 48px circle with a
 * hairline red ring and a 20px chevron (strokeWidth 2 — a clean, not-bold
 * weight). Same look at rest in both tint modes:
 *  - pass `bg` to drive the fill from the parent's JS hover/press state
 *    (Моделі tracks the pointer per card);
 *  - omit `bg` and the fill fades in via CSS on the nearest `.group`
 *    hover/active (server-rendered cards, e.g. "Категорії запчастин").
 */
export function CardArrow({ bg }: { bg?: string }) {
  const cssTint = bg === undefined
  return (
    <span
      aria-hidden="true"
      className="relative box-border flex aspect-square h-[var(--control-h-48)] w-[var(--control-h-48)] shrink-0 items-center justify-center rounded-full"
      style={{
        border: 'var(--border-hairline) solid var(--color-primary)',
        color: 'var(--color-primary)',
        background: cssTint ? undefined : bg,
        transition: cssTint ? undefined : 'background var(--duration-150) ease-out',
      }}
    >
      {cssTint ? (
        <span
          className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-active:opacity-100"
          style={{ background: 'var(--color-primary-tint)' }}
        />
      ) : null}
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        className="relative"
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
        <path d="M5 12H19M13 6L19 12L13 18" />
      </svg>
    </span>
  )
}
