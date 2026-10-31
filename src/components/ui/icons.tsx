import type { SVGProps } from 'react'

/**
 * The single linear icon set (plus a few monochrome brand marks and the custom
 * auto glyphs from PROJECT_CONTEXT §2). One stroke weight (--icon-stroke) via
 * the .dls-icon class. Size comes from the --icon-* tokens through the `size`
 * prop — never a literal. No icon fonts, emoji, or background-image icons.
 */
export type IconSize = '16' | '20' | '24' | '32' | '40'

type IconProps = SVGProps<SVGSVGElement> & { size?: IconSize; title?: string }

const sized = (size: IconSize) => ({
  width: `var(--icon-${size})`,
  height: `var(--icon-${size})`,
})

/** Line icon — inherits colour via currentColor, stroke via .dls-icon. */
function Line({ size = '20', className, title, children, style, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={['dls-icon', className].filter(Boolean).join(' ')}
      style={{ ...sized(size), display: 'block', flexShrink: 0, ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/** Filled (brand) icon — uses currentColor fill, no stroke. */
function Filled({ size = '24', className, title, children, style, viewBox, ...rest }: IconProps) {
  return (
    <svg
      viewBox={viewBox ?? '0 0 24 24'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={className}
      style={{ ...sized(size), display: 'block', flexShrink: 0, fill: 'currentColor', ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/* --------------------------------------------------------------- line icons */

export const SearchIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Line>
)

export const HeartIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Line>
)

export const CartIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </Line>
)

export const ScaleIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3v18M6 7h12M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z" />
  </Line>
)

export const MenuIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Line>
)

export const CatalogIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Line>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m6 9 6 6 6-6" />
  </Line>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Line>
)

export const GlobeIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </Line>
)

export const CheckIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Line>
)

export const CloseIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Line>
)

export const PhoneIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Line>
)

export const CameraIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.5" />
  </Line>
)

export const MapPinIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Line>
)

export const ClockIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Line>
)

/* --------------------------------------------------------- brand marks (mono) */

export const TelegramIcon = (p: IconProps) => (
  <Filled {...p}>
    <path d="M21.94 4.3 18.6 20.03c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1 .5l.36-5.14 9.36-8.46c.4-.36-.09-.57-.63-.2L5.16 13.1.18 11.54c-1.08-.34-1.1-1.08.23-1.6L20.54 2.2c.9-.34 1.69.2 1.4 2.1Z" />
  </Filled>
)

export const ViberIcon = (p: IconProps) => (
  <Filled {...p}>
    <path d="M11.4 0C9.47.03 5.34.35 3.03 2.47 1.31 4.18.71 6.7.64 9.82c-.06 3.11-.14 8.95 5.49 10.53v2.42c0 .17.03.63.33.78.3.15.58-.02.84-.26.4-.38 2.2-2.5 2.2-2.5 3.86.3 6.82-.44 7.16-.55.78-.25 5.2-.82 5.92-6.68.74-6.04-.36-9.86-2.34-11.58l-.01-.01C19.63.9 14.87-.08 11.4 0Zm.1 1.76c2.94-.06 6.98.75 8.44 2.06 1.68 1.44 2.54 4.9 1.92 9.94-.6 4.9-4.18 5.2-4.84 5.42-.28.08-2.9.73-6.2.52 0 0-2.46 2.96-3.23 3.73-.12.12-.26.17-.35.14-.13-.03-.17-.19-.16-.42l.02-4.02c-4.77-1.32-4.5-6.3-4.44-8.9.05-2.6.55-4.73 2-6.18 1.96-1.78 5.48-2.03 7.13-2.07Zm.42 2.78a.35.35 0 0 0-.03.7c3.3.16 5.2 2.1 5.36 5.3a.35.35 0 1 0 .7-.03c-.17-3.56-2.4-5.81-6.02-5.98a.35.35 0 0 0-.01 0Zm-3.8.9a1.1 1.1 0 0 0-.66.16h-.03c-.42.24-.8.56-1.12.93-.25.3-.38.59-.42.87-.02.17 0 .34.05.5l.02.01c.15.42.44 1.06 1.01 1.95.37.58.8 1.13 1.27 1.64.24.25.49.49.76.71l.03.03.03.03.03.03.03.02c.23.27.47.52.72.76.5.47 1.06.9 1.64 1.27.9.57 1.53.86 1.95 1.01l.01.02c.16.05.33.07.5.05.28-.04.57-.17.87-.42.37-.32.69-.7.93-1.12v-.03a1.1 1.1 0 0 0-.2-1.3 9 9 0 0 0-1.36-1.05c-.3-.2-.6-.21-.87-.03l-.57.72c-.3.36-.83.31-.83.31l-.01.01c-1.97-.5-2.5-2.5-2.5-2.5s-.05-.52.32-.82l.72-.57c.18-.27.17-.58-.03-.87a9 9 0 0 0-1.05-1.37 1 1 0 0 0-.64-.28Zm4.27.98a.35.35 0 0 0-.04.7c1.76.2 2.54 1 2.73 2.72a.35.35 0 1 0 .7-.08c-.22-2.02-1.3-3.1-3.35-3.33a.35.35 0 0 0-.04-.01Zm.13 1.5a.35.35 0 0 0-.1.68c.82.2.98.37 1.17 1.24a.35.35 0 1 0 .69-.15c-.24-1.1-.65-1.56-1.69-1.76a.35.35 0 0 0-.07-.01Z" />
  </Filled>
)

export const TikTokIcon = (p: IconProps) => (
  <Filled {...p}>
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
  </Filled>
)
