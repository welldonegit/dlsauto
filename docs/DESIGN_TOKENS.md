# DLSAuto — design tokens

> **Згенеровано** з `src/app/globals.css` (`@theme`) скриптом `scripts/export-tokens.ts`.
> Не редагувати вручну — правити токени в `globals.css` і перегенерувати. CI падає при розбіжності.

Канон і підстави — `docs/stages/stage1/AUDIT.md`. Кольори 1:1 з експортом (близькі відтінки — різні токени). Компоненти використовують лише `var(--token)` / утиліти Tailwind, прив'язані до токенів.

## Шрифт
| токен | значення | нотатка |
|---|---|---|
| `--font-sans` | `var(--font-golos), sans-serif` |  |

## Кольори
| токен | значення | нотатка |
|---|---|---|
| `--color-neutral-0` | `#fcfcfd` | page + on-dark text |
| `--color-neutral-white` | `#ffffff` | card surfaces (kept as-is, own token) |
| `--color-neutral-50` | `#f6f6f6` | light full-width band |
| `--color-neutral-100` | `#f3f5f7` | input / sunken fill |
| `--color-neutral-200` | `#e6e9ee` | default border, subtle fill |
| `--color-neutral-300` | `#cdd2da` | dividers, border-on-dark, dashed |
| `--color-neutral-400` | `#a9b0bb` | placeholder / disabled, "closed" dot |
| `--color-neutral-500` | `#6b7380` | muted text |
| `--color-neutral-600` | `#4a5260` | secondary text |
| `--color-neutral-800` | `#2a303a` | chip hover on dark |
| `--color-neutral-900` | `#1e232b` | primary text, dark buttons/chips |
| `--color-neutral-950` | `#12161c` | dark header bar, hero overlay base |
| `--color-primary` | `#e0001b` | action / accent |
| `--color-primary-dark` | `#c00017` | radial-fill centre, header buttons |
| `--color-primary-dark-2` | `#b80016` | radial-fill centre, form buttons |
| `--color-success` | `#1f8a4c` | "перевірено" checks, success row |
| `--color-success-open` | `#1e9e5a` | "Зараз відкрито" status dot |
| `--color-success-tint` | `#e7f4ec` | success fill |
| `--color-error` | `#c62828` | form error |
| `--color-scrim` | `rgba(18, 22, 28, 0.6)` | hero overlay, modal backdrop |
| `--color-primary-tint` | `rgba(224, 0, 27, 0.08)` | secondary button hover |
| `--color-marker-shadow` | `rgba(0, 0, 0, 0.45)` | map marker |

## Радіуси
| токен | значення | нотатка |
|---|---|---|
| `--radius-xs` | `4px` |  |
| `--radius-sm` | `8px` |  |
| `--radius-md` | `12px` |  |
| `--radius-lg` | `16px` |  |
| `--radius-full` | `9999px` | pills, circles |
| `--radius-card` | `var(--radius-lg)` | alias → rounded-card |
| `--radius-inner` | `var(--radius-sm)` | alias → rounded-inner |

## Типографіка (шкала)
| токен | size | line-height | weight | letter-spacing | роль |
|---|---|---|---|---|---|
| `--text-d` | `56px` | 1.1 | 600 | -0.02em | hero H1 (desktop) |
| `--text-40` | `40px` | 1.15 | 600 | -0.02em | H1 / H2 desktop |
| `--text-32` | `32px` | 1.15 | 600 | -0.02em | H1 mobile / H2 |
| `--text-28` | `28px` | 1.2 | 600 | -0.02em | H2 tablet |
| `--text-24` | `24px` | 1.25 | 600 | -0.02em | H2 mobile |
| `--text-20` | `20px` | 1.4 | — | — | lead / subhead |
| `--text-18` | `18px` | 1.5 | — | — | body-lg / card title |
| `--text-16` | `16px` | 1.5 | — | — | body (base) |
| `--text-14` | `14px` | 20px | — | — | small |
| `--text-13` | `13px` | 18px | — | — | xs / hints / errors |
| `--text-12` | `12px` | 16px | — | — | label |
| `--text-11` | `11px` | 1 | — | — | badge |

## Тіні
| токен | значення | нотатка |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(18, 22, 28, 0.16)` | resting card / bar |
| `--shadow-md` | `0 12px 32px rgba(18, 22, 28, 0.16)` | hover / dropdown / toast |
| `--shadow-lg` | `0 24px 64px rgba(18, 22, 28, 0.24)` | modal |

## Відступи
| токен | значення | нотатка |
|---|---|---|
| `--space-2` | `2px` |  |
| `--space-4` | `4px` |  |
| `--space-8` | `8px` |  |
| `--space-12` | `12px` |  |
| `--space-16` | `16px` |  |
| `--space-24` | `24px` |  |
| `--space-32` | `32px` |  |
| `--space-40` | `40px` |  |
| `--space-48` | `48px` |  |
| `--space-64` | `64px` |  |
| `--space-80` | `80px` |  |
| `--space-96` | `96px` |  |
| `--space-128` | `128px` |  |
| `--space-160` | `160px` |  |
| `--space-200` | `200px` |  |
| `--space-240` | `240px` |  |
| `--space-320` | `320px` |  |

## Висоти контролів
| токен | значення | нотатка |
|---|---|---|
| `--control-h-32` | `32px` | S — chips, small |
| `--control-h-40` | `40px` | M — inner search input |
| `--control-h-44` | `44px` | mobile touch target (a11y, documented exception) |
| `--control-h-48` | `48px` | L — buttons, header controls |
| `--control-h-56` | `56px` | XL — form fields, hero capsule |

## Іконки
| токен | значення | нотатка |
|---|---|---|
| `--icon-16` | `16px` | in text / badges |
| `--icon-20` | `20px` | in buttons / actions |
| `--icon-24` | `24px` | standalone |
| `--icon-32` | `32px` | feature |
| `--icon-40` | `40px` | feature-lg |
| `--icon-stroke` | `1.75` | single stroke width for the line set |

## Тривалості та easing
| токен | значення | нотатка |
|---|---|---|
| `--duration-150` | `150ms` | micro (colour/border) |
| `--duration-200` | `200ms` | default |
| `--duration-300` | `300ms` | emphasis |
| `--duration-600` | `600ms` | signature (button fill, capsule ring) |
| `--ease-brand` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Лейаут
| токен | значення | нотатка |
|---|---|---|
| `--container-max` | `1312px` | content max-width across the site |
| `--border-hairline` | `1px` |  |
| `--border-thick` | `2px` |  |
| `--breakpoint-wide` | `1360px` |  |
